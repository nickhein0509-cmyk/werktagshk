import Foundation
import Security

struct PublicConfig: Codable { let schemaVersion: Int; let supabaseURL: String; let publishableKey: String }
struct Account: Codable { let id: UUID; let email: String? }
struct AuthReply: Codable {
 let access_token: String; let refresh_token: String; let expires_in: Double; let user: Account
}
struct LoginSession: Codable {
 let config: PublicConfig
 var auth: AuthReply
 var expiresAt: Date
}
private struct LinkStatus: Decodable { let schemaVersion: Int; let linked: Bool; let userId: UUID }
enum Keychain {
 static let service="com.werktag.assistant.session"
 static func load() throws -> LoginSession? {
  let query: [String:Any]=[kSecClass as String:kSecClassGenericPassword,kSecAttrService as String:service,kSecAttrAccount as String:"session",kSecReturnData as String:true]
  var result: CFTypeRef?
  let status=SecItemCopyMatching(query as CFDictionary,&result)
  if status==errSecItemNotFound { return nil }
  guard status==errSecSuccess,let data=result as? Data else { throw TransferError.storage("Keychain") }
  return try JSONDecoder().decode(LoginSession.self,from:data)
 }
 static func save(_ session: LoginSession) throws {
  let data=try JSONEncoder().encode(session)
  let query: [String:Any]=[kSecClass as String:kSecClassGenericPassword,kSecAttrService as String:service,kSecAttrAccount as String:"session"]
  let change: [String:Any]=[kSecValueData as String:data,kSecAttrAccessible as String:kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly]
  var status=SecItemUpdate(query as CFDictionary,change as CFDictionary)
  if status==errSecItemNotFound { status=SecItemAdd(query.merging(change){_,new in new} as CFDictionary,nil) }
  guard status==errSecSuccess else { throw TransferError.storage("Keychain") }
 }
 static func remove() throws {
  let status=SecItemDelete([kSecClass as String:kSecClassGenericPassword,kSecAttrService as String:service,kSecAttrAccount as String:"session"] as CFDictionary)
  guard status==errSecSuccess || status==errSecItemNotFound else { throw TransferError.storage("Keychain") }
 }
}
final class NoRedirect: NSObject, URLSessionTaskDelegate {
 func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse, newRequest request: URLRequest, completionHandler: @escaping (URLRequest?) -> Void) { completionHandler(nil) }
}
struct HTTPFailure: Error, LocalizedError {
 let status: Int
 let retryAfter: TimeInterval?
 var errorDescription: String? { TransferError.http(status).errorDescription }
}
@MainActor
final class Connection {
 static let base=URL(string:"https://werk-tag.com/api/assistenz-native")!
 private let client: URLSession = {
  let c=URLSessionConfiguration.ephemeral
  c.timeoutIntervalForRequest=25; c.timeoutIntervalForResource=40
  c.httpShouldSetCookies=false; c.urlCache=nil
  return URLSession(configuration:c,delegate:NoRedirect(),delegateQueue:nil)
 }()
 private(set) var session: LoginSession?
 private var refreshTask: Task<String, Error>?
 private var generation = UUID()
 init() throws { session=try Keychain.load() }
 var account: Account? { session?.auth.user }
 private func request<T:Decodable>(_ type:T.Type,url:URL,body:Data?=nil,headers:[String:String]=[:]) async throws -> T {
  var r=URLRequest(url:url); r.httpMethod=body == nil ? "GET":"POST";r.httpBody=body
  r.setValue("application/json",forHTTPHeaderField:"Accept")
  if body != nil { r.setValue("application/json",forHTTPHeaderField:"Content-Type") }
  for (k,v) in headers { r.setValue(v,forHTTPHeaderField:k) }
  let (data,response)=try await client.data(for:r)
  guard let h=response as? HTTPURLResponse else { throw TransferError.invalidServer }
  guard (200...299).contains(h.statusCode) else { throw HTTPFailure(status:h.statusCode,retryAfter:h.value(forHTTPHeaderField:"Retry-After").flatMap(Double.init)) }
  guard data.count <= 4 * 1024 * 1024,
   h.value(forHTTPHeaderField:"Content-Type")?.lowercased().contains("application/json") == true
  else { throw TransferError.invalidServer }
  return try JSONDecoder().decode(type,from:data)
 }
 static func endpoint(_ action:String)->URL { base.appending(queryItems:[URLQueryItem(name:"action",value:action)]) }
 private func authURL(_ config:PublicConfig,grant:String)throws->URL {
  guard config.schemaVersion==1,let u=URL(string:config.supabaseURL),u.scheme=="https",
   let host=u.host,host.hasSuffix(".supabase.co"),host.split(separator:".").count==3,
   u.user==nil,u.password==nil,u.query==nil,u.fragment==nil,u.port==nil,
   u.path=="" || u.path=="/",!config.publishableKey.isEmpty else { throw TransferError.invalidServer }
  return u.appending(path:"auth/v1/token").appending(queryItems:[URLQueryItem(name:"grant_type",value:grant)])
 }
 // Authentication does not alter Keychain. AppModel first prepares the durable
 // queue, then accepts this session, so a storage failure cannot enable capture.
 func authenticate(email:String,password:String) async throws -> LoginSession {
  let config=try await request(PublicConfig.self,url:Self.endpoint("config"))
  let auth=try await request(AuthReply.self,url:authURL(config,grant:"password"),
   body:JSONEncoder().encode(["email":email,"password":password]),headers:["apikey":config.publishableKey])
  let status=try await request(LinkStatus.self,url:Self.endpoint("status"),headers:["Authorization":"Bearer "+auth.access_token])
  guard status.schemaVersion==1,status.linked,status.userId==auth.user.id else {throw TransferError.wrongAccount}
  return LoginSession(config:config,auth:auth,expiresAt:Date().addingTimeInterval(auth.expires_in))
 }
 func accept(_ authenticated: LoginSession) throws {
  try Keychain.save(authenticated)
  refreshTask?.cancel(); refreshTask=nil; generation=UUID(); session=authenticated
 }
 func verifyLink() async throws {
  guard let owner=account?.id else { throw TransferError.http(401) }
  let access=try await token()
  let status=try await request(LinkStatus.self,url:Self.endpoint("status"),headers:["Authorization":"Bearer "+access])
  guard status.schemaVersion==1,status.linked,status.userId==owner,account?.id==owner else {
   throw TransferError.wrongAccount
  }
 }
 func token() async throws -> String {
  guard let saved=session else {throw TransferError.http(401)}
  if saved.expiresAt.timeIntervalSinceNow>=60 { return saved.auth.access_token }
  if let refreshTask { return try await refreshTask.value }
  let expectedGeneration=generation
  let task=Task { @MainActor [self] () throws -> String in
   let auth=try await request(AuthReply.self,url:authURL(saved.config,grant:"refresh_token"),
    body:JSONEncoder().encode(["refresh_token":saved.auth.refresh_token]),headers:["apikey":saved.config.publishableKey])
   try Task.checkCancellation()
   guard generation==expectedGeneration,session?.auth.user.id==saved.auth.user.id else { throw CancellationError() }
   guard auth.user.id==saved.auth.user.id else {throw TransferError.wrongAccount}
   let updated=LoginSession(config:saved.config,auth:auth,expiresAt:Date().addingTimeInterval(auth.expires_in))
   try Keychain.save(updated);session=updated
   return auth.access_token
  }
  refreshTask=task
  defer { if generation==expectedGeneration { refreshTask=nil } }
  return try await task.value
 }
 func send(_ batch:TransferBatch) async throws -> Receipt {
  let access=try await token()
  return try await request(Receipt.self,url:Self.endpoint("ingest"),body:JSONEncoder().encode(batch),headers:["Authorization":"Bearer "+access])
 }
 func journey(day: String, deviceId: UUID) async throws -> [LocationRecord] {
  guard JourneyDay.interval(day) != nil else { throw TransferError.invalidServer }
  let access=try await token()
  let url=Self.endpoint("journey").appending(queryItems:[
   URLQueryItem(name:"date",value:day),URLQueryItem(name:"deviceId",value:deviceId.uuidString.lowercased())
  ])
  let result=try await request(JourneyResponse.self,url:url,headers:["Authorization":"Bearer "+access])
  return try result.validated(for:day,device:deviceId)
 }
 func cancelRequests() { client.getAllTasks { tasks in tasks.forEach { $0.cancel() } } }
 func logout() throws {
  try Keychain.remove()
  generation=UUID();refreshTask?.cancel();refreshTask=nil;cancelRequests();session=nil
 }
}
