import XCTest

final class SmokeTests: XCTestCase {
 @MainActor func testFreshInstallHasWorkingTabsAndNoStorageError() throws {
  continueAfterFailure = false
  let app = launch()
  XCTAssertTrue(app.navigationBars["Heute"].waitForExistence(timeout: 30))
  XCTAssertTrue(app.staticTexts["Dein Tag auf einen Blick."].exists)
  XCTAssertFalse(app.descendants(matching: .any).matching(identifier: "storage-error").firstMatch.exists,
   "A fresh installation must be able to read its empty Keychain without a storage error.")
  let transfer = app.buttons["Jetzt übertragen"]
  reveal(transfer, in: app)
  XCTAssertFalse(transfer.isEnabled)
  capture(app, "Heute")

  app.tabBars.buttons["Wege"].tap()
  XCTAssertTrue(app.navigationBars["Wege"].exists)
  XCTAssertTrue(app.staticTexts["Dein nächster Weg"].exists)
  let record = app.buttons["Weg aufzeichnen"]
  reveal(record, in: app)
  XCTAssertFalse(record.isEnabled)
  capture(app, "Wege")

  app.tabBars.buttons["Verbindung"].tap()
  XCTAssertTrue(app.navigationBars["Verbindung"].exists)
  XCTAssertTrue(app.textFields["E-Mail"].exists)
  XCTAssertTrue(app.secureTextFields["Passwort"].exists)
  XCTAssertFalse(app.buttons["Anmelden"].isEnabled)
  XCTAssertEqual(app.alerts.count, 0, "Location and Health must not request access on first launch.")
  capture(app, "Verbindung")
 }

 @MainActor func testSyntheticJourneySeparatesGapsAndSelectsAnIndividualSection() throws {
  continueAfterFailure = false
  let app = launch(extra: ["--uitest-journey"])
  XCTAssertTrue(app.navigationBars["Heute"].waitForExistence(timeout: 30))
  app.tabBars.buttons["Wege"].tap()
  XCTAssertTrue(app.staticTexts["journey-example"].waitForExistence(timeout: 10))
  let map = app.descendants(matching: .any).matching(identifier: "journey-map").firstMatch
  XCTAssertTrue(map.waitForExistence(timeout: 10))
  XCTAssertEqual(map.label, "Karte mit 2 getrennten Wegabschnitten")
  capture(app, "Wege-Beispiel")

  let second = app.buttons["journey-segment-2"]
  reveal(second, in: app)
  XCTAssertTrue(second.isHittable)
  second.tap()
  toTop(app)
  XCTAssertEqual(map.label, "Karte mit 1 getrennten Wegabschnitten")
  capture(app, "Wege-Abschnitt")
  let all = app.buttons["journey-fit"]
  reveal(all, in: app)
  all.tap()
  XCTAssertEqual(map.label, "Karte mit 2 getrennten Wegabschnitten")
  let receipts = app.staticTexts["journey-receipts"]
  reveal(receipts, in: app)
  XCTAssertEqual(receipts.label, "3 Punkte bestätigt · 2 noch ausstehend")
  XCTAssertEqual(app.alerts.count, 0)
 }

 @MainActor func testStorageFailureDisablesCaptureAndShowsRecovery() throws {
  continueAfterFailure = false
  let app = launch(extra: ["--uitest-storage-error"])
  XCTAssertTrue(app.navigationBars["Heute"].waitForExistence(timeout: 30))
  app.tabBars.buttons["Wege"].tap()
  let record = app.buttons["Weg aufzeichnen"]
  reveal(record, in: app)
  XCTAssertFalse(record.isEnabled)
  let error = app.descendants(matching: .any).matching(identifier: "storage-error").firstMatch
  reveal(error, in: app)
  XCTAssertTrue(error.exists)
  XCTAssertTrue(app.buttons["Speicher erneut prüfen"].exists)
  XCTAssertEqual(app.alerts.count, 0)
  capture(app, "Speicherfehler")
 }

 @MainActor private func launch(extra: [String] = []) -> XCUIApplication {
  let app = XCUIApplication()
  app.launchArguments = ["-AppleLanguages", "(de)", "-AppleLocale", "de_DE"] + extra
  app.launch()
  return app
 }
 @MainActor private func reveal(_ element: XCUIElement, in app: XCUIApplication) {
  for _ in 0..<8 {
   if element.exists && element.isHittable { return }
   edgeScroll(app, upward: true)
  }
 }
 @MainActor private func toTop(_ app: XCUIApplication) {
  for _ in 0..<5 { edgeScroll(app, upward: false) }
 }
 @MainActor private func edgeScroll(_ app: XCUIApplication, upward: Bool) {
  let scroll = app.scrollViews.firstMatch
  let start = scroll.coordinate(withNormalizedOffset: CGVector(dx: 0.98, dy: upward ? 0.85 : 0.2))
  let end = scroll.coordinate(withNormalizedOffset: CGVector(dx: 0.98, dy: upward ? 0.2 : 0.85))
  start.press(forDuration: 0.05, thenDragTo: end)
 }
 @MainActor private func capture(_ app: XCUIApplication, _ name: String) {
  let attachment = XCTAttachment(screenshot: app.screenshot())
  attachment.name = name
  attachment.lifetime = .keepAlways
  add(attachment)
 }
}
