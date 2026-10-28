import SwiftUI
import BackgroundTasks

@MainActor final class AppDelegate:NSObject,UIApplicationDelegate {
 func application(_ application:UIApplication,didFinishLaunchingWithOptions options:[UIApplication.LaunchOptionsKey:Any]?=nil)->Bool{
  BGTaskScheduler.shared.register(forTaskWithIdentifier:"com.werktag.assistant.upload",using:nil){ task in
   guard let refresh=task as? BGAppRefreshTask else{task.setTaskCompleted(success:false);return}
   Task { @MainActor in AppModel.shared.runBackground(refresh) }
  }
  return true
 }
}
@main
@MainActor struct WerkTagApp:App {
 @UIApplicationDelegateAdaptor(AppDelegate.self) var delegate
 @State private var model=AppModel.shared
 @Environment(\.scenePhase) private var phase
 var body:some Scene {
  WindowGroup {
   RootView().environment(model)
    .tint(Color(red:0.07,green:0.40,blue:0.37))
    .task {await model.foreground()}
    .onChange(of:phase){_,new in
     if new == .active {Task {await model.foreground()}}
     if new == .background {model.scheduleBackground()}
    }
  }
 }
}
