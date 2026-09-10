# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this project is

DiscordToStoat bridges Discord to [Stoat](https://stoat.chat) (the chat platform formerly known
as Revolt). The long-term goal is to mirror/forward Discord activity into a Stoat server.


## Stack

- Node.js >= 20, plain JavaScript, **ESM only** (`"type": "module"` in `package.json`).
- Do not add TypeScript or a build step. Use JSDoc for types where they help.

## Commands

```bash
npm start   # node --env-file=.env index.js
```

That is the only script. Do not document or reference scripts that don't exist in `package.json`.

## Layout

Hexagonal architecture (ports and adapters). "Repository" in this project means an external
system (Discord, Stoat), not a DDD persistence repository.

```
index.js                 # composition root: reads process.env, builds adapters, wires them into the domain
src/domain/              # business logic + port definitions (JSDoc @typedef)
src/<repositoryName>/    # one adapter folder per external system: src/discord/, src/stoat/
```

- Put tests next to the module they test: `foo.js` → `foo.test.js`. Never create a `test/` directory.
- Create a folder only when its first real module is written.

When editing `src/domain/`:
- Keep it pure: no network, filesystem, `process.env`, or third-party packages.
- Define ports as JSDoc `@typedef`s. Adapters implement them.
- Receive adapters as function arguments. Never import an adapter.
- Test with in-memory fakes of the ports, never real adapters.

When editing `src/<repositoryName>/`:
- Import from `src/domain/`, `node:` builtins, and that system's own SDK. Never import another adapter.
- Receive config (tokens, URLs) as constructor arguments. Never read `process.env` here.


## Conventions

- Always include the `.js` extension in relative imports (`./src/foo.js`) — required by ESM.
- Use `node:`-prefixed builtins (`node:fs`, `node:test`).
- Use named exports. Never use default exports.
- Use async/await, not raw promise chains. Never leave a promise unhandled.
- Secrets (Discord/Stoat tokens) go in `.env`, which is gitignored. Never commit tokens. Add
  new variables to `.env.example` when they are introduced.
- Prefer builtins first. When a package is needed, use `npm install <pkg>` (or `--save-dev`) so
  the lockfile is updated, and say why it was chosen in the commit message.

## Tooling

- Tests: Node's built-in runner (`node --test`) with `node:assert/strict`. Never add Jest,
  Vitest, or another test framework.
- Lint/format: ESLint (flat config) + Prettier. Run them only through scripts that exist in `package.json`.

## Working with the owner

Do only what is asked. Do not add tooling, restructure files, or install dependencies as a
side effect of another task — propose it instead.
