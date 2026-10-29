import SwiftUI

@MainActor struct TodayView: View {
 @Environment(AppModel.self) private var model
 var body: some View {
  ScrollView {
   VStack(spacing: 18) {
    VStack(alignment: .leading, spacing: 14) {
     Label("WERKTAG ASSISTENT", systemImage: "sun.horizon")
      .font(.caption.weight(.semibold)).tracking(1.5).foregroundStyle(WerkTagStyle.copper)
     Text("Dein Tag auf einen Blick.").font(.largeTitle.weight(.semibold))
     Text(Date(), format: .dateTime.weekday(.wide).day().month(.wide))
      .font(.subheadline).foregroundStyle(.white.opacity(0.8))
     Text("Deine Wege und freigegebenen Health-Werte. An einem Ort.")
      .font(.body).foregroundStyle(.white.opacity(0.9))
    }
    .frame(maxWidth: .infinity, alignment: .leading).padding(24)
    .foregroundStyle(.white)
    .background(WerkTagStyle.petrol, in: RoundedRectangle(cornerRadius: 26))

    WerkTagCard {
     LinkStatusView(state: model.linkState)
     Divider()
     Text("Übertragung").font(.headline)
     Text(model.message).font(.subheadline).foregroundStyle(.secondary)
     LabeledContent("Auf dem iPhone ausstehend", value: "\(model.pending)")
     if let stamp = model.lastReceipt {
      LabeledContent("Zuletzt bestätigt", value: JourneyFormat.receipt(stamp))
     } else {
      Text("Noch keine bestätigte Übertragung.").font(.footnote).foregroundStyle(.secondary)
     }
     Button { Task { await model.sync(force: true) } } label: {
      Label("Jetzt übertragen", systemImage: "arrow.triangle.2.circlepath")
     }
     .buttonStyle(WerkTagPrimaryButton())
     .disabled(model.account == nil || model.isBusy || model.pending == 0 || model.storageError != nil)
     .opacity(model.account == nil || model.pending == 0 || model.storageError != nil ? 0.5 : 1)
     if model.isBusy { ProgressView("Übertragung läuft") }
     StorageNotice()
    }

    WerkTagCard {
     Label("Apple Health", systemImage: "heart").font(.headline)
     if let today = model.healthDays.first {
      LabeledContent("Schritte", value: today.steps.map { $0.formatted() } ?? "Nicht verfügbar")
      LabeledContent("Aktive Energie", value: today.activeEnergyKcal.map { "\(Int($0.rounded())) kcal" } ?? "Nicht verfügbar")
      LabeledContent("Puls · Tagesmittel", value: today.heartRateBpm.map { "\(Int($0.rounded())) / min" } ?? "Nicht verfügbar")
     } else {
      Text("Du entscheidest, was dein iPhone teilen darf. Verbinde Apple Health unter „Verbindung“.")
       .foregroundStyle(.secondary)
     }
     if model.healthEnabled {
      Button("Health jetzt abgleichen") { Task { await model.readHealth() } }
       .buttonStyle(.bordered).disabled(model.isReadingHealth || model.storageError != nil)
     }
     if model.isReadingHealth { ProgressView("Health wird gelesen") }
     Text("Tageswerte nach deutscher Zeit. Fehlende Angaben bedeuten nicht null. Apple Health bleibt als eigene Quelle erhalten.")
      .font(.footnote).foregroundStyle(.secondary)
    }
    Link(destination: URL(string: "https://werk-tag.com/assistenz")!) {
     Label("WerkTag im Browser öffnen", systemImage: "arrow.up.right.square")
      .frame(maxWidth: .infinity, minHeight: 44)
    }
   }
   .padding(20)
  }
  .background(WerkTagStyle.canvas)
  .foregroundStyle(WerkTagStyle.ink)
  .navigationTitle("Heute")
  .refreshable { await model.foreground() }
 }
}
