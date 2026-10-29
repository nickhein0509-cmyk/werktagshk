import XCTest
@testable import WerkTagCore

final class JourneyTests: XCTestCase {
 let day = "2026-10-29"
 let device = UUID(uuidString: "c638c892-e26b-4a3b-86ef-064cfa49fe4e")!
 var start: Int { Int(JourneyDay.interval(day)!.start.timeIntervalSince1970) + 9 * 3600 }
 func record(_ seconds: Int, lat: Double = 52, lon: Double = 13, accuracy: Double = 8) -> LocationRecord {
  LocationRecord(tst: start + seconds, lat: lat, lon: lon, acc: accuracy)
 }
 func analyze(_ records: [LocationRecord]) -> JourneyAnalysis {
  JourneyAnalysis(samples: records.map { JourneySample(record: $0, confirmed: true) })
 }

 func testRecordingGapRemainsTwoPolylinesAndAddsNoDistanceOrTime() {
  let first = record(0), second = record(120, lon: 13.001)
  let third = record(1800, lon: 13.1), fourth = record(1920, lon: 13.101)
  let result = analyze([first, second, third, fourth])
  XCTAssertEqual(result.segments.map { $0.samples.count }, [2, 2])
  XCTAssertEqual(result.gapCount, 1)
  XCTAssertEqual(result.coveredSeconds, 240)
  XCTAssertEqual(result.gapSeconds, 1680)
  XCTAssertEqual(result.distanceMetres, JourneyAnalysis.metres(first, second) + JourneyAnalysis.metres(third, fourth), accuracy: 0.01)
 }
 func testInaccurateFixIsNeverBridged() {
  let result = analyze([record(0), record(60, lon: 13.1, accuracy: 101), record(120, lon: 13.002)])
  XCTAssertEqual(result.poorFixCount, 1)
  XCTAssertEqual(result.segments.count, 2)
  XCTAssertEqual(result.distanceMetres, 0)
  XCTAssertEqual(result.coveredSeconds, 0)
 }
 func testIsolatedImpossibleSpikeIsRemovedOnlyWithPlausibleNeighbours() {
  let a = record(0), b = record(120, lat: 54, lon: 15), c = record(240, lon: 13.002)
  let result = analyze([a, b, c])
  XCTAssertEqual(result.outlierCount, 1)
  XCTAssertEqual(result.segments.count, 1)
  XCTAssertEqual(result.segments[0].samples.map(\.record), [a, c])
  XCTAssertEqual(result.distanceMetres, JourneyAnalysis.metres(a, c), accuracy: 0.01)
  let separated = analyze([a, b, record(1200, lon: 13.002)])
  XCTAssertEqual(separated.outlierCount, 0)
  XCTAssertEqual(separated.segments.count, 3)
 }
 func testImpossibleJumpAndEqualTimestampStaySeparated() {
  XCTAssertEqual(analyze([record(0), record(1, lat: 54)]).segments.count, 2)
  XCTAssertEqual(analyze([record(0), record(0, lon: 13.001)]).segments.count, 2)
  XCTAssertEqual(analyze([record(0), record(900, lon: 13.001)]).segments.count, 1)
  XCTAssertEqual(analyze([record(0), record(901, lon: 13.001)]).segments.count, 2)
 }
 func testStationaryNoiseDoesNotInflateDistance() {
  let result = analyze([record(0), record(60, lon: 13.00001), record(120), record(180, lon: 13.00002)])
  XCTAssertEqual(result.distanceMetres, 0)
  XCTAssertEqual(result.coveredSeconds, 180)
  XCTAssertEqual(result.suppressedJitterCount, 3)
  XCTAssertEqual(result.segments[0].samples.count, 4)
 }
 func testServerAndPendingLocationsMergeWithoutInventingEventIDEquivalence() {
  let shared = record(0), queued = record(60, lon: 13.001), received = record(120, lon: 13.002)
  let yesterday = LocationRecord(tst: start - 86400, lat: 52, lon: 13, acc: 8)
  let values = JourneyAnalysis.merge(remote: [shared], pending: [shared, queued, yesterday], confirmed: [received], day: day)
  XCTAssertEqual(values.map(\.record), [shared, queued, received])
  XCTAssertEqual(values.map(\.confirmed), [true, false, true])
  let result = JourneyAnalysis(samples: values)
  XCTAssertEqual(result.confirmedCount, 2)
  XCTAssertEqual(result.pendingCount, 1)
 }
 func testBerlinDaysRespectDaylightSavingAndRejectInvalidDates() throws {
  XCTAssertEqual(try XCTUnwrap(JourneyDay.interval("2026-03-29")).duration, 23 * 3600)
  XCTAssertEqual(try XCTUnwrap(JourneyDay.interval("2026-10-25")).duration, 25 * 3600)
  XCTAssertNil(JourneyDay.interval("2026-02-30"))
  XCTAssertNil(JourneyDay.interval("2026-2-03"))
  let interval = try XCTUnwrap(JourneyDay.interval(day))
  XCTAssertTrue(JourneyDay.contains(Int(interval.start.timeIntervalSince1970), in: interval))
  XCTAssertFalse(JourneyDay.contains(Int(interval.end.timeIntervalSince1970), in: interval))
 }
 private func payload() -> [String: Any] {
  ["schemaVersion": 1, "date": day, "timeZone": "Europe/Berlin", "source": "werktag_ios",
   "deviceId": device.uuidString.lowercased(), "totalSelected": 1, "truncated": false,
   "points": [["id": "normalized-location-hash", "tst": start, "lat": 52, "lon": 13, "acc": 8,
               "source": "werktag_ios", "device": device.uuidString.lowercased()]]]
 }
 private func response(_ payload: [String: Any]) throws -> JourneyResponse {
  try JSONDecoder().decode(JourneyResponse.self, from: JSONSerialization.data(withJSONObject: payload))
 }
 func testOnlyCompleteOwnedDayResponsesAreAccepted() throws {
  XCTAssertEqual(try response(payload()).validated(for: day, device: device), [record(0)])
  for (key, value) in [("schemaVersion", 2 as Any), ("date", "2026-10-28"), ("timeZone", "UTC"),
                       ("source", "owntracks"), ("totalSelected", 2), ("truncated", true),
                       ("deviceId", UUID().uuidString)] {
   var data = payload(); data[key] = value
   XCTAssertThrowsError(try response(data).validated(for: day, device: device), "Must reject \(key)")
  }
  var data = payload()
  var points = data["points"] as! [[String: Any]]
  points[0]["device"] = UUID().uuidString
  data["points"] = points
  XCTAssertThrowsError(try response(data).validated(for: day, device: device))
  points[0]["device"] = device.uuidString
  points[0]["tst"] = start - 86400
  data["points"] = points
  XCTAssertThrowsError(try response(data).validated(for: day, device: device))
 }
 func testDuplicateAndInvalidServerPointsAreRejected() throws {
  var data = payload()
  var points = data["points"] as! [[String: Any]]
  data["points"] = [points[0], points[0]]; data["totalSelected"] = 2
  XCTAssertThrowsError(try response(data).validated(for: day, device: device))
  points[0]["lat"] = 91; data["points"] = points; data["totalSelected"] = 1
  XCTAssertThrowsError(try response(data).validated(for: day, device: device))
 }
}
