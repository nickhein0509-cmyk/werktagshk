import Foundation

/// All day boundaries use WerkTag's journal timezone, including 23/25-hour days.
public enum JourneyDay {
 public static let timeZone = TimeZone(identifier: "Europe/Berlin")!
 public static var calendar: Calendar {
  var value = Calendar(identifier: .gregorian)
  value.timeZone = timeZone
  return value
 }
 public static func string(_ date: Date) -> String {
  let parts = calendar.dateComponents([.year, .month, .day], from: date)
  return String(format: "%04d-%02d-%02d", parts.year!, parts.month!, parts.day!)
 }
 public static func interval(_ day: String) -> DateInterval? {
  let parts = day.split(separator: "-", omittingEmptySubsequences: false)
  guard day.count == 10, parts.count == 3,
   parts[0].count == 4, parts[1].count == 2, parts[2].count == 2,
   let year = Int(parts[0]), let month = Int(parts[1]), let date = Int(parts[2]),
   year >= 2000,
   let start = calendar.date(from: DateComponents(year: year, month: month, day: date)),
   string(start) == day, let end = calendar.date(byAdding: .day, value: 1, to: start)
  else { return nil }
  return DateInterval(start: start, end: end)
 }
 public static func contains(_ timestamp: Int, in interval: DateInterval) -> Bool {
  let value = Double(timestamp)
  return value >= interval.start.timeIntervalSince1970 && value < interval.end.timeIntervalSince1970
 }
}

public struct JourneyResponse: Decodable, Sendable {
 public let schemaVersion: Int
 public let date: String
 public let timeZone: String
 public let source: String
 public let deviceId: UUID
 public let points: [Point]
 public let totalSelected: Int
 public let truncated: Bool

 public struct Point: Decodable, Sendable {
  public let id: String
  public let source: String
  public let device: String
  public let tst: Int
  public let lat: Double
  public let lon: Double
  public let acc: Double
  public let alt: Double?
  public let vel: Double?
  public let cog: Double?
  public var record: LocationRecord {
   LocationRecord(tst: tst, lat: lat, lon: lon, acc: acc, alt: alt, vel: vel, cog: cog)
  }
 }

 public func validated(for day: String, device expected: UUID) throws -> [LocationRecord] {
  guard schemaVersion == 1, date == day, timeZone == "Europe/Berlin",
   source == "werktag_ios", deviceId == expected, !truncated,
   totalSelected == points.count, points.count <= 10_000,
   let interval = JourneyDay.interval(day)
  else { throw TransferError.invalidServer }
  var ids = Set<String>()
  for point in points {
   guard !point.id.isEmpty, ids.insert(point.id).inserted,
    point.source == source, UUID(uuidString: point.device) == expected,
    JourneyDay.contains(point.tst, in: interval), JourneyAnalysis.validCoordinate(point.record),
    point.acc.isFinite, point.acc >= 0
   else { throw TransferError.invalidServer }
  }
  return points.map(\.record)
 }
}

public struct JourneySample: Identifiable, Equatable, Sendable {
 public let record: LocationRecord
 public let confirmed: Bool
 public var id: String { "\(record.tst):\(record.lat):\(record.lon)" }
 public init(record: LocationRecord, confirmed: Bool) { self.record = record; self.confirmed = confirmed }
}

public struct JourneySegment: Identifiable, Equatable, Sendable {
 public let samples: [JourneySample]
 public let displaySamples: [JourneySample]
 public let distanceMetres: Double
 public let coveredSeconds: Double
 public var id: String { samples[0].id }
 public var start: JourneySample { samples[0] }
 public var end: JourneySample { samples[samples.count - 1] }
}

/// Display analysis only. Raw points and upload events are never changed.
/// Thresholds follow the web journal: 100 m accuracy, 15 min gap, 70 m/s jump.
public struct JourneyAnalysis: Equatable, Sendable {
 public private(set) var segments: [JourneySegment] = []
 public private(set) var distanceMetres = 0.0
 public private(set) var coveredSeconds = 0.0
 public private(set) var gapCount = 0
 public private(set) var gapSeconds = 0.0
 public private(set) var poorFixCount = 0
 public private(set) var outlierCount = 0
 public private(set) var suppressedJitterCount = 0
 public private(set) var confirmedCount = 0
 public private(set) var pendingCount = 0
 public var pointCount: Int { confirmedCount + pendingCount }

