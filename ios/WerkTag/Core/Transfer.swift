import Foundation

public struct LocationRecord: Codable, Equatable, Sendable {
 public var tst: Int
 public var lat: Double
 public var lon: Double
 public var acc: Double
 public var alt: Double?
 public var vel: Double?
 public var cog: Double?
 public init(tst: Int, lat: Double, lon: Double, acc: Double, alt: Double? = nil, vel: Double? = nil, cog: Double? = nil) {
  self.tst=tst; self.lat=lat; self.lon=lon; self.acc=acc; self.alt=alt; self.vel=vel; self.cog=cog
 }
}
public struct HealthDay: Codable, Equatable, Sendable {
 public var date: String
 public var timezone = "Europe/Berlin"
 public var steps: Int?
 public var activeEnergyKcal: Double?
 public var heartRateBpm: Double?
 public init(date: String, steps: Int? = nil, activeEnergyKcal: Double? = nil, heartRateBpm: Double? = nil) {
  self.date=date; self.steps=steps; self.activeEnergyKcal=activeEnergyKcal; self.heartRateBpm=heartRateBpm
 }
}
public struct TransferEvent: Codable, Identifiable, Equatable, Sendable {
 public var id: UUID
 public var kind: String
 public var capturedAt: String
 public var location: LocationRecord?
 public var health: HealthDay?
 public init(location: LocationRecord) {
  id=UUID(); kind="location"; capturedAt=ISO8601DateFormatter().string(from: Date()); self.location=location
 }
 public init(health: HealthDay) {
  id=UUID(); kind="health"; capturedAt=ISO8601DateFormatter().string(from: Date()); self.health=health
 }
}
public struct TransferBatch: Codable, Sendable {
 public var schemaVersion = 1
 public var deviceId: UUID
 public var events: [TransferEvent]
 public init(deviceId: UUID, events: [TransferEvent]) { self.deviceId=deviceId; self.events=events }
}
public struct Receipt: Codable, Sendable {
 public var schemaVersion: Int
 public var accepted: [UUID]
 public var receivedAt: String
 public init(schemaVersion: Int = 1, accepted: [UUID], receivedAt: String) {
  self.schemaVersion=schemaVersion; self.accepted=accepted; self.receivedAt=receivedAt
 }
}
public enum TransferError: Error, LocalizedError {
 case wrongAccount, invalidReceipt, storageFull, invalidServer, http(Int), storage(String)
 public var errorDescription: String? {
  switch self {
  case .wrongAccount: return "Diese Daten gehören zu einem anderen Konto."
  case .invalidReceipt: return "WerkTag hat die Speicherung nicht eindeutig bestätigt."
  case .storageFull: return "Der lokale Speicher ist voll. Bitte zuerst synchronisieren."
  case .invalidServer: return "Die sichere App-Verbindung ist noch nicht eingerichtet."
  case .http(let status):
   if status == 401 { return "Bitte erneut anmelden. Deine ausstehenden Daten bleiben erhalten." }
   if status == 403 { return "Dieses Konto ist noch nicht mit deiner Assistenz verbunden." }
   if status == 404 || status == 405 { return "Die native WerkTag-Verbindung ist noch nicht veröffentlicht." }
   if status == 409 { return "WerkTag meldet einen Datenkonflikt. Die Daten bleiben auf dem iPhone." }
   return "Übertragung fehlgeschlagen (\(status)). Die Daten bleiben auf dem iPhone."
  case .storage: return "Daten konnten nicht sicher auf dem iPhone gespeichert werden."
  }
 }
}
public struct QueueState: Codable, Sendable {
 public let accountId: UUID
 public let deviceId: UUID
 public var events: [TransferEvent] = []
 public var lastReceiptAt: String?
 public var acknowledgedCount = 0
}
/// Single owner; memory changes only after an atomic durable write succeeds.
public final class DurableQueue {
 public private(set) var state: QueueState
 private let file: URL
 private let write: (Data, URL) throws -> Void
 public init(directory: URL, accountId: UUID, writer: ((Data, URL) throws -> Void)? = nil) throws {
  try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
  file=directory.appendingPathComponent(accountId.uuidString + ".json")
  write=writer ?? { data, url in
   #if os(iOS)
   try data.write(to: url, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
   #else
   try data.write(to: url, options: .atomic)
   #endif
   var value=url; var resources=URLResourceValues(); resources.isExcludedFromBackup=true
   try value.setResourceValues(resources)
  }
  if FileManager.default.fileExists(atPath: file.path) {
   state=try JSONDecoder().decode(QueueState.self, from: Data(contentsOf: file))
   guard state.accountId==accountId else { throw TransferError.wrongAccount }
  } else {
   state=QueueState(accountId:accountId,deviceId:UUID())
   try write(JSONEncoder().encode(state),file)
  }
 }
 private func commit(_ next: QueueState) throws {
  try write(JSONEncoder().encode(next),file); state=next
 }
 public func append(_ events: [TransferEvent]) throws {
  guard state.events.count+events.count<=50000 else { throw TransferError.storageFull }
  var next=state
  let existing=Set(state.events.map(\.id))
  next.events += events.filter { !existing.contains($0.id) }
  try commit(next)
 }
 public func batch(for account: UUID) throws -> TransferBatch {
  guard account==state.accountId else { throw TransferError.wrongAccount }
  return TransferBatch(deviceId:state.deviceId,events:Array(state.events.prefix(100)))
 }
 public func acknowledge(_ receipt: Receipt, batch: TransferBatch, account: UUID) throws {
  guard account==state.accountId, batch.deviceId==state.deviceId else { throw TransferError.wrongAccount }
  let sent=Set(batch.events.map(\.id)), received=Set(receipt.accepted)
  guard receipt.schemaVersion==1, received==sent, receipt.accepted.count==sent.count,
   ISO8601DateFormatter().date(from:receipt.receivedAt) != nil || Self.fractionalDate(receipt.receivedAt) != nil
  else { throw TransferError.invalidReceipt }
  var next=state
  next.events.removeAll { received.contains($0.id) }
  next.lastReceiptAt=receipt.receivedAt
  next.acknowledgedCount += state.events.count-next.events.count
  try commit(next)
 }
 public static func fractionalDate(_ string: String) -> Date? {
  let f=ISO8601DateFormatter();f.formatOptions=[.withInternetDateTime,.withFractionalSeconds];return f.date(from:string)
 }
 public static func retryDelay(attempt: Int, retryAfter: TimeInterval? = nil) -> TimeInterval {
  max(min(3600, pow(2, Double(min(max(attempt,0),10)))*5), min(max(retryAfter ?? 0,0),86400))
 }
}
