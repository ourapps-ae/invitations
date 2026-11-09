import ae.invitations.Invitation
import ae.invitations.Invitations

// The cases of tests/fixtures/invites.json, written out so no JSON library is needed.
fun main() {
    val address = "https://play.example/join/"
    check(Invitations.normaliseAddress(address) == "https://play.example/join")
    check(Invitations.normaliseAddress("http://localhost:8788") == "http://localhost:8788")
    check(Invitations.normaliseAddress("https://play.example") == "https://play.example")
    for (bad in listOf("https://user@play.example/", "https://play.example/?a=1", "https://play.example/a#b", "ftp://play.example", "play.example", "")) check(Invitations.normaliseAddress(bad) == null) { bad }
    check(Invitations.normaliseAddress(null) == null)

    fun generate(picks: List<Int>): String { val iterator = picks.iterator(); return Invitations.generateCode(picks.size) { _ -> iterator.next() } }
    check(generate(listOf(0, 1, 2, 3, 4, 5)) == "ABCDEF")
    check(generate(listOf(30, 22, 8, 9, 10, 11)) == "9ZJKMN")
    check(Invitations.generateCode(3) { 99 } == "999")

    check(Invitations.isValidCode("kt7-q2p", 6) && Invitations.normaliseCode("kt7-q2p") == "KT7Q2P" && Invitations.formatCode("kt7-q2p") == "KT7-Q2P")
    check(Invitations.isValidCode("  ab cd-ef  ", 6) && Invitations.formatCode("  ab cd-ef  ") == "ABC-DEF")
    for (bad in listOf("KT7Q2", "KT7Q2PX", "KT0Q2P", "KT1Q2P")) check(!Invitations.isValidCode(bad, 6)) { bad }
    check(Invitations.formatCode("KT7Q2PX") == "KT7-Q2P-X")

    check(Invitations.link(address, 6, Invitation("kt7-q2p", null)) == "https://play.example/join?code=KT7Q2P")
    check(Invitations.link(address, 6, Invitation("KT7Q2P", "garden-1")) == "https://play.example/join?code=KT7Q2P&room=garden-1")
    check(Invitations.link(address, 6, Invitation("KT7Q2P", "bad room")) == null)
    check(Invitations.link(address, 6, Invitation("short", null)) == null)

    check(Invitations.parse(address, 6, "https://play.example/join?code=KT7Q2P") == Invitation("KT7Q2P", null))
    check(Invitations.parse(address, 6, "https://play.example/join?room=r1&code=kt7-q2p") == Invitation("KT7Q2P", "r1"))
    check(Invitations.parse(address, 6, "https://play.example/join?code=KT7Q2P&code=ZZZZZZ") == Invitation("KT7Q2P", null))
    for (bad in listOf("https://other.example/join?code=KT7Q2P", "https://play.example/joined?code=KT7Q2P", "https://play.example/join?code=KT7Q2", "https://play.example/join?code=KT7Q2P&room=bad%20room", "https://play.example/join")) {
        check(Invitations.parse(address, 6, bad) == null) { bad }
    }
    check(String(Invitations.scanPayload("https://x.example/?code=ABCDEF"), Charsets.UTF_8) == "https://x.example/?code=ABCDEF")
    println("invitation assertions passed")
}
