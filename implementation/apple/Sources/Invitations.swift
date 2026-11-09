import Foundation

struct Invitation: Equatable {
    let code: String
    let roomId: String?
}

// Same rules as the server's invitations.ts; the links round trip between the two.
enum Invitations {
    static let alphabet = Array("ABCDEFGHJKMNPQRSTUVWXYZ23456789")

    // An absolute http or https address without credentials, query or fragment; trailing slashes are dropped.
    static func normaliseAddress(_ address: String?) -> String? {
        guard let address, address.range(of: "^https?://[A-Za-z0-9.-]+(:[0-9]{1,5})?(/[A-Za-z0-9._~/-]*)?$", options: .regularExpression) != nil else { return nil }
        var result = address
        while result.hasSuffix("/") { result.removeLast() }
        return result
    }

    // `pick` returns an index below the bound it is given (for example `Int.random(in: 0..<n)`).
    static func generateCode(length: Int, pick: (Int) -> Int) -> String {
        String((0..<length).map { _ in alphabet[min(alphabet.count - 1, max(0, pick(alphabet.count)))] })
    }

    // Codes are typed by people: case, spaces and hyphens do not matter.
    static func normaliseCode(_ code: String) -> String {
        code.uppercased().filter { !$0.isWhitespace && $0 != "-" }
    }

    static func isValidCode(_ code: String, length: Int) -> Bool {
        let c = normaliseCode(code)
        return c.count == length && c.allSatisfy { alphabet.contains($0) }
    }

    static func formatCode(_ code: String, group: Int = 3) -> String {
        let c = Array(normaliseCode(code))
        return stride(from: 0, to: c.count, by: group).map { String(c[$0..<min($0 + group, c.count)]) }.joined(separator: "-")
    }

    private static func validRoom(_ room: String) -> Bool {
        !room.isEmpty && room.count <= 64 && room.range(of: "^[A-Za-z0-9_-]+$", options: .regularExpression) != nil
    }

    static func link(inviteAddress: String, codeLength: Int, _ invitation: Invitation) -> String? {
        guard let base = normaliseAddress(inviteAddress), isValidCode(invitation.code, length: codeLength) else { return nil }
        if let room = invitation.roomId, !validRoom(room) { return nil }
        return "\(base)?code=\(normaliseCode(invitation.code))" + (invitation.roomId.map { "&room=\($0)" } ?? "")
    }

    static func parse(inviteAddress: String, codeLength: Int, _ link: String) -> Invitation? {
        guard let base = normaliseAddress(inviteAddress), link.hasPrefix(base + "?") else { return nil }
        var params: [String: String] = [:]
        for pair in link.dropFirst(base.count + 1).split(separator: "&", omittingEmptySubsequences: false) {
            let parts = pair.split(separator: "=", maxSplits: 1, omittingEmptySubsequences: false)
            let key = String(parts[0])
            if params[key] == nil { params[key] = parts.count > 1 ? String(parts[1]) : "" }
        }
        guard let code = params["code"], isValidCode(code, length: codeLength) else { return nil }
        if let room = params["room"], !validRoom(room) { return nil }
        return Invitation(code: normaliseCode(code), roomId: params["room"])
    }

    // What a scannable-code renderer encodes (iOS: CIFilter.qrCodeGenerator with correction level "M").
    static func scanPayload(_ link: String) -> Data { Data(link.utf8) }
}
