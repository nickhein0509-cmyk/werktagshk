import XCTest
@testable import WerkTagCore
final class QueueTests:XCTestCase {
 var directory:URL!
 let owner=UUID()
 override func setUpWithError()throws {directory=FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)}
 override func tearDownWithError()throws {if FileManager.default.fileExists(atPath:directory.path){try FileManager.default.removeItem(at:directory)}}
 func event()->TransferEvent {TransferEvent(location:LocationRecord(tst:1793275140,lat:48,lon:8,acc:10))}
 func testRestartRetainsIDsAndOnlyReceiptRemoves()throws{
  let q=try DurableQueue(directory:directory,accountId:owner),e=event()
  try q.append([e])
  let restored=try DurableQueue(directory:directory,accountId:owner)
  XCTAssertEqual(restored.state.events,[e])
  let b=try restored.batch(for:owner)
  try restored.acknowledge(Receipt(accepted:[e.id],receivedAt:"2026-10-29T12:00:00.123Z"),batch:b,account:owner)
  XCTAssertEqual(try DurableQueue(directory:directory,accountId:owner).state.events.count,0)
  XCTAssertEqual(restored.state.acknowledgedCount,1)
 }
 func testWrongOrPartialReceiptDoesNotDelete()throws{
  let q=try DurableQueue(directory:directory,accountId:owner)
  try q.append([event(),event()]);let b=try q.batch(for:owner)
  for ids in [[UUID()],[b.events[0].id],[b.events[0].id,b.events[0].id]]{
   XCTAssertThrowsError(try q.acknowledge(Receipt(accepted:ids,receivedAt:"2026-10-29T12:00:00Z"),batch:b,account:owner))
   XCTAssertEqual(q.state.events.count,2)
  }
 }
 func testNewlyCapturedDataSurvivesEarlierReceipt()throws{
  let q=try DurableQueue(directory:directory,accountId:owner);try q.append([event()])
  let b=try q.batch(for:owner),new=event();try q.append([new])
  try q.acknowledge(Receipt(accepted:b.events.map(\.id),receivedAt:"2026-10-29T12:00:00Z"),batch:b,account:owner)
  XCTAssertEqual(q.state.events,[new])
 }
 func testAccountIsolation()throws{
  let q=try DurableQueue(directory:directory,accountId:owner);try q.append([event()])
  XCTAssertThrowsError(try q.batch(for:UUID()))
  let other=try DurableQueue(directory:directory,accountId:UUID());XCTAssertTrue(other.state.events.isEmpty)
 }
 func testFailedDiskWriteDoesNotChangeMemoryOrLoseEvents()throws{
  let original=try DurableQueue(directory:directory,accountId:owner);try original.append([event()])
  let q=try DurableQueue(directory:directory,accountId:owner,writer:{_,_ in throw TransferError.storage("disk")})
  XCTAssertThrowsError(try q.append([event()]))
  XCTAssertEqual(q.state.events,original.state.events)
  let b=try q.batch(for:owner)
  XCTAssertThrowsError(try q.acknowledge(Receipt(accepted:b.events.map(\.id),receivedAt:"2026-10-29T12:00:00Z"),batch:b,account:owner))
  XCTAssertEqual(try DurableQueue(directory:directory,accountId:owner).state.events,original.state.events)
 }
 func testCorruptQueueIsNotSilentlyReplaced()throws{
  try FileManager.default.createDirectory(at:directory,withIntermediateDirectories:true)
  try Data("broken".utf8).write(to:directory.appendingPathComponent(owner.uuidString+".json"))
  XCTAssertThrowsError(try DurableQueue(directory:directory,accountId:owner))
 }
 func testBatchSizeAndBackoff()throws{
  let q=try DurableQueue(directory:directory,accountId:owner);try q.append((0..<150).map{_ in event()})
  XCTAssertEqual(try q.batch(for:owner).events.count,100)
  XCTAssertEqual(DurableQueue.retryDelay(attempt:1),10)
  XCTAssertEqual(DurableQueue.retryDelay(attempt:100),3600)
  XCTAssertEqual(DurableQueue.retryDelay(attempt:1,retryAfter:120),120)
 }
}
