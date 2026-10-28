import Foundation
import HealthKit

@MainActor
final class HealthReader {
 let store=HKHealthStore()
 private let steps=HKQuantityType.quantityType(forIdentifier:.stepCount)!
 private let energy=HKQuantityType.quantityType(forIdentifier:.activeEnergyBurned)!
 private let pulse=HKQuantityType.quantityType(forIdentifier:.heartRate)!
 func authorize() async throws {
  guard HKHealthStore.isHealthDataAvailable() else {throw TransferError.storage("Health nicht verfügbar")}
  try await store.requestAuthorization(toShare:[],read:Set([steps,energy,pulse]))
 }
 private func value(_ type:HKQuantityType,unit:HKUnit,start:Date,end:Date,sum:Bool) async throws -> Double? {
  try await withCheckedThrowingContinuation { continuation in
   let query=HKStatisticsQuery(quantityType:type,quantitySamplePredicate:HKQuery.predicateForSamples(withStart:start,end:end,options:.strictStartDate),options:sum ? .cumulativeSum:.discreteAverage) { _,statistics,error in
    if let error=error {continuation.resume(throwing:error);return}
    let quantity=sum ? statistics?.sumQuantity():statistics?.averageQuantity()
    continuation.resume(returning:quantity?.doubleValue(for:unit))
   }
   store.execute(query)
  }
 }
 func readWeek() async throws -> [HealthDay] {
  var calendar=Calendar(identifier:.gregorian);calendar.timeZone=TimeZone(identifier:"Europe/Berlin")!
  let formatter=DateFormatter();formatter.calendar=calendar;formatter.timeZone=calendar.timeZone;formatter.dateFormat="yyyy-MM-dd";formatter.locale=Locale(identifier:"en_US_POSIX")
  let now=Date(),today=calendar.startOfDay(for:now)
  var days:[HealthDay]=[]
  for offset in 0..<7 {
   guard let start=calendar.date(byAdding:.day,value:-offset,to:today),let end=calendar.date(byAdding:.day,value:1,to:start) else {continue}
   let until=min(end,now)
   let stepValue=try await value(steps,unit:.count(),start:start,end:until,sum:true)
   let energyValue=try await value(energy,unit:.kilocalorie(),start:start,end:until,sum:true)
   let pulseValue=try await value(pulse,unit:HKUnit.count().unitDivided(by:.minute()),start:start,end:until,sum:false)
   days.append(HealthDay(date:formatter.string(from:start),steps:stepValue.map{Int($0.rounded())},activeEnergyKcal:energyValue,heartRateBpm:pulseValue))
  }
  return days
 }
}
