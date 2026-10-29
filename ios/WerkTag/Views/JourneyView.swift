import SwiftUI
import MapKit

@MainActor struct JourneyView: View {
 @Environment(AppModel.self) private var model
 @Environment(\.accessibilityReduceMotion) private var reduceMotion
 @State private var selectedDay = Date()
 @State private var selectedSegmentID: String?
 @State private var camera: MapCameraPosition = .automatic

 private var visibleSegments: [JourneySegment] {
  guard let selectedSegmentID else { return model.journey.segments }
  return model.journey.segments.filter { $0.id == selectedSegmentID }
 }
 private var selectedSegment: JourneySegment? { visibleSegments.count == 1 && selectedSegmentID != nil ? visibleSegments.first : nil }

 var body: some View {
  ScrollView {
   VStack(alignment: .leading, spacing: 18) {
    dateControls
    if model.showsExampleData {
     Label("Vorschau · synthetische Beispieldaten", systemImage: "testtube.2")
      .font(.footnote).accessibilityIdentifier("journey-example")
    }
    mapCard
    if model.isLoadingJourney { ProgressView("Bestätigten Verlauf laden") }
    if let error = model.journeyError {
     WerkTagCard {
      Label("Verlauf konnte nicht geladen werden", systemImage: "wifi.exclamationmark").font(.headline)
      Text(error).font(.subheadline).foregroundStyle(.secondary)
      Text("Vorhandene Punkte bleiben sichtbar. Die Ansicht kann noch unvollständig sein.")
       .font(.footnote).foregroundStyle(.secondary)
      Button("Erneut laden") { Task { await model.loadJourney() } }.buttonStyle(.bordered)
     }
    }
    if model.journey.pointCount > 0 {
     summaryCard
     segmentsCard
    }
    recordingCard
    Link(destination: URL(string: "https://werk-tag.com/assistenz")!) {
     Label("Gesamtes WerkTag-Archiv öffnen", systemImage: "arrow.up.right.square")
      .frame(maxWidth: .infinity, minHeight: 44)
    }
   }
   .padding(20)
  }
  .background(WerkTagStyle.canvas)
  .foregroundStyle(WerkTagStyle.ink)
  .navigationTitle("Wege")
  .toolbar {
   ToolbarItem(placement: .topBarTrailing) {
    Button { Task { await model.loadJourney() } } label: {
     Label("Verlauf neu laden", systemImage: "arrow.clockwise")
    }
    .disabled(model.account == nil || model.isLoadingJourney)
   }
  }
  .task(id: JourneyDay.string(selectedDay)) {
   selectedSegmentID = nil
   await model.loadJourney(day: JourneyDay.string(selectedDay))
   fit(model.journey.segments)
  }
  .onChange(of: model.journey.segments.isEmpty) { _, empty in
   if !empty { fit(visibleSegments) }
  }
  .onChange(of: model.journey) { _, analysis in
   if let selectedSegmentID, !analysis.segments.contains(where: { $0.id == selectedSegmentID }) {
    self.selectedSegmentID = nil
   }
  }
 }

 private var dateControls: some View {
  VStack(alignment: .leading, spacing: 10) {
   Text("DEIN WEGVERLAUF").font(.caption.weight(.semibold)).tracking(1.6)
    .foregroundStyle(WerkTagStyle.accent)
   HStack(spacing: 8) {
    Button { shiftDay(-1) } label: { Image(systemName: "chevron.left").frame(width: 44, height: 44) }
     .accessibilityLabel("Vorheriger Tag")
     .disabled(JourneyDay.string(selectedDay) <= "2000-01-01")
    DatePicker("Tag auswählen", selection: $selectedDay,
               in: JourneyDay.interval("2000-01-01")!.start...Date(), displayedComponents: .date)
     .labelsHidden().frame(maxWidth: .infinity)
     .environment(\.timeZone, JourneyDay.timeZone)
    Button { shiftDay(1) } label: { Image(systemName: "chevron.right").frame(width: 44, height: 44) }
     .accessibilityLabel("Nächster Tag")
     .disabled(JourneyDay.string(selectedDay) >= JourneyDay.string(Date()))
   }
   Text("Dieses iPhone · Tagesgrenzen nach deutscher Zeit")
    .font(.footnote).foregroundStyle(.secondary)
  }
 }

