# ADR 0002 · Extensions are declarative

**Status:** proposed (2026-09-21)

## Context

People should be able to rearrange Bridger or add a feature friends can install, without weakening privacy. The API's data path is the service role. Any code we run next to that path can read every table that has RLS turned on, including the 22 tables with no policy.

Messages, the requested dogfood, have no table yet. The spec says bodies are ciphertext (`guide-docs/complete/MESSAGES.md`).

## Decision

v1 extensions are JSON manifests. They name catalog purposes, catalog entries, and core primitives. They do not include executable code. The Nest process does not load author code. The phone does not eval author code.

Server-side extension code is rejected. There is no feature that requires it that should not be core code in this repo.

A sandboxed JS or WASM island in the app is not part of v1. Revisit it only after a first-party messages manifest cannot express the messages spec even with a ciphertext primitive. That gap is a missing primitive, to fix in the catalog, not a reason to run user code.

Signing, review, install, and revoke: `guide-docs/platform/04-EXTENSION-MANIFEST-SPEC.md`.

## Consequences

- Custom UI is limited to compositions of primitives we already render. A fully custom messenger skin waits.
- The messages dogfood is a manifest plus new core tables, not a plugin runtime.
- A stolen signing key is handled by revoking the manifest version. There is no author process to kill on the server, because there is no author process.

## Alternatives rejected

- Sandbox first. More power, and the bridge becomes the entire fence before we have invariants in CI.
- Server plugins. They would sit beside `SupabaseService.admin`.