 public static func validCoordinate(_ p: LocationRecord) -> Bool {
  p.lat.isFinite && p.lon.isFinite && abs(p.lat) <= 90 && abs(p.lon) <= 180 && p.tst >= 0
 }
 public static func metres(_ a: LocationRecord, _ b: LocationRecord) -> Double {
  let r = Double.pi / 180
  let x = (b.lat - a.lat) * r, y = (b.lon - a.lon) * r
  let h = pow(sin(x / 2), 2) + cos(a.lat * r) * cos(b.lat * r) * pow(sin(y / 2), 2)
  return 6_371_000 * 2 * asin(sqrt(min(1, max(0, h))))
 }

 private struct Key: Hashable { let time: Int; let lat: Double; let lon: Double }
 /// The server's normalized location ID is not an upload event UUID. Coordinate
 /// identity merges a just-uploaded fix with its server copy without guessing IDs.
 public static func merge(remote: [LocationRecord], pending: [LocationRecord],
                          confirmed: [LocationRecord] = [], day: String) -> [JourneySample] {
  guard let interval = JourneyDay.interval(day) else { return [] }
  var unique: [Key: JourneySample] = [:]
  for (records, saved) in [(pending, false), (confirmed, true), (remote, true)] {
   for record in records where validCoordinate(record) && JourneyDay.contains(record.tst, in: interval) {
    unique[Key(time: record.tst, lat: record.lat, lon: record.lon)] = JourneySample(record: record, confirmed: saved)
   }
  }
  return unique.values.sorted {
   if $0.record.tst != $1.record.tst { return $0.record.tst < $1.record.tst }
   if $0.record.lat != $1.record.lat { return $0.record.lat < $1.record.lat }
   return $0.record.lon < $1.record.lon
  }
 }

 public init(samples: [JourneySample] = []) {
  confirmedCount = samples.filter(\.confirmed).count
  pendingCount = samples.count - confirmedCount
  var part: [JourneySample] = [], display: [JourneySample] = []
  var previous: JourneySample?, anchor: JourneySample?
  var partDistance = 0.0, partSeconds = 0.0
  func good(_ sample: JourneySample) -> Bool {
   Self.validCoordinate(sample.record) && sample.record.acc.isFinite && (0...100).contains(sample.record.acc)
  }
  func finish() {
   if let last = part.last {
    if display.last?.id != last.id { display.append(last) }
    segments.append(JourneySegment(samples: part, displaySamples: display,
                                   distanceMetres: partDistance, coveredSeconds: partSeconds))
   }
   part = []; display = []; previous = nil; anchor = nil; partDistance = 0; partSeconds = 0
  }
  for (index, sample) in samples.enumerated() {
   guard good(sample) else { poorFixCount += 1; finish(); continue }
   let p = sample.record
   // Remove only an isolated impossible spike whose neighbours form a plausible
   // interval. An inaccurate fix or a recording gap is never bridged.
   if let prior = previous, index + 1 < samples.count, good(samples[index + 1]) {
    let next = samples[index + 1].record
    let a = Double(p.tst - prior.record.tst), b = Double(next.tst - p.tst)
    let span = Double(next.tst - prior.record.tst)
    if a > 0, b > 0, span <= 900,
     Self.metres(prior.record, p) / a > 70, Self.metres(p, next) / b > 70,
     Self.metres(prior.record, next) / span <= 70 {
     outlierCount += 1; continue
    }
   }
   if let prior = previous {
    let dt = Double(p.tst - prior.record.tst), distance = Self.metres(prior.record, p)
    if dt <= 0 || dt > 900 || distance / dt > 70 {
     gapCount += 1
     if dt > 900 { gapSeconds += dt }
     finish()
    } else {
     coveredSeconds += dt; partSeconds += dt
     let reference = anchor ?? prior
     let displacement = Self.metres(reference.record, p)
     let noise = max(5, min(25, (reference.record.acc + p.acc) / 2))
     if displacement > noise {
      distanceMetres += displacement; partDistance += displacement
      display.append(sample); anchor = sample
     } else { suppressedJitterCount += 1 }
    }
   }
   if previous == nil { display = [sample]; anchor = sample }
   part.append(sample); previous = sample
  }
  finish()
 }
}
