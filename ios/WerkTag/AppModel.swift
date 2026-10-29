import SwiftUI
import Observation
import Network
import BackgroundTasks
import UIKit

@MainActor @Observable
final class AppModel {
 static let shared=AppModel()
 var account: Account?
 var pending=0
 var confirmed=0
 var lastReceipt: String?
 var message="Mit deinem WerkTag-Konto verbinden."
 var storageError: String?
 var isBusy=false
 var isReadingHealth=false
 var recording=false
 var locationStatus="Aufzeichnung pausiert."
 var healthEnabled=false
 var healthDays:[HealthDay]=[]
 var positions:[LocationRecord]=[]
 var nextRetry:Date?
 var uploadPaused=false
 @ObservationIgnored private var connection:Connection?
 @ObservationIgnored private var queue:DurableQueue?
 @ObservationIgnored private let location=LocationRecorder()
 @ObservationIgnored private let health=HealthReader()
 @ObservationIgnored private let monitor=NWPathMonitor()
 @ObservationIgnored private var attempt=0
 @ObservationIgnored private var healthChecked:Date?
 @ObservationIgnored private var uploadTask:Task<Void,Never>?
 private init() {
  do {
   let c=try Connection();connection=c;account=c.account
   if let account {try openQueue(account.id)}
  } catch {storageError=error.localizedDescription}
  location.onRecord={ [weak self] record in self?.record(record) }
  location.onStatus={ [weak self] status in
   self?.locationStatus=status;self?.recording=self?.location.running ?? false
  }
  monitor.pathUpdateHandler={ [weak self] path in
   if path.status == .satisfied {Task { @MainActor in self?.scheduleUpload() }}
  }
  monitor.start(queue:DispatchQueue(label:"com.werktag.network"))
 }
 private func openQueue(_ id:UUID) throws {
  let folder=FileManager.default.urls(for:.applicationSupportDirectory,in:.userDomainMask)[0].appendingPathComponent("Pending",isDirectory:true)
  queue=try DurableQueue(directory:folder,accountId:id)
  positions=Array((queue?.state.events.compactMap(\.location) ?? []).suffix(1000))
  healthEnabled=UserDefaults.standard.bool(forKey:"health."+id.uuidString)
  refreshCounts();message=pending>0 ? "Daten warten auf Übertragung.":"Verbunden. Noch keine neue Übertragung."
 }
 private func refreshCounts(){
  pending=queue?.state.events.count ?? 0;confirmed=queue?.state.acknowledgedCount ?? 0;lastReceipt=queue?.state.lastReceiptAt
 }
 func login(email:String,password:String) async {
  guard !isBusy else{return};isBusy=true;defer{isBusy=false}
  do {
   if connection == nil {connection=try Connection()}
   try await connection!.login(email:email,password:password)
   guard let a=connection?.account else{throw TransferError.http(401)}
   account=a;try openQueue(a.id);storageError=nil;uploadPaused=false;nextRetry=nil;attempt=0
  } catch {message=error.localizedDescription}
 }
 func logout() {
  guard !isBusy,!isReadingHealth else{return}
  do {
   try connection?.logout();location.stop();uploadTask?.cancel()
   account=nil;queue=nil;positions=[];healthDays=[];healthEnabled=false;recording=false
   pending=0;confirmed=0;lastReceipt=nil;nextRetry=nil;uploadPaused=false;healthChecked=nil
   message="Abgemeldet. Ausstehende Daten bleiben ihrem bisherigen Konto zugeordnet."
  }catch{message=error.localizedDescription}
 }
 func startLocation(){guard account != nil,storageError==nil else{return};location.start();recording=location.running}
 func stopLocation(){location.stop();recording=false}
 private func record(_ record:LocationRecord) {
  guard let queue,account?.id==queue.state.accountId else{return}
  do {
   try queue.append([TransferEvent(location:record)])
   positions.append(record);if positions.count>1000{positions.removeFirst(positions.count-1000)}
   refreshCounts();scheduleUpload()
  }catch{location.stop();recording=false;storageError=error.localizedDescription}
 }
 func enableHealth() async {
  guard let owner=account?.id,!isReadingHealth else{return}
  isReadingHealth=true
  do {
   try await health.authorize()
   guard account?.id==owner else{isReadingHealth=false;return}
   healthEnabled=true;UserDefaults.standard.set(true,forKey:"health."+owner.uuidString)
  }catch{message=error.localizedDescription}
  isReadingHealth=false
  if healthEnabled {await readHealth()}
 }
 func disableHealth(){
  guard let owner=account?.id,!isReadingHealth else{return}
  healthEnabled=false;UserDefaults.standard.set(false,forKey:"health."+owner.uuidString)
  message="Health-Abgleich pausiert. Bereits gespeicherte Werte bleiben erhalten."
 }
 func readHealth() async {
  guard let owner=account?.id,healthEnabled,!isReadingHealth,storageError==nil else{return}
  isReadingHealth=true;defer{isReadingHealth=false}
  do {
   let days=try await health.readWeek()
   guard account?.id==owner,let queue,queue.state.accountId==owner,healthEnabled else{return}
   let available=days.filter{$0.steps != nil || $0.activeEnergyKcal != nil || $0.heartRateBpm != nil}
   if !available.isEmpty {try queue.append(available.map{TransferEvent(health:$0)})}
   healthDays=days;healthChecked=Date();refreshCounts()
   message="Health-Abfrage abgeschlossen. Fehlende Werte können auch fehlende Lesefreigaben bedeuten."
   scheduleUpload()
  }catch{message="Health konnte nicht gelesen oder sicher gespeichert werden. Bitte entsperren und erneut versuchen."}
 }
 func scheduleUpload(){
  guard uploadTask==nil else{return}
  uploadTask=Task { [weak self] in
   guard let self else{return}
   await self.sync();self.uploadTask=nil
  }
 }
 func sync(force:Bool=false) async {
  guard !isBusy,let account,let queue,let connection,storageError==nil else{return}
  if !force && (uploadPaused || (nextRetry.map{$0>Date()} ?? false)){return}
  guard !queue.state.events.isEmpty else{return}
  isBusy=true;defer{isBusy=false;refreshCounts()}
  let background=UIApplication.shared.beginBackgroundTask(withName:"WerkTag Upload") { [weak connection] in
   Task { @MainActor in connection?.cancelRequests() }
  }
  defer {if background != .invalid {UIApplication.shared.endBackgroundTask(background)}}
  do {
   for _ in 0..<5 {
    try Task.checkCancellation()
    let batch=try queue.batch(for:account.id)
    if batch.events.isEmpty {break}
    let receipt=try await connection.send(batch)
    try queue.acknowledge(receipt,batch:batch,account:account.id);refreshCounts()
   }
   attempt=0;nextRetry=nil;uploadPaused=false
   message=pending==0 ? "Alle ausstehenden Daten von WerkTag bestätigt.":"Teilübertragung bestätigt. Weitere Daten stehen aus."
  }catch {
   message=error.localizedDescription;attempt+=1
   if let failure=error as? HTTPFailure {
    uploadPaused=(400...499).contains(failure.status) && failure.status != 408 && failure.status != 429
    nextRetry=Date().addingTimeInterval(DurableQueue.retryDelay(attempt:attempt,retryAfter:failure.retryAfter))
   }else if error is TransferError {
    uploadPaused=true
   }else {nextRetry=Date().addingTimeInterval(DurableQueue.retryDelay(attempt:attempt))}
  }
 }
 func foreground() async {
  if healthEnabled && (healthChecked.map{Date().timeIntervalSince($0)>1800} ?? true){await readHealth()}
  await sync();scheduleBackground()
 }
 func scheduleBackground(){
  let r=BGAppRefreshTaskRequest(identifier:"com.werktag.assistant.upload")
  r.earliestBeginDate=Date(timeIntervalSinceNow:15*60)
  do {try BGTaskScheduler.shared.submit(r)}catch{/* Best effort; foreground and location callbacks still retry. */}
 }
 func runBackground(_ task:BGAppRefreshTask){
  scheduleBackground()
  let work=Task { [weak self] in
   guard let self else{task.setTaskCompleted(success:false);return}
   if self.healthEnabled {await self.readHealth()}
   await self.sync()
   task.setTaskCompleted(success:self.pending==0)
  }
  task.expirationHandler={work.cancel()}
 }
}