 private var mapCard: some View {
  VStack(alignment: .leading, spacing: 0) {
   if model.journey.segments.isEmpty {
    ContentUnavailableView(
     model.journey.pointCount == 0 ? "Dein nächster Weg" : "Noch keine verlässliche Spur",
     systemImage: "point.bottomleft.forward.to.point.topright.scurvepath",
     description: Text(model.account == nil
      ? "Verbinde dein WerkTag-Konto. Danach kannst du Wege bewusst aufzeichnen."
      : "Für diesen Tag sind noch keine ausreichend genauen Punkte verfügbar."))
     .frame(minHeight: 280)
   } else {
    Map(position: $camera) {
     ForEach(visibleSegments) { segment in
      ForEach(JourneyMapLine.lines(segment)) { line in
       MapPolyline(coordinates: line.samples.map { coordinate($0.record) })
        .stroke(line.confirmed ? WerkTagStyle.route : WerkTagStyle.accent,
                style: StrokeStyle(lineWidth: 4.5, lineCap: .round, lineJoin: .round,
                                   dash: line.confirmed ? [] : [8, 6]))
      }
     }
     if let first = visibleSegments.first?.start {
      Marker("Beginn", systemImage: "circle.fill", coordinate: coordinate(first.record))
       .tint(WerkTagStyle.route)
     }
     if let last = visibleSegments.last?.end, last.id != visibleSegments.first?.start.id {
      Marker("Zuletzt", systemImage: "location.fill", coordinate: coordinate(last.record))
       .tint(WerkTagStyle.accent)
     }
    }
    .mapStyle(.standard(elevation: .realistic, pointsOfInterest: .excludingAll))
    .mapControls { MapCompass(); MapScaleView() }
    .frame(height: 350)
    .accessibilityIdentifier("journey-map")
    .accessibilityLabel("Karte mit \(visibleSegments.count) getrennten Wegabschnitten")
   }
   VStack(alignment: .leading, spacing: 12) {
    HStack(spacing: 16) {
     Label("Bestätigt", systemImage: "line.diagonal").foregroundStyle(WerkTagStyle.route)
     Label("Ausstehend", systemImage: "line.diagonal.arrow").foregroundStyle(WerkTagStyle.accent)
    }
    .font(.caption.weight(.medium))
    Text("Durchgezogene Linien sind bestätigt, gestrichelte noch ausstehend. Lücken bleiben offen.")
     .font(.footnote).foregroundStyle(.secondary)
    if !model.journey.segments.isEmpty {
     Button {
      selectedSegmentID = nil; fit(model.journey.segments)
     } label: { Label("Tag auf Karte zeigen", systemImage: "arrow.up.left.and.arrow.down.right") }
      .buttonStyle(.bordered).accessibilityIdentifier("journey-fit")
    }
   }
   .padding(18)
  }
  .background(WerkTagStyle.surface, in: RoundedRectangle(cornerRadius: 24))
  .clipShape(RoundedRectangle(cornerRadius: 24))
 }

 private var summaryCard: some View {
  WerkTagCard {
   HStack {
    Text(selectedSegmentID == nil ? "Der Tag in Wegen" : "Ausgewählter Abschnitt").font(.headline)
    Spacer()
    Image(systemName: "point.topleft.down.to.point.bottomright.curvepath").foregroundStyle(WerkTagStyle.accent)
   }
   ViewThatFits(in: .horizontal) {
    HStack(alignment: .top, spacing: 18) { metrics }
    VStack(alignment: .leading, spacing: 16) { metrics }
   }
   Text("\(model.journey.confirmedCount) Punkte bestätigt · \(model.journey.pendingCount) noch ausstehend")
    .font(.footnote).foregroundStyle(.secondary).accessibilityIdentifier("journey-receipts")
   Text("Die Strecke folgt gemessenen Punkten. Sie ist eine Schätzung und keine berechnete Straßenroute.")
    .font(.footnote).foregroundStyle(.secondary)
   if model.journey.gapCount > 0 {
    Label("\(model.journey.gapCount) Unterbrechungen bleiben ohne Verbindungslinie.",
          systemImage: "point.forward.to.point.capsulepath")
     .font(.footnote).accessibilityIdentifier("journey-gaps")
   }
   if model.journey.poorFixCount > 0 {
    Text("\(model.journey.poorFixCount) ungenaue GPS-Punkte werden nicht verbunden.").font(.footnote).foregroundStyle(.secondary)
   }
   if model.journey.outlierCount > 0 {
    Text("\(model.journey.outlierCount) einzelne GPS-Ausreißer ausgeblendet.").font(.footnote).foregroundStyle(.secondary)
   }
   if model.journey.suppressedJitterCount > 0 {
    Text("Kleine GPS-Schwankungen werden bei der Streckenschätzung geglättet.").font(.footnote).foregroundStyle(.secondary)
   }
   if let loaded = model.journeyLoadedAt {
    Text("Mit WerkTag abgeglichen um \(loaded.formatted(date: .omitted, time: .shortened)).")
     .font(.caption).foregroundStyle(.secondary)
   } else if !model.showsExampleData {
    Text("Aktuell lokal verfügbare Punkte. Der gespeicherte Tagesverlauf wird bei Verbindung ergänzt.")
     .font(.caption).foregroundStyle(.secondary)
   }
  }
 }

 @ViewBuilder private var metrics: some View {
  JourneyMetric(title: "Gemessene Strecke", value: JourneyFormat.distance(selectedSegment?.distanceMetres ?? model.journey.distanceMetres))
  JourneyMetric(title: "Erfasste Zeit", value: JourneyFormat.duration(selectedSegment?.coveredSeconds ?? model.journey.coveredSeconds))
  JourneyMetric(title: "Abschnitte", value: "\(selectedSegment == nil ? model.journey.segments.count : 1)")
 }

