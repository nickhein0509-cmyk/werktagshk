import SwiftUI
import Observation
import Network
import BackgroundTasks
import UIKit

enum LinkState: Equatable {
 case signedOut, saved, checking, verified(Date), unavailable(String)
 var title: String {
  switch self {
  case .signedOut: return "Noch nicht verbunden"
  case .saved: return "Anmeldung auf diesem iPhone gespeichert"
  case .checking: return "WerkTag-Verbindung wird geprüft"
  case .verified: return "Konto von WerkTag bestätigt"
  case .unavailable: return "Verbindung derzeit nicht bestätigt"
  }
 }
 var symbol: String {
  switch self {
  case .verified: return "checkmark.shield"
  case .checking: return "arrow.triangle.2.circlepath"
  case .unavailable: return "wifi.exclamationmark"
  default: return "person.crop.circle"
  }
 }
 var detail: String {
  switch self {
  case .signedOut: return "Melde dich mit dem WerkTag-Konto deiner Assistenz an."
  case .saved: return "Die aktuelle Zuordnung wird beim nächsten Kontakt mit WerkTag geprüft."
  case .checking: return "Deine gespeicherten Daten bleiben währenddessen erhalten."
  case .verified(let date): return "Geprüft um \(date.formatted(date: .omitted, time: .shortened)). Übertragungen werden separat bestätigt."
  case .unavailable(let message): return message
  }
 }
}

@MainActor @Observable
final class AppModel {
 static let shared = AppModel()
 var account: Account?
 var pending = 0
 var confirmed = 0
 var lastReceipt: String?
 var message = "Mit deinem WerkTag-Konto verbinden."
 var storageError: String?
 var isBusy = false
 var isReadingHealth = false
 var recording = false
 var locationStatus = "Aufzeichnung pausiert."
 var healthEnabled = false
 var healthDays: [HealthDay] = []
 var nextRetry: Date?
 var uploadPaused = false
 private(set) var linkState: LinkState = .signedOut
 private(set) var isCheckingConnection = false
 private(set) var journeyDate = JourneyDay.string(Date())
 private(set) var journey = JourneyAnalysis()
 private(set) var isLoadingJourney = false
 private(set) var journeyError: String?
 private(set) var journeyLoadedAt: Date?
 private(set) var showsExampleData = false

 @ObservationIgnored private var connection: Connection?
 @ObservationIgnored private var queue: DurableQueue?
 @ObservationIgnored private let location = LocationRecorder()
 @ObservationIgnored private let health = HealthReader()
 @ObservationIgnored private let monitor = NWPathMonitor()
 @ObservationIgnored private var attempt = 0
 @ObservationIgnored private var healthChecked: Date?
 @ObservationIgnored private var uploadTask: Task<Void, Never>?
 @ObservationIgnored private var pendingLocations: [LocationRecord] = []
 @ObservationIgnored private var confirmedLocations: [LocationRecord] = []
 @ObservationIgnored private var remoteLocations: [LocationRecord] = []
 @ObservationIgnored private var journeyRequest = UUID()
 @ObservationIgnored private var isUITesting = false

 var canRecord: Bool {
  account != nil && queue?.state.accountId == account?.id && storageError == nil && !isUITesting
 }

 private init() {
  #if DEBUG
  if ProcessInfo.processInfo.arguments.contains("--uitest-journey") {
   isUITesting = true; showsExampleData = true
   let start = Int(JourneyDay.calendar.startOfDay(for: Date()).timeIntervalSince1970) + 9 * 3600
   confirmedLocations = [
    LocationRecord(tst: start, lat: 52.5163, lon: 13.3777, acc: 8),
    LocationRecord(tst: start + 120, lat: 52.5171, lon: 13.3820, acc: 9),
    LocationRecord(tst: start + 240, lat: 52.5178, lon: 13.3870, acc: 8)
   ]
   pendingLocations = [
    LocationRecord(tst: start + 3600, lat: 52.5200, lon: 13.4050, acc: 12),
    LocationRecord(tst: start + 3720, lat: 52.5210, lon: 13.4100, acc: 10)
   ]
   message = "Vorschau mit synthetischen Beispieldaten."
   rebuildJourney(); return
  }
  if ProcessInfo.processInfo.arguments.contains("--uitest-storage-error") {
   isUITesting = true
   account = Account(id: UUID(), email: "Speicherprüfung")
   storageError = TransferError.storage("UI test").localizedDescription
   linkState = .saved; return
  }
  #endif
  do {
   let client = try Connection(); connection = client; account = client.account
   if let account {
    linkState = .saved
    adoptQueue(try makeQueue(account.id))
   }
  } catch { storageError = error.localizedDescription }
  location.onRecord = { [weak self] record in self?.record(record) }
  location.onStatus = { [weak self] status in
   self?.locationStatus = status; self?.recording = self?.location.running ?? false
  }
  monitor.pathUpdateHandler = { [weak self] path in
   if path.status == .satisfied { Task { @MainActor in self?.scheduleUpload() } }
  }
  monitor.start(queue: DispatchQueue(label: "com.werktag.network"))
 }

