import SwiftUI

@MainActor struct RootView: View {
 @Environment(AppModel.self) private var model
 var body: some View {
  TabView {
   NavigationStack { TodayView() }
    .tabItem { Label("Heute", systemImage: "sun.max") }
   NavigationStack { JourneyView() }
    .tabItem { Label("Wege", systemImage: "map") }
   NavigationStack { ConnectionView() }
    .tabItem { Label("Verbindung", systemImage: "antenna.radiowaves.left.and.right") }
  }
  .tint(WerkTagStyle.accent)
  .task {
   while !Task.isCancelled {
    do { try await Task.sleep(for: .seconds(30)) } catch { return }
    await model.sync()
   }
  }
 }
}