 private var segmentsCard: some View {
  WerkTagCard {
   Text("Gemessene Abschnitte").font(.headline)
   Text("Tippe einen Abschnitt an, um ihn auf der Karte genauer anzusehen.")
    .font(.footnote).foregroundStyle(.secondary)
   ForEach(Array(model.journey.segments.enumerated()), id: \.element.id) { index, segment in
    if index > 0 { Divider() }
    Button {
     selectedSegmentID = segment.id; fit([segment])
    } label: {
     HStack(alignment: .top, spacing: 14) {
      Text(String(format: "%02d", index + 1)).font(.headline.monospacedDigit())
       .foregroundStyle(WerkTagStyle.accent)
      VStack(alignment: .leading, spacing: 5) {
       Text("Abschnitt \(index + 1)").font(.headline)
       Text("\(JourneyFormat.time(segment.start.record.tst)) – \(JourneyFormat.time(segment.end.record.tst))")
        .font(.subheadline).monospacedDigit()
       Text(segment.samples.count == 1 ? "Einzelner Messpunkt" :
             "\(JourneyFormat.distance(segment.distanceMetres)) · \(JourneyFormat.duration(segment.coveredSeconds))")
        .font(.footnote).foregroundStyle(.secondary)
      }
      Spacer(minLength: 0)
      Image(systemName: selectedSegmentID == segment.id ? "checkmark.circle.fill" : "arrow.up.right")
       .foregroundStyle(WerkTagStyle.accent)
     }
     .frame(maxWidth: .infinity, minHeight: 50, alignment: .leading)
     .contentShape(Rectangle())
    }
    .buttonStyle(.plain)
    .accessibilityIdentifier("journey-segment-\(index + 1)")
    .accessibilityAddTraits(selectedSegmentID == segment.id ? [.isSelected] : [])
   }
  }
 }

 private var recordingCard: some View {
  WerkTagCard {
   Label("Deine Aufzeichnung", systemImage: model.recording ? "location.fill" : "pause.circle").font(.headline)
   Text(model.locationStatus).font(.subheadline).foregroundStyle(.secondary)
   if model.recording {
    Button("Aufzeichnung beenden", role: .destructive) { model.stopLocation() }.buttonStyle(.bordered)
   } else {
    Button { model.startLocation() } label: { Label("Weg aufzeichnen", systemImage: "record.circle") }
     .buttonStyle(WerkTagPrimaryButton())
     .disabled(!model.canRecord).opacity(model.canRecord ? 1 : 0.5)
   }
   if model.account == nil {
    Text("Verbinde zuerst dein Konto im Tab „Verbindung“.").font(.footnote).foregroundStyle(.secondary)
   }
   StorageNotice()
   Text("Du startest bewusst. Die Aufnahme kann bei gesperrtem Bildschirm weiterlaufen; iOS, Berechtigungen und Empfang können Lücken verursachen.")
    .font(.footnote).foregroundStyle(.secondary)
  }
 }

 private func shiftDay(_ amount: Int) {
  if let day = JourneyDay.calendar.date(byAdding: .day, value: amount, to: selectedDay) {
   selectedDay = min(day, Date())
  }
 }
 private func coordinate(_ point: LocationRecord) -> CLLocationCoordinate2D {
  CLLocationCoordinate2D(latitude: point.lat, longitude: point.lon)
 }
 private func fit(_ segments: [JourneySegment]) {
  let coordinates = segments.flatMap(\.displaySamples).map { MKMapPoint(coordinate($0.record)) }
  guard let first = coordinates.first else { camera = .automatic; return }
  var rect = MKMapRect(origin: first, size: MKMapSize(width: 0, height: 0))
  for point in coordinates {
   rect = rect.union(MKMapRect(origin: point, size: MKMapSize(width: 0, height: 0)))
  }
  let minimum = MKMapPointsPerMeterAtLatitude(segments[0].start.record.lat) * 250
  let padded = rect.insetBy(dx: -max(rect.width * 0.2, minimum), dy: -max(rect.height * 0.2, minimum))
  guard padded.origin.x.isFinite, padded.origin.y.isFinite, padded.width.isFinite, padded.height.isFinite else { return }
  if reduceMotion { camera = .rect(padded) }
  else { withAnimation(.easeInOut(duration: 0.25)) { camera = .rect(padded) } }
 }
}

private struct JourneyMapLine: Identifiable {
 let id: String
 let samples: [JourneySample]
 let confirmed: Bool
 static func lines(_ segment: JourneySegment) -> [JourneyMapLine] {
  guard segment.displaySamples.count > 1 else { return [] }
  var result: [JourneyMapLine] = []
  var part = [segment.displaySamples[0]]
  var saved: Bool?
  for point in segment.displaySamples.dropFirst() {
   let confirmed = part.last!.confirmed && point.confirmed
   if let previous = saved, previous != confirmed {
    result.append(JourneyMapLine(id: "\(segment.id):\(result.count)", samples: part, confirmed: previous))
    part = [part.last!]
   }
   part.append(point); saved = confirmed
  }
  if let saved { result.append(JourneyMapLine(id: "\(segment.id):\(result.count)", samples: part, confirmed: saved)) }
  return result
 }
}
