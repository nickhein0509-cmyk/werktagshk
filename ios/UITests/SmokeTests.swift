import XCTest

final class SmokeTests: XCTestCase {
 @MainActor func testFreshInstallHasWorkingTabsAndNoStorageError() throws {
  continueAfterFailure = false
  let app = XCUIApplication()
  app.launchArguments = ["-AppleLanguages", "(de)", "-AppleLocale", "de_DE"]
  app.launch()
  XCTAssertTrue(app.navigationBars["Heute"].waitForExistence(timeout: 30))
  XCTAssertTrue(app.staticTexts["Dein Tag auf einen Blick."].exists)
  XCTAssertFalse(app.descendants(matching: .any).matching(identifier: "storage-error").firstMatch.exists,
   "A fresh installation must be able to read its empty Keychain without a storage error.")
  XCTAssertFalse(app.buttons["Jetzt übertragen"].isEnabled)
  capture(app, "Heute")

  app.tabBars.buttons["Wege"].tap()
  XCTAssertTrue(app.navigationBars["Wege"].exists)
  XCTAssertTrue(app.staticTexts["Dein nächster Weg"].exists)
  XCTAssertFalse(app.buttons["Weg aufzeichnen"].isEnabled)
  capture(app, "Wege")

  app.tabBars.buttons["Verbindung"].tap()
  XCTAssertTrue(app.navigationBars["Verbindung"].exists)
  XCTAssertTrue(app.textFields["E-Mail"].exists)
  XCTAssertTrue(app.secureTextFields["Passwort"].exists)
  XCTAssertFalse(app.buttons["Anmelden"].isEnabled)
  XCTAssertEqual(app.alerts.count, 0, "Location and Health must not request access on first launch.")
  capture(app, "Verbindung")
 }
 @MainActor private func capture(_ app: XCUIApplication, _ name: String) {
  let attachment = XCTAttachment(screenshot: app.screenshot())
  attachment.name = name
  attachment.lifetime = .keepAlways
  add(attachment)
 }
}
