import CoreLocation
import Foundation

@MainActor
final class LocationRecorder: NSObject, CLLocationManagerDelegate {
 private let manager=CLLocationManager()
 var onRecord: ((LocationRecord)->Void)?
 var onStatus: ((String)->Void)?
 private(set) var running=false
 private var startRequested=false
 override init() {
  super.init();manager.delegate=self
  manager.desiredAccuracy=kCLLocationAccuracyBest
  manager.distanceFilter=25
  manager.activityType = .other
  manager.pausesLocationUpdatesAutomatically=true
 }
 func start() {
  startRequested=true
  switch manager.authorizationStatus {
  case .notDetermined: manager.requestWhenInUseAuthorization()
  case .authorizedAlways,.authorizedWhenInUse:
   guard CLLocationManager.locationServicesEnabled() else {onStatus?("Standortdienste ausgeschaltet.");return}
   manager.allowsBackgroundLocationUpdates=true
   manager.showsBackgroundLocationIndicator=true
   manager.startUpdatingLocation();running=true
   onStatus?(manager.accuracyAuthorization == .fullAccuracy ? "Weg wird aufgezeichnet." : "Nur ungefährer Standort freigegeben.")
  default: startRequested=false;onStatus?("Standortzugriff fehlt. Bitte in den iPhone-Einstellungen erlauben.")
  }
 }
 func stop() {startRequested=false;running=false;manager.stopUpdatingLocation();onStatus?("Aufzeichnung pausiert.")}
 func locationManagerDidChangeAuthorization(_ manager:CLLocationManager) {
  if startRequested {start()}
  if manager.authorizationStatus == .denied || manager.authorizationStatus == .restricted {stop()}
 }
 func locationManager(_ manager:CLLocationManager,didUpdateLocations locations:[CLLocation]) {
  guard running else {return}
  for l in locations where l.horizontalAccuracy>=0 && abs(l.timestamp.timeIntervalSinceNow)<300 {
   onRecord?(LocationRecord(tst:Int(l.timestamp.timeIntervalSince1970),lat:l.coordinate.latitude,lon:l.coordinate.longitude,acc:l.horizontalAccuracy,
    alt:l.verticalAccuracy>=0 ? l.altitude:nil,vel:l.speed>=0 ? l.speed*3.6:nil,cog:l.course>=0 ? l.course:nil))
  }
 }
 func locationManager(_ manager:CLLocationManager,didFailWithError error:Error) {onStatus?("Standort vorübergehend nicht verfügbar.")}
 func locationManagerDidPauseLocationUpdates(_ manager:CLLocationManager) {onStatus?("iOS hat die Standortaufzeichnung vorübergehend pausiert.")}
 func locationManagerDidResumeLocationUpdates(_ manager:CLLocationManager) {onStatus?("Weg wird aufgezeichnet.")}
}

