import Foundation

func check(_ condition: Bool, _ message: String) {
    if !condition { FileHandle.standardError.write(Data("FAILED: \(message)\n".utf8)); exit(1) }
}

let fixture = try JSONSerialization.jsonObject(with: Data(contentsOf: URL(fileURLWithPath: "tests/fixtures/invites.json"))) as! [String: Any]
let settings = fixture["settings"] as! [String: Any]
let address = settings["inviteAddress"] as! String
let length = settings["codeLength"] as! Int
var count = 0

for row in fixture["addresses"] as! [[Any]] {
    check(Invitations.normaliseAddress(row[0] as? String) == (row[1] as? String), "address \(row)")
    count += 1
}
for row in fixture["generate"] as! [[String: Any]] {
    var picks = (row["picks"] as! [Int])[...]
    check(Invitations.generateCode(length: picks.count, pick: { _ in picks.removeFirst() }) == (row["code"] as! String), "generate \(row)")
    count += 1
}
check(Invitations.generateCode(length: 3, pick: { _ in 99 }) == "999", "an out-of-range pick stays inside the alphabet")
for row in fixture["codes"] as! [[Any]] {
    let input = row[0] as! String
    check(Invitations.isValidCode(input, length: length) == (row[1] as! Bool), "valid \(row)")
    check(Invitations.normaliseCode(input) == (row[2] as! String), "normalise \(row)")
    check(Invitations.formatCode(input) == (row[3] as! String), "format \(row)")
    count += 3
}
for row in fixture["links"] as! [[Any]] {
    let invitation = Invitation(code: row[0] as! String, roomId: row[1] as? String)
    check(Invitations.link(inviteAddress: address, codeLength: length, invitation) == (row[2] as? String), "link \(row)")
    count += 1
}
for row in fixture["parse"] as! [[Any]] {
    let parsed = Invitations.parse(inviteAddress: address, codeLength: length, row[0] as! String)
    if let expected = row[1] as? [Any] {
        check(parsed == Invitation(code: expected[0] as! String, roomId: expected[1] as? String), "parse \(row)")
    } else {
        check(parsed == nil, "parse \(row)")
    }
    count += 1
}
check(Invitations.scanPayload("https://x.example/?code=ABCDEF") == Data("https://x.example/?code=ABCDEF".utf8), "payload")
print("\(count + 2) invitation assertions passed")
