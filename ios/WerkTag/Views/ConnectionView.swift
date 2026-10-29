import SwiftUI

@MainActor struct ConnectionView: View {
 @Environment(AppModel.self) private var model
 @State private var email = ""
 @State private var password = ""
 @State private var confirmLogout = false

 var body: some View {
  Form {
   if let account = model.account {
    Section {
     Label(account.email ?? "Gespeichertes Konto", systemImage: "person.crop.circle").font(.headline)
     Text("werk-tag.com").foregroundStyle(.secondary)
     LinkStatusView(state: model.linkState)
     Button("Verbindung prüfen") { Task { await model.verifyConnection(); await model.loadJourney() } }
      .disabled(model.isCheckingConnection)
     if model.isCheckingConnection { ProgressView("Zuordnung prüfen") }
    } header: { Text("Dein WerkTag-Konto") }
     .listRowBackground(WerkTagStyle.surface)

    Section {
     if model.healthEnabled {
      Button("Health-Abgleich pausieren") { model.disableHealth() }
     } else {
      Button { Task { await model.enableHealth() } } label: {
       Label("Apple Health verbinden", systemImage: "heart")
      }
      .disabled(!model.canRecord)
     }
     Text("Freigegebene Schritte, aktive Energie und Puls der letzten sieben Tage werden als Tageswerte an deine Assistenz gesendet.")
      .font(.footnote).foregroundStyle(.secondary)
     Text("Fehlende Werte können fehlende Lesefreigaben oder fehlende Messungen bedeuten. Apple Health wird nicht mit anderen Quellen addiert.")
      .font(.footnote).foregroundStyle(.secondary)
     Link("iPhone-Einstellungen öffnen", destination: URL(string: UIApplication.openSettingsURLString)!)
    } header: { Text("Deine Freigaben") }
     .disabled(model.isReadingHealth)
     .listRowBackground(WerkTagStyle.surface)

    Section {
     LabeledContent("Ausstehend auf diesem iPhone", value: "\(model.pending)")
     LabeledContent("Bestätigte Ereignisse", value: "\(model.confirmed)")
     if let stamp = model.lastReceipt {
      LabeledContent("Letzte Bestätigung", value: JourneyFormat.receipt(stamp))
     } else {
      Text("Noch keine bestätigte Übertragung.").foregroundStyle(.secondary)
     }
     Text(model.message).font(.footnote)
     Text("Ausstehende Daten bleiben nach einem Neustart erhalten. WerkTag muss sie bestätigen, bevor sie aus der Warteschlange verschwinden.")
      .font(.footnote).foregroundStyle(.secondary)
     if let retry = model.nextRetry, !model.uploadPaused {
      Text("Nächster Versuch frühestens \(retry.formatted(date: .omitted, time: .shortened)).")
       .font(.footnote).foregroundStyle(.secondary)
     }
     if model.uploadPaused {
      Label("Automatische Versuche pausiert. Prüfe die Verbindung; bei abgelaufener Anmeldung melde dich erneut an.",
            systemImage: "exclamationmark.circle")
       .font(.footnote).foregroundStyle(WerkTagStyle.accent)
      Button("Übertragung erneut versuchen") { Task { await model.sync(force: true) } }
       .disabled(model.isBusy || model.storageError != nil)
     }
     StorageNotice()
    } header: { Text("Sicher gespeichert") }
     .listRowBackground(WerkTagStyle.surface)

    Section {
     Button("Abmelden", role: .destructive) { confirmLogout = true }
      .disabled(model.isBusy || model.isReadingHealth)
    }.listRowBackground(WerkTagStyle.surface)
   } else {
    Section {
     VStack(alignment: .leading, spacing: 12) {
      Image(systemName: "iphone.and.arrow.forward").font(.largeTitle).foregroundStyle(WerkTagStyle.accent)
      Text("Dein iPhone. Dein WerkTag.").font(.title2.weight(.semibold))
      Text("Verbinde das Konto, das deiner persönlichen Assistenz zugeordnet ist.")
       .foregroundStyle(.secondary)
     }.padding(.vertical, 8)
     TextField("E-Mail", text: $email)
      .textContentType(.username).keyboardType(.emailAddress)
      .textInputAutocapitalization(.never).autocorrectionDisabled()
     SecureField("Passwort", text: $password).textContentType(.password)
     Button("Anmelden") {
      let secret = password; password = ""
      Task {
       await model.login(email: email.trimmingCharacters(in: .whitespacesAndNewlines), password: secret)
       await model.sync(); await model.loadJourney()
      }
     }.disabled(email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || password.isEmpty || model.isBusy)
     if model.isBusy { ProgressView("Verbindung wird geprüft") }
     Text(model.message).font(.footnote).foregroundStyle(.secondary)
     StorageNotice()
    }.listRowBackground(WerkTagStyle.surface)
    Section {
     Link("Konto einrichten oder Passwort zurücksetzen", destination: URL(string: "https://werk-tag.com/konto")!)
    }.listRowBackground(WerkTagStyle.surface)
   }
   Section {
    Text("WerkTag für iPhone · \(version)").font(.subheadline.weight(.medium))
    Link("WerkTag im Browser öffnen", destination: URL(string: "https://werk-tag.com/assistenz")!)
   } header: { Text("Deine Assistenz") }
    .listRowBackground(WerkTagStyle.surface)
  }
  .scrollContentBackground(.hidden)
  .background(WerkTagStyle.canvas)
  .foregroundStyle(WerkTagStyle.ink)
  .navigationTitle("Verbindung")
  .confirmationDialog("Abmelden und Aufzeichnung beenden?", isPresented: $confirmLogout, titleVisibility: .visible) {
   Button("Abmelden", role: .destructive) { model.logout() }
  } message: {
   Text("Ausstehende Daten bleiben diesem Konto zugeordnet und werden erst nach erneuter Anmeldung damit übertragen.")
  }
 }

 private var version: String {
  let name = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "–"
  let build = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "–"
  return "\(name) (\(build))"
 }
}
