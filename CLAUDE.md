# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this project is

DiscordToStoat bridges Discord to [Stoat](https://stoat.chat) (the chat platform formerly known
as Revolt). The long-term goal is to mirror/forward Discord activity into a Stoat server.


## Stack

- Node.js >= 20, TypeScript (strict mode), **ESM only** (`"type": "module"` in `package.json`).
- Source lives as `.ts`; `tsc` compiles it to `dist/` before it runs. `dist/` is generated and
  gitignored — never hand-edit or commit it.

## Commands

```bash
npm run build   # tsc — compiles src/**/*.ts and index.ts to dist/
npm start       # npm run build && node --env-file=.env dist/index.js
npm test        # npm run build && node --test "dist/**/*.test.js"
```

Those are the only scripts. Do not document or reference scripts that don't exist in
`package.json`.

## Layout

Hexagonal architecture (ports and adapters). "Repository" in this project means an external
system (Discord, Stoat), not a DDD persistence repository.

```
index.ts                 # composition root: reads process.env, builds adapters, wires them into the domain
src/domain/              # business logic + port definitions (TypeScript interfaces/types)
src/<repositoryName>/    # one adapter folder per external system: src/discord/, src/stoat/
```

- Put tests next to the module they test: `foo.ts` → `foo.test.ts`. Never create a `test/`
  directory.
- Create a folder only when its first real module is written.

When editing `src/domain/`:
- Keep it pure: no network, filesystem, `process.env`, or third-party packages.
- Define ports as TypeScript interfaces/types. Adapters implement them.
- Receive adapters as function arguments. Never import an adapter.
- Test with in-memory fakes of the ports, never real adapters.

When editing `src/<repositoryName>/`:
- Import from `src/domain/`, `node:` builtins, and that system's own SDK. Never import another adapter.
- Receive config (tokens, URLs) as constructor arguments. Never read `process.env` here.


## Conventions

- Always include the `.js` extension in relative imports, even inside `.ts` files
  (`./src/foo.js`, not `./src/foo.ts`) — required by ESM/`NodeNext` module resolution, since the
  import is resolved against the compiled output in `dist/`, not the `.ts` source.
- Use `node:`-prefixed builtins (`node:fs`, `node:test`).
- Use named exports. Never use default exports.
- Use async/await, not raw promise chains. Never leave a promise unhandled.
- Avoid `any`; prefer `unknown` with narrowing when a type genuinely isn't known.
- Secrets (Discord/Stoat tokens) go in `.env`, which is gitignored. Never commit tokens. Add
  new variables to `.env.example` when they are introduced.
- Prefer builtins first. When a package is needed, use `npm install <pkg>` (or `--save-dev`) so
  the lockfile is updated, and say why it was chosen in the commit message.

## Tooling

- Tests: Node's built-in runner (`node --test`) with `node:assert/strict`, run against the
  compiled `dist/` output via `npm test`. Never add Jest, Vitest, or another test framework.
- Type-check as part of the build (`tsc` fails the build on type errors); there is no separate
  typecheck script.
- Lint/format: ESLint (flat config) + Prettier. Run them only through scripts that exist in `package.json`.

## Working with the owner

Do only what is asked. Do not add tooling, restructure files, or install dependencies as a
side effect of another task — propose it instead.
