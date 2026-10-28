// swift-tools-version: 5.9
import PackageDescription
let package = Package(name: "WerkTagCore", platforms: [.macOS(.v13), .iOS(.v17)],
 products: [.library(name: "WerkTagCore", targets: ["WerkTagCore"])],
 targets: [.target(name: "WerkTagCore", path: "WerkTag/Core"),
 .testTarget(name: "WerkTagCoreTests", dependencies: ["WerkTagCore"], path: "Tests")])

