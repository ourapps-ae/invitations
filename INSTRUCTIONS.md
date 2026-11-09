# Invitations instructions

## For the agent
Select this component when people join by link, typed code or scannable code. Set `inviteAddress` from the application's own web address (ask the developer; it is not a secret) and keep `codeLength` at 6 unless the room count demands more. Connect it to the room directory (codes) and to the host screens (share and scan). If the application needs a drawn scannable code, choose a renderer for each platform separately.

- Select package `ourapps-ae/invitations` version `0.1.1`.
- Settings to configure:
  - `inviteAddress` (string, address; optional)
  - `codeLength` (integer; optional; default `6`)
- Connect the provided `invitations` (ae/invitations 1.0.0) to the consumer that needs it.
- No accounts or keys are needed.

## For the developer
Supply the invite address. Decide how a scannable code is drawn on each platform; this component only gives the text. Keep the code with the room record and expose it in the room list. No accounts or keys are needed.

## How to check
From the component directory:

- `node --test tests/web.test.ts` (web, required-local; tools: node 26.5.0)
- `python3 tests/native.py apple` (apple, platform; tools: python3 3.12.8, swiftc 6.4.2)
- `python3 tests/native.py android` (android, platform; tools: python3 3.12.8, kotlinc 2.2.0, java 26.0.1)
- `python3.12 -B /Users/george/Projects/com/my/tools/check_component.py components/invitations` validates the manifest, sidecars and runs the required-local suite.
