import SwiftUI
import UIKit

enum WerkTagStyle {
 static let petrol = Color(red: 0.065, green: 0.22, blue: 0.205)
 static let copper = Color(red: 0.83, green: 0.61, blue: 0.44)
 static let canvas = adaptive(light: UIColor(red: 0.96, green: 0.95, blue: 0.925, alpha: 1),
                              dark: UIColor(red: 0.045, green: 0.105, blue: 0.10, alpha: 1))
 static let surface = adaptive(light: .white, dark: UIColor(red: 0.085, green: 0.18, blue: 0.165, alpha: 1))
 static let ink = adaptive(light: UIColor(red: 0.07, green: 0.22, blue: 0.205, alpha: 1),
                           dark: UIColor(red: 0.96, green: 0.95, blue: 0.915, alpha: 1))
 static let accent = adaptive(light: UIColor(red: 0.55, green: 0.27, blue: 0.13, alpha: 1),
                              dark: UIColor(red: 0.91, green: 0.71, blue: 0.54, alpha: 1))
 static let route = adaptive(light: UIColor(red: 0.04, green: 0.31, blue: 0.29, alpha: 1),
                             dark: UIColor(red: 0.46, green: 0.86, blue: 0.79, alpha: 1))
 private static func adaptive(light: UIColor, dark: UIColor) -> Color {
  Color(uiColor: UIColor { $0.userInterfaceStyle == .dark ? dark : light })
 }
}

struct WerkTagCard<Content: View>: View {
 @ViewBuilder var content: Content
 var body: some View {
  VStack(alignment: .leading, spacing: 16) { content }
   .frame(maxWidth: .infinity, alignment: .leading)
   .padding(20)
   .background(WerkTagStyle.surface, in: RoundedRectangle(cornerRadius: 24))
   .overlay { RoundedRectangle(cornerRadius: 24).stroke(WerkTagStyle.ink.opacity(0.07), lineWidth: 1) }
 }
}

struct WerkTagPrimaryButton: ButtonStyle {
 func makeBody(configuration: Configuration) -> some View {
  configuration.label
   .font(.headline)
   .frame(maxWidth: .infinity, minHeight: 48)
   .foregroundStyle(WerkTagStyle.canvas)
   .background(WerkTagStyle.ink, in: RoundedRectangle(cornerRadius: 14))
   .opacity(configuration.isPressed ? 0.75 : 1)
 }
}

struct JourneyMetric: View {
 let title: String
 let value: String
 var body: some View {
  VStack(alignment: .leading, spacing: 5) {
   Text(value).font(.title3.weight(.semibold)).monospacedDigit()
   Text(title).font(.caption).foregroundStyle(.secondary)
  }
  .frame(maxWidth: .infinity, alignment: .leading)
  .accessibilityElement(children: .combine)
 }
}

struct LinkStatusView: View {
 let state: LinkState
 var body: some View {
  VStack(alignment: .leading, spacing: 8) {
   Label(state.title, systemImage: state.symbol).font(.headline)
   Text(state.detail).font(.footnote).foregroundStyle(.secondary)
  }
 }
}

@MainActor struct StorageNotice: View {
 @Environment(AppModel.self) private var model
 var body: some View {
  if let error = model.storageError {
   VStack(alignment: .leading, spacing: 12) {
    Label(error, systemImage: "exclamationmark.triangle")
     .foregroundStyle(.red).accessibilityIdentifier("storage-error")
    Text("Die Aufzeichnung bleibt pausiert, bis deine Daten sicher gespeichert werden können.")
     .font(.footnote).foregroundStyle(.secondary)
    if model.account != nil {
     Button("Speicher erneut prüfen") { model.retryStorage() }.buttonStyle(.bordered)
    }
   }
  }
 }
}

enum JourneyFormat {
 static func distance(_ metres: Double) -> String {
  if metres < 1000 { return "\(Int(metres.rounded())) m" }
  return (metres / 1000).formatted(.number.precision(.fractionLength(1)).locale(Locale(identifier: "de_DE"))) + " km"
 }
 static func duration(_ seconds: Double) -> String {
  let minutes = Int(seconds / 60)
  if minutes >= 60 { return "\(minutes / 60) h \(minutes % 60) min" }
  if minutes == 0 && seconds > 0 { return "< 1 min" }
  return "\(minutes) min"
 }
 static func time(_ timestamp: Int) -> String {
  Date(timeIntervalSince1970: Double(timestamp)).formatted(
   Date.FormatStyle(date: .omitted, time: .shortened, locale: Locale(identifier: "de_DE"), timeZone: JourneyDay.timeZone))
 }
 static func receipt(_ stamp: String) -> String {
  let date = DurableQueue.fractionalDate(stamp) ?? ISO8601DateFormatter().date(from: stamp)
  return date?.formatted(date: .abbreviated, time: .shortened) ?? stamp
 }
}
