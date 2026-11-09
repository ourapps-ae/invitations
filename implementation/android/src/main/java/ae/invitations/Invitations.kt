package ae.invitations

data class Invitation(val code: String, val roomId: String?)

// Same rules as the server's invitations.ts; the links round trip between the two.
object Invitations {
    const val ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
    private val ADDRESS = Regex("^https?://[A-Za-z0-9.-]+(:[0-9]{1,5})?(/[A-Za-z0-9._~/-]*)?$")
    private val ROOM = Regex("^[A-Za-z0-9_-]{1,64}$")

    // An absolute http or https address without credentials, query or fragment; trailing slashes are dropped.
    fun normaliseAddress(address: String?): String? =
        if (address != null && ADDRESS.matches(address)) address.trimEnd('/') else null

    // `pick` returns an index below the bound it is given (for example `{ random.nextInt(it) }`).
    fun generateCode(length: Int, pick: (Int) -> Int): String =
        buildString { repeat(length) { append(ALPHABET[pick(ALPHABET.length).coerceIn(0, ALPHABET.length - 1)]) } }

    // Codes are typed by people: case, spaces and hyphens do not matter.
    fun normaliseCode(code: String): String = code.uppercase().filter { !it.isWhitespace() && it != '-' }

    fun isValidCode(code: String, length: Int): Boolean {
        val c = normaliseCode(code)
        return c.length == length && c.all { it in ALPHABET }
    }

    fun formatCode(code: String, group: Int = 3): String = normaliseCode(code).chunked(group).joinToString("-")

    fun link(inviteAddress: String, codeLength: Int, invitation: Invitation): String? {
        val base = normaliseAddress(inviteAddress) ?: return null
        if (!isValidCode(invitation.code, codeLength)) return null
        if (invitation.roomId != null && !ROOM.matches(invitation.roomId)) return null
        return "$base?code=${normaliseCode(invitation.code)}" + (invitation.roomId?.let { "&room=$it" } ?: "")
    }

    fun parse(inviteAddress: String, codeLength: Int, link: String): Invitation? {
        val base = normaliseAddress(inviteAddress) ?: return null
        if (!link.startsWith("$base?")) return null
        val params = mutableMapOf<String, String>()
        for (pair in link.substring(base.length + 1).split("&")) {
            val index = pair.indexOf('=')
            val key = if (index < 0) pair else pair.substring(0, index)
            if (key !in params) params[key] = if (index < 0) "" else pair.substring(index + 1)
        }
        val code = params["code"] ?: return null
        if (!isValidCode(code, codeLength)) return null
        val room = params["room"]
        if (room != null && !ROOM.matches(room)) return null
        return Invitation(normaliseCode(code), room)
    }

    // What a scannable-code renderer encodes; drawing it needs a library.
    fun scanPayload(link: String): ByteArray = link.toByteArray(Charsets.UTF_8)
}
