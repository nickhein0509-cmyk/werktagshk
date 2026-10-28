import SwiftUI
import MapKit

@MainActor struct RootView:View {
 @Environment(AppModel.self) private var model
 var body:some View {
  TabView {
   NavigationStack {TodayView()}.tabItem{Label("Heute",systemImage:"sun.max")}
   NavigationStack {JourneyView()}.tabItem{Label("Wege",systemImage:"map")}
   NavigationStack {ConnectionView()}.tabItem{Label("Verbindung",systemImage:"antenna.radiowaves.left.and.right")}
  }
  .task {
   while !Task.isCancelled {
    do{try await Task.sleep(for:.seconds(30))}catch{return}
    await model.sync()
   }
  }
 }
}
@MainActor struct TodayView:View {
 @Environment(AppModel.self) private var model
 var body:some View {
  List {
   Section {
    VStack(alignment:.leading,spacing:8) {
     Text(Date(),format:.dateTime.weekday(.wide).day().month(.wide)).font(.subheadline).foregroundStyle(.secondary)
     Text("Dein Tag auf einen Blick.").font(.title2.bold())
     Text("Deine Wege und freigegebenen Health-Werte für WerkTag.").foregroundStyle(.secondary)
    }.padding(.vertical,8)
   }
   Section("Übertragung") {
    Label(model.message,systemImage:model.account==nil ? "person.crop.circle":(model.pending>0 ? "icloud.and.arrow.up":"checkmark.icloud"))
    LabeledContent("Auf dem iPhone ausstehend",value:"\(model.pending)")
    if let stamp=model.lastReceipt {
     LabeledContent("Zuletzt bestätigt",value:displayDate(stamp))
    } else {Text("Noch keine bestätigte Übertragung.").foregroundStyle(.secondary)}
    Button {Task{await model.sync(force:true)}} label:{Label("Jetzt übertragen",systemImage:"arrow.triangle.2.circlepath")}
     .disabled(model.account==nil || model.isBusy || model.pending==0)
    if model.isBusy {ProgressView("Übertragung läuft")}
    if let error=model.storageError {Label(error,systemImage:"exclamationmark.triangle").foregroundStyle(.red).accessibilityIdentifier("storage-error")}
   }
   Section {
    if let today=model.healthDays.first {
     LabeledContent("Schritte",value:today.steps.map{String($0)} ?? "Nicht verfügbar")
     LabeledContent("Aktive Energie",value:today.activeEnergyKcal.map{"\(Int($0.rounded())) kcal"} ?? "Nicht verfügbar")
     LabeledContent("Puls · Tagesmittel",value:today.heartRateBpm.map{"\(Int($0.rounded())) / min"} ?? "Nicht verfügbar")
    }else {ContentUnavailableView("Health verbinden",systemImage:"heart",description:Text("Du bestimmst, welche Daten WerkTag lesen darf."))}
    if model.healthEnabled {
     Button("Health jetzt abgleichen"){Task{await model.readHealth()}}
      .disabled(model.isReadingHealth)
    }
    if model.isReadingHealth {ProgressView("Health wird gelesen")}
   } header:{Text("Apple Health")} footer:{
    Text("Tageswerte nach deutscher Zeit. Nur freigegebene Werte werden übertragen. Fehlende Angaben bedeuten nicht null.")
   }
   Section {Link(destination:URL(string:"https://werk-tag.com/assistenz")!){Label("WerkTag im Browser öffnen",systemImage:"arrow.up.right.square")}}
  }.navigationTitle("Heute")
   .refreshable{await model.foreground()}
 }
 private func displayDate(_ stamp:String)->String{
  let d=DurableQueue.fractionalDate(stamp) ?? ISO8601DateFormatter().date(from:stamp)
  return d?.formatted(date:.abbreviated,time:.shortened) ?? stamp
 }
}
@MainActor struct JourneyView:View {
 @Environment(AppModel.self) private var model
 var body:some View {
  List {
   Section {
    if model.positions.isEmpty {
     ContentUnavailableView("Dein nächster Weg",systemImage:"location",description:Text("Starte die Aufzeichnung, wenn du deinen Weg festhalten möchtest."))
    }else {
     Map {
      MapPolyline(coordinates:model.positions.map{CLLocationCoordinate2D(latitude:$0.lat,longitude:$0.lon)})
       .stroke(.teal,lineWidth:4)
      if let last=model.positions.last {
       Marker("Letzter erfasster Punkt",coordinate:CLLocationCoordinate2D(latitude:last.lat,longitude:last.lon))
      }
     }.frame(height:300).listRowInsets(EdgeInsets())
      .accessibilityLabel("Karte der zuletzt auf diesem iPhone erfassten Punkte")
    }
   } footer:{Text("Diese Sitzung und noch ausstehende Punkte, maximal 1.000. Verbindungslinien sind keine berechneten Straßenrouten. Das vollständige Archiv findest du in WerkTag.")}
   Section("Aufzeichnung") {
    Label(model.locationStatus,systemImage:model.recording ? "location.fill":"pause.circle")
    if model.recording {
     Button("Aufzeichnung beenden",role:.destructive){model.stopLocation()}
    }else {
     Button {model.startLocation()} label:{Label("Weg aufzeichnen",systemImage:"record.circle")}
      .disabled(model.account==nil || model.storageError != nil)
    }
    Text("Die gestartete Aufzeichnung kann bei gesperrtem Bildschirm weiterlaufen. iOS, Berechtigungen und Empfang können Lücken verursachen.").font(.footnote).foregroundStyle(.secondary)
   }
  }.navigationTitle("Wege")
 }
}
@MainActor struct ConnectionView:View {
 @Environment(AppModel.self) private var model
 @State private var email=""
 @State private var password=""
 @State private var confirmLogout=false
 var body:some View {
  Form {
   if let account=model.account {
    Section("WerkTag-Konto") {
     Label(account.email ?? "Verbundenes Konto",systemImage:"person.crop.circle")
     Text("Ziel: werk-tag.com").foregroundStyle(.secondary)
     Text(model.message).font(.footnote)
    }
    Section("Deine Freigaben") {
     if model.healthEnabled {
      Button("Health-Abgleich pausieren"){model.disableHealth()}
     }else {
      Button("Apple Health verbinden"){Task{await model.enableHealth()}}
     }
     Text("Freigegebene Schritte, aktive Energie und Puls der letzten sieben Tage werden als Tageswerte an deine Assistenz gesendet.").font(.footnote).foregroundStyle(.secondary)
     Link("iPhone-Einstellungen öffnen",destination:URL(string:UIApplication.openSettingsURLString)!)
    }.disabled(model.isReadingHealth)
    Section("Zuverlässige Übertragung") {
     LabeledContent("Ausstehend",value:"\(model.pending)")
     LabeledContent("Bestätigte Ereignisse",value:"\(model.confirmed)")
     Text("Ausstehende Daten bleiben nach einem App-Neustart gespeichert. Gelöscht werden sie erst nach Bestätigung durch WerkTag.").font(.footnote)
     if let retry=model.nextRetry,!model.uploadPaused {Text("Nächster Versuch frühestens \(retry.formatted(date:.omitted,time:.shortened)).").font(.footnote)}
     if model.uploadPaused {Text("Automatische Versuche pausiert. Bitte Verbindung prüfen und erneut übertragen.").foregroundStyle(.orange)}
    }
    Section {
     Button("Abmelden",role:.destructive){confirmLogout=true}
      .disabled(model.isBusy || model.isReadingHealth)
    }
   }else {
    Section {
     Label("Dein iPhone mit WerkTag verbinden",systemImage:"iphone.and.arrow.forward").font(.headline)
     TextField("E-Mail",text:$email).textContentType(.username).keyboardType(.emailAddress).textInputAutocapitalization(.never).autocorrectionDisabled()
     SecureField("Passwort",text:$password).textContentType(.password)
     Button("Anmelden"){
      let secret=password;password=""
      Task{await model.login(email:email.trimmingCharacters(in:.whitespacesAndNewlines),password:secret);await model.sync()}
     }.disabled(email.isEmpty || password.isEmpty || model.isBusy)
     if model.isBusy{ProgressView("Verbindung wird geprüft")}
     Text(model.message).font(.footnote).foregroundStyle(.secondary)
    } footer:{Text("Verwende dein bestehendes WerkTag-Konto, das deiner persönlichen Assistenz zugeordnet ist.")}
    Section {Link("Konto einrichten oder Passwort zurücksetzen",destination:URL(string:"https://werk-tag.com/konto")!)}
   }
   Section("Über diese Version") {
    Text("WerkTag · iPhone 0.1")
    Text("Kalender, Erinnerungen und Apple Watch sind in dieser Version noch nicht angebunden.").font(.footnote).foregroundStyle(.secondary)
   }
  }.navigationTitle("Verbindung")
   .confirmationDialog("Abmelden und Aufzeichnung beenden?",isPresented:$confirmLogout,titleVisibility:.visible){
    Button("Abmelden",role:.destructive){model.logout()}
   } message:{Text("Ausstehende Daten bleiben diesem Konto zugeordnet und werden erst nach erneuter Anmeldung damit übertragen.")}
 }
}