 private func makeQueue(_ id: UUID) throws -> DurableQueue {
  let folder = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
   .appendingPathComponent("Pending", isDirectory: true)
  return try DurableQueue(directory: folder, accountId: id)
 }
 private func adoptQueue(_ prepared: DurableQueue) {
  queue = prepared
  healthEnabled = UserDefaults.standard.bool(forKey: "health." + prepared.state.accountId.uuidString)
  storageError = nil; refreshCounts()
  message = pending > 0 ? "Daten warten auf Übertragung." : "Noch keine neue Übertragung."
 }
 func retryStorage() {
  guard let owner = account?.id, !isBusy, !isUITesting else { return }
  do { adoptQueue(try makeQueue(owner)) }
  catch { storageError = error.localizedDescription }
 }
 private func refreshCounts() {
  pending = queue?.state.events.count ?? 0
  confirmed = queue?.state.acknowledgedCount ?? 0
  lastReceipt = queue?.state.lastReceiptAt
  pendingLocations = queue?.state.events.compactMap(\.location) ?? []
  rebuildJourney()
 }
 private func rebuildJourney() {
  journey = JourneyAnalysis(samples: JourneyAnalysis.merge(remote: remoteLocations,
   pending: pendingLocations, confirmed: confirmedLocations, day: journeyDate))
 }

 func login(email: String, password: String) async {
  guard !isBusy, account == nil else { return }
  isBusy = true; defer { isBusy = false }
  do {
   if connection == nil { connection = try Connection() }
   guard let connection else { throw TransferError.invalidServer }
   let authenticated = try await connection.authenticate(email: email, password: password)
   let prepared: DurableQueue
   do { prepared = try makeQueue(authenticated.auth.user.id) }
   catch { storageError = error.localizedDescription; throw error }
   // No account is exposed to capture until both durable stores are ready.
   try connection.accept(authenticated)
   account = authenticated.auth.user; adoptQueue(prepared)
   linkState = .verified(Date()); uploadPaused = false; nextRetry = nil; attempt = 0
  } catch { message = error.localizedDescription }
 }
 func logout() {
  guard !isBusy, !isReadingHealth else { return }
  do {
   try connection?.logout(); location.stop(); uploadTask?.cancel(); uploadTask = nil
   journeyRequest = UUID(); account = nil; queue = nil
   pendingLocations = []; confirmedLocations = []; remoteLocations = []; rebuildJourney()
   healthDays = []; healthEnabled = false; recording = false; storageError = nil
   pending = 0; confirmed = 0; lastReceipt = nil; nextRetry = nil; uploadPaused = false; healthChecked = nil
   linkState = .signedOut; journeyError = nil; journeyLoadedAt = nil; isLoadingJourney = false
   message = "Abgemeldet. Ausstehende Daten bleiben ihrem bisherigen Konto zugeordnet."
  } catch { message = error.localizedDescription }
 }
 func verifyConnection() async {
  guard !isUITesting, let owner = account?.id, let connection, !isCheckingConnection else { return }
  let previousState = linkState
  isCheckingConnection = true; linkState = .checking
  defer { isCheckingConnection = false }
  do {
   try await connection.verifyLink()
   guard account?.id == owner else { return }
   linkState = .verified(Date())
  } catch {
   guard account?.id == owner else { return }
   if Task.isCancelled { linkState = previousState; return }
   linkState = .unavailable(error.localizedDescription)
  }
 }

 func loadJourney(day: String? = nil) async {
  guard !isUITesting else { return }
  let selected = day ?? journeyDate
  guard JourneyDay.interval(selected) != nil else { return }
  if selected != journeyDate {
   journeyDate = selected; remoteLocations = []; journeyLoadedAt = nil; rebuildJourney()
  }
  journeyRequest = UUID(); let request = journeyRequest
  journeyError = nil
  guard let owner = account?.id, let queue, queue.state.accountId == owner, let connection else {
   isLoadingJourney = false; return
  }
  let deviceId = queue.state.deviceId
  isLoadingJourney = true
  defer { if journeyRequest == request { isLoadingJourney = false } }
  do {
   let points = try await connection.journey(day: selected, deviceId: deviceId)
   guard !Task.isCancelled, journeyRequest == request, account?.id == owner else { return }
   remoteLocations = points; journeyLoadedAt = Date(); linkState = .verified(Date())
   let serverKeys = Set(points.map { JourneySample(record: $0, confirmed: true).id })
   confirmedLocations.removeAll { serverKeys.contains(JourneySample(record: $0, confirmed: true).id) }
   rebuildJourney()
  } catch {
   guard !Task.isCancelled, journeyRequest == request, account?.id == owner else { return }
   journeyError = error.localizedDescription
   if let failure = error as? HTTPFailure, failure.status == 401 || failure.status == 403 {
    linkState = .unavailable(error.localizedDescription)
   }
  }
 }

