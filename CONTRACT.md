# Invitations component

## Purpose and facilities
`invitations` makes the link and the short code a person uses to invite others into a room: it generates a code from an alphabet with no look-alike characters, builds a link on the application's invite address that carries the code (and optionally a room), parses such a link back, formats a code for reading out and offers the link through the system share sheet or the clipboard on the web. It supplies the text a scannable-code renderer encodes; drawing the scannable code is a platform call and is not in this component.

Facilities: `invitations` (Invitation codes, links, parsing, sharing and scan payload).

## User inputs
Two settings. `inviteAddress` (address grammar, optional: without it no links are made) is the application's own page that invitation links point to: an absolute http or https address with no credentials, query or fragment. `codeLength` (default 6) is the number of characters in a code.

- `inviteAddress` (string, address; optional)
- `codeLength` (integer; optional; default `6`)

## Artefacts and dependencies
`component.json` maps every `implementation/` source into `components/invitations/`:

- `implementation/android/src/main/java/ae/invitations/Invitations.kt` -> `components/invitations/android/src/main/java/ae/invitations/Invitations.kt`
- `implementation/apple/Sources/Invitations.swift` -> `components/invitations/apple/Sources/Invitations.swift`
- `implementation/server/invitations.ts` -> `components/invitations/server/invitations.ts`
- `implementation/web/share.ts` -> `components/invitations/web/share.ts`

Dependencies: none.
`tools.lock.json` pins verification tools: node 26.5.0, python3 3.12.8, swiftc 6.4.2, kotlinc 2.2.0, java 26.0.1. Licence wording remains deferred.

## Provided interfaces
- `interfaces/invitations.json` defines `invitations` (ae/invitations) version 1.0.0 as an OpenRPC 1.3.2 document: the TypeScript functions (tagged `typescript`) and the native `Invitations.*` functions (tagged `swift` and `kotlin`), with the settings, invitation, link grammar and share result as JSON Schema 2020-12.

## Required interfaces
None.

## Integration
Server: when a room is created call `generateCode(settings.codeLength, random)`, keep it with the room and give it to the directory entry so people can join by code; send `inviteLink(settings, { code, roomId })` in the room's view for clients to show or share. Web: `shareInvitation(link, text, { share: navigator.share?.bind(navigator), writeText: navigator.clipboard?.writeText.bind(navigator.clipboard) })`. All platforms: `parseInvite` on a link the application was opened with. Scannable code: pass `scanPayload(link).text` to the platform's renderer (iOS Core Image `CIFilter.qrCodeGenerator`, level M, as the recipe does; Android and web need a library or service chosen by the application). `examples/consumer.ts` runs the whole cycle without a game.

## Visual definition and connected examples
`visual/definition.json` maps its ports to the provided and required interfaces. `visual/examples/connected.json` connects the component to an illustrative application consumer. Both image formats and a text description are in `visual/output/`.

## Infrastructure
No service. The invite address belongs to the application's web hosting.

## Verification
Required-local: `node --test tests/web.test.ts` checks the address grammar, generation inside the alphabet, normalising and reading-out format, link building and parsing against `tests/fixtures/invites.json`, the scan payload, every sharing outcome and the example. Platform: `python3 tests/native.py apple` compiles and runs the Swift port against the same fixture; `python3 tests/native.py android` compiles the Kotlin port (needs kotlinc, not installed on the authoring machine, so not run there).

- `node --test tests/web.test.ts` (web, required-local; tools: node 26.5.0)
- `python3 tests/native.py apple` (apple, platform; tools: python3 3.12.8, swiftc 6.4.2)
- `python3 tests/native.py android` (android, platform; tools: python3 3.12.8, kotlinc 2.2.0, java 26.0.1)

## Scenarios and presentation
A host creates a room; the screen shows `KT7-Q2P` to read out and a link to share. A guest types `kt7q2p` with different spacing and case and the right room is found. A guest scans the scannable code drawn from the payload and the application opens on the invite address with the code and room filled in. A link from another site, with a wrong-length code or an invalid room id, is ignored.

## Updates and removal
Patch updates replace files; no persisted-state migration. Codes live with the rooms that use them. The link grammar is part of the interface: changing it needs a new interface version.
