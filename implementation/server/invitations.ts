// Invitations: a link to the application with a short code, for people to type, share or scan.
// The invite address is the application's own page (set by the installer); the recipe passes it
// through as an `inviteUrl` and draws it as a scannable code on one platform.
export type InvitationSettings = { inviteAddress: string; codeLength: number };
export type Invitation = { code: string; roomId: string | null };

// No 0, O, 1, I or L: codes are read aloud and typed.
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const ADDRESS = /^https?:\/\/[A-Za-z0-9.-]+(:[0-9]{1,5})?(\/[A-Za-z0-9._~\-\/]*)?$/;
const ROOM_ID = /^[A-Za-z0-9_-]{1,64}$/;

// An absolute http or https address without credentials, query or fragment; trailing slashes are dropped.
export function normaliseAddress(address: string | undefined): string | null {
  if (typeof address !== "string" || !ADDRESS.test(address)) return null;
  return address.replace(/\/+$/, "");
}

// A random code from the alphabet; `random` returns a number in [0, 1) as Math.random does.
export function generateCode(length: number, random: () => number = Math.random, alphabet: string = CODE_ALPHABET): string {
  let code = "";
  for (let i = 0; i < length; i++) code += alphabet[Math.min(alphabet.length - 1, Math.floor(random() * alphabet.length))];
  return code;
}

// Codes are typed by people: case, spaces and hyphens do not matter.
export function normaliseCode(code: string): string {
  return code.toUpperCase().replace(/[\s-]+/g, "");
}

export function isValidCode(code: string, length: number, alphabet: string = CODE_ALPHABET): boolean {
  const c = normaliseCode(code);
  return c.length === length && [...c].every((ch) => alphabet.includes(ch));
}

// For reading out: groups of three, "KT7-Q2P".
export function formatCode(code: string, group = 3): string {
  const c = normaliseCode(code);
  const parts: string[] = [];
  for (let i = 0; i < c.length; i += group) parts.push(c.slice(i, i + group));
  return parts.join("-");
}

// The link to share: the invite address with the code, and the room when the link is for one room.
export function inviteLink(settings: InvitationSettings, invitation: Invitation): string | null {
  const base = normaliseAddress(settings.inviteAddress);
  if (!base || !isValidCode(invitation.code, settings.codeLength)) return null;
  if (invitation.roomId !== null && !ROOM_ID.test(invitation.roomId)) return null;
  const room = invitation.roomId === null ? "" : `&room=${invitation.roomId}`;
  return `${base}?code=${normaliseCode(invitation.code)}${room}`;
}

// The reverse: the code and room of a link made by `inviteLink`, or null for any other address.
export function parseInvite(settings: InvitationSettings, link: string): Invitation | null {
  const base = normaliseAddress(settings.inviteAddress);
  if (!base || !link.startsWith(base + "?")) return null;
  const params = new Map<string, string>();
  for (const pair of link.slice(base.length + 1).split("&")) {
    const index = pair.indexOf("=");
    const key = index < 0 ? pair : pair.slice(0, index);
    if (!params.has(key)) params.set(key, index < 0 ? "" : pair.slice(index + 1));
  }
  const code = params.get("code");
  const room = params.get("room") ?? null;
  if (code === undefined || !isValidCode(code, settings.codeLength)) return null;
  if (room !== null && !ROOM_ID.test(room)) return null;
  return { code: normaliseCode(code), roomId: room };
}

// What a scannable-code renderer encodes. Drawing it is a platform call: iOS has Core Image's
// QR generator, Android needs a library, the web a library or a service.
export function scanPayload(link: string): { text: string; correctionLevel: "L" | "M" | "Q" | "H" } {
  return { text: link, correctionLevel: "M" };
}