 func startLocation() {
  guard canRecord else { return }
  location.start(); recording = location.running
 }
 func stopLocation() { location.stop(); recording = false }
 private func record(_ record: LocationRecord) {
  guard canRecord, let queue else { return }
  do {
   try queue.append([TransferEvent(location: record)])
   refreshCounts(); scheduleUpload()
  } catch { location.stop(); recording = false; storageError = error.localizedDescription }
 }
 func enableHealth() async {
  guard let owner = account?.id, canRecord, !isReadingHealth else { return }
  isReadingHealth = true
  do {
   try await health.authorize()
   guard account?.id == owner else { isReadingHealth = false; return }
   healthEnabled = true; UserDefaults.standard.set(true, forKey: "health." + owner.uuidString)
  } catch { message = error.localizedDescription }
  isReadingHealth = false
  if healthEnabled { await readHealth() }
 }
 func disableHealth() {
  guard let owner = account?.id, !isReadingHealth else { return }
  healthEnabled = false; UserDefaults.standard.set(false, forKey: "health." + owner.uuidString)
  message = "Health-Abgleich pausiert. Bereits gespeicherte Werte bleiben erhalten."
 }
 func readHealth() async {
  guard let owner = account?.id, healthEnabled, !isReadingHealth, storageError == nil, !isUITesting else { return }
  isReadingHealth = true; defer { isReadingHealth = false }
  do {
   let days = try await health.readWeek()
   guard account?.id == owner, let queue, queue.state.accountId == owner, healthEnabled else { return }
   let available = days.filter { $0.steps != nil || $0.activeEnergyKcal != nil || $0.heartRateBpm != nil }
   if !available.isEmpty { try queue.append(available.map { TransferEvent(health: $0) }) }
   healthDays = days; healthChecked = Date(); refreshCounts()
   message = "Health-Abfrage abgeschlossen. Fehlende Werte können auch fehlende Lesefreigaben bedeuten."
   scheduleUpload()
  } catch { message = "Health konnte nicht gelesen oder sicher gespeichert werden. Bitte entsperren und erneut versuchen." }
 }
 func scheduleUpload() {
  guard uploadTask == nil, !isUITesting else { return }
  uploadTask = Task { [weak self] in
   guard let self else { return }
   await self.sync(); self.uploadTask = nil
  }
 }
 func sync(force: Bool = false) async {
  guard !isBusy, let account, let queue, let connection, storageError == nil, !isUITesting else { return }
  if !force && (uploadPaused || (nextRetry.map { $0 > Date() } ?? false)) { return }
  guard !queue.state.events.isEmpty else { return }
  isBusy = true; defer { isBusy = false; refreshCounts() }
  let background = UIApplication.shared.beginBackgroundTask(withName: "WerkTag Upload") { [weak connection] in
   Task { @MainActor in connection?.cancelRequests() }
  }
  defer { if background != .invalid { UIApplication.shared.endBackgroundTask(background) } }
  do {
   for _ in 0..<5 {
    try Task.checkCancellation()
    let batch = try queue.batch(for: account.id)
    if batch.events.isEmpty { break }
    let receipt = try await connection.send(batch)
    try queue.acknowledge(receipt, batch: batch, account: account.id)
    confirmedLocations.append(contentsOf: batch.events.compactMap(\.location))
    refreshCounts(); linkState = .verified(Date())
   }
   attempt = 0; nextRetry = nil; uploadPaused = false
   message = pending == 0 ? "Alle ausstehenden Daten von WerkTag bestätigt." : "Teilübertragung bestätigt. Weitere Daten stehen aus."
   await loadJourney()
  } catch {
   guard !Task.isCancelled else { return }
   message = error.localizedDescription; attempt += 1
   if let failure = error as? HTTPFailure {
    uploadPaused = (400...499).contains(failure.status) && failure.status != 408 && failure.status != 429
    if failure.status == 401 || failure.status == 403 { linkState = .unavailable(error.localizedDescription) }
    nextRetry = Date().addingTimeInterval(DurableQueue.retryDelay(attempt: attempt, retryAfter: failure.retryAfter))
   } else if error is TransferError { uploadPaused = true }
   else { nextRetry = Date().addingTimeInterval(DurableQueue.retryDelay(attempt: attempt)) }
  }
 }
 func foreground() async {
  guard !isUITesting else { return }
  await verifyConnection()
  if healthEnabled && (healthChecked.map { Date().timeIntervalSince($0) > 1800 } ?? true) { await readHealth() }
  await sync(); await loadJourney(); scheduleBackground()
 }
 func scheduleBackground() {
  guard !isUITesting else { return }
  let request = BGAppRefreshTaskRequest(identifier: "com.werktag.assistant.upload")
  request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60)
  do { try BGTaskScheduler.shared.submit(request) } catch { /* Foreground and location callbacks still retry. */ }
 }
 func runBackground(_ task: BGAppRefreshTask) {
  scheduleBackground()
  let work = Task { [weak self] in
   guard let self else { task.setTaskCompleted(success: false); return }
   if self.healthEnabled { await self.readHealth() }
   await self.sync()
   task.setTaskCompleted(success: self.pending == 0)
  }
  task.expirationHandler = { work.cancel() }
 }
}
