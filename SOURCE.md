# Source mapping

Reference revision: `19905b75dbea89fbfd424d67fe26c81aaed0e018`. Paths are under `OurPoker/recipe/`.

What the recipe has is small: one invitation address from the environment (`INVITE_URL`, `server/src/index.ts` line 15; `server/src/services.ts` lines 6-9 `updateLinks`) is passed to every client as `inviteUrl` (`server/src/contract.ts` line 227, `server/src/adapter.ts` line 106, `web/src/api.ts` line 44, `ios/OurPoker/Sources/Model.swift` line 251, `android/.../net/Model.kt` line 181), and the iOS table viewer draws it as a scannable code with the text "Scan to get OurPoker" (`ios/OurPoker/Sources/DisplayScreen.swift` lines 568-575 and `qrCode` lines 605-612). That address is a store link for getting the application, not a link to one room. The web and Android screens have no share, invite-code or scan code (`web/src/store.ts` and `web/src/screens.ts` contain none). The recipe has no QR payload generator: iOS hands the link text to Core Image.

## Files

- `implementation/server/invitations.ts`:
  - `normaliseAddress`, `InvitationSettings.inviteAddress`: from the recipe's single optional address (`updateLinks`, `services.ts` lines 6-9), which is undefined when the address is absent; made a typed setting with a checked grammar (absolute http or https, no credentials, query or fragment).
  - `scanPayload`: the text and correction level `M` that `DisplayScreen.swift` lines 605-612 hands to Core Image.
  - `generateCode`, `normaliseCode`, `isValidCode`, `formatCode`, `inviteLink`, `parseInvite`: new (`generated-platform`). The recipe has no codes; they are added because the batch asks for invitation links and codes for a room. `normaliseCode` follows the same rule as the room-directory component's join by code.
- `implementation/web/share.ts`: new (`generated-platform`): system share sheet or clipboard, with injected environment.
- `implementation/apple/Sources/Invitations.swift`, `implementation/android/src/main/java/ae/invitations/Invitations.kt`: ports of `invitations.ts`, marked `generated-platform`. The Swift scan payload is the data `DisplayScreen.swift` line 607 builds (`Data(text.utf8)`). The Kotlin port is not compiled on the authoring machine (no kotlinc).

## Left behind in the recipe

- The Core Image rendering of the scannable code (`DisplayScreen.swift` lines 605-612, needs `UIKit`) and its layout (lines 566-580): a platform call that stays in the application.
- Store update links (`updateUrlFor`) belong to the store-update component.
- The table viewer's join text (`viewer_scan`, `viewer_join` in `web/src/strings.json`).
