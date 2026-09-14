# ops/queue

One file per unit of work. Copy `_TEMPLATE.md`, or run `pnpm ops new "Title" --owner cursor --risk low --area mobile`.

- `pnpm ops list` prints every open item grouped by owner.
- `pnpm ops claim 014 cursor` sets owner and status in one go.
- `pnpm ops done 014 --pr https://github.com/brantsjohnson/Bridger-App/pull/99` closes it.

Ids are three digits and never reused. The next id is one more than the highest file in this folder.
