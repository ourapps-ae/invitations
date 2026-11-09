import { formatCode, generateCode, inviteLink, parseInvite, scanPayload, type InvitationSettings } from "../implementation/server/invitations.ts";
import { shareInvitation, type ShareEnvironment } from "../implementation/web/share.ts";

// A room is created with a code; the host shares the link; a guest opens it and the code names the room.
export async function inviteAndJoin(settings: InvitationSettings, random: () => number, env: ShareEnvironment) {
  const code = generateCode(settings.codeLength, random);
  const link = inviteLink(settings, { code, roomId: "garden-1" })!;
  const shared = await shareInvitation(link, `Join me: ${formatCode(code)}`, env);
  const opened = parseInvite(settings, link);
  return { code, link, shared, spoken: formatCode(code), scan: scanPayload(link).text === link, opened };
}
