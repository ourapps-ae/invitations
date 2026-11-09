import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { CODE_ALPHABET, formatCode, generateCode, inviteLink, isValidCode, normaliseAddress, normaliseCode, parseInvite, scanPayload } from "../implementation/server/invitations.ts";
import { shareInvitation } from "../implementation/web/share.ts";
import { inviteAndJoin } from "../examples/consumer.ts";

const fx = JSON.parse(readFileSync(new URL("fixtures/invites.json", import.meta.url), "utf8"));
const settings = fx.settings;

test("invite address grammar", () => {
  for (const [input, expected] of fx.addresses) assert.equal(normaliseAddress(input), expected, input);
  assert.equal(normaliseAddress(undefined), null);
});

test("codes are generated from the unambiguous alphabet and stay inside it for any random value", () => {
  assert.equal(CODE_ALPHABET.length, 31);
  for (const { picks, code } of fx.generate) {
    let i = 0;
    assert.equal(generateCode(picks.length, () => (picks[i++] + 0.5) / CODE_ALPHABET.length), code);
  }
  assert.equal(generateCode(4, () => 0.999999999), "9999");
  assert.equal(generateCode(0), "");
  const random = generateCode(500);
  assert.ok([...random].every((c) => CODE_ALPHABET.includes(c)));
  assert.ok(new Set(random).size > 20, "uses the whole alphabet");
});

test("code normalising, validating and reading-out format", () => {
  for (const [input, valid, normalised, formatted] of fx.codes) {
    assert.equal(normaliseCode(input), normalised, input);
    assert.equal(isValidCode(input, 6), valid, input);
    assert.equal(formatCode(input), formatted, input);
  }
});

test("links round trip and refuse bad codes and room ids", () => {
  for (const [code, roomId, link] of fx.links) assert.equal(inviteLink(settings, { code, roomId }), link, code);
  assert.equal(inviteLink({ ...settings, inviteAddress: "nonsense" }, { code: "KT7Q2P", roomId: null }), null);
});

test("parsing accepts only this application's links", () => {
  for (const [link, expected] of fx.parse) assert.deepEqual(parseInvite(settings, link), expected && { code: expected[0], roomId: expected[1] }, link);
  const made = inviteLink(settings, { code: "m4nw9x", roomId: "r-9" })!;
  assert.deepEqual(parseInvite(settings, made), { code: "M4NW9X", roomId: "r-9" });
});

test("scan payload is the link, with a correction level for the renderer", () => {
  assert.deepEqual(scanPayload("https://play.example/join?code=KT7Q2P"), { text: "https://play.example/join?code=KT7Q2P", correctionLevel: "M" });
});

test("sharing uses the system sheet, then the clipboard, and reports a closed sheet quietly", async () => {
  const sent: unknown[] = [];
  assert.equal(await shareInvitation("L", "T", { share: async (d) => void sent.push(d) }), "shared");
  assert.deepEqual(sent, [{ text: "T", url: "L" }]);
  const abort = Object.assign(new Error("closed"), { name: "AbortError" });
  assert.equal(await shareInvitation("L", "T", { share: async () => { throw abort; }, writeText: async () => { throw new Error("must not copy"); } }), "cancelled");
  let copied = "";
  assert.equal(await shareInvitation("L", "T", { writeText: async (t) => void (copied = t) }), "copied");
  assert.equal(copied, "L");
  assert.equal(await shareInvitation("L", "T", { share: async () => { throw new Error("denied"); }, writeText: async (t) => void (copied = t + "!") }), "copied");
  assert.equal(await shareInvitation("L", "T", { writeText: async () => { throw new Error("blocked"); } }), "unavailable");
  assert.equal(await shareInvitation("L", "T", {}), "unavailable");
});

test("example: create a code, share the link, open it again", async () => {
  let i = 0;
  const picks = [0, 1, 2, 3, 4, 5];
  const result = await inviteAndJoin(settings, () => (picks[i++] + 0.5) / 31, { writeText: async () => {} });
  assert.deepEqual(result, { code: "ABCDEF", link: "https://play.example/join?code=ABCDEF&room=garden-1", shared: "copied", spoken: "ABC-DEF", scan: true, opened: { code: "ABCDEF", roomId: "garden-1" } });
});
