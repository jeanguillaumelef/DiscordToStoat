# DiscordToStoat

This application has for goal to enable communities to move from Discord to [Stoat](https://stoat.chat) without losing their message or server's channel configuration.

## Requirements

- Node.js 20 or newer

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in the tokens:

   ```bash
   cp .env.example .env
   ```

   - `DISCORD_TOKEN` — Discord Developer Portal → Applications → (your app) → Bot → Token.
     The bot also needs the privileged **Message Content** intent enabled.
   - `STOAT_TOKEN` — Stoat User Settings → My Bots → (your bot) → Token.
   - `STOAT_BASE_URL` — optional, only needed to point at a non-default Stoat instance.

3. Run it:

   ```bash
   npm start
   ```

## Commands

```bash
npm run build   # compile src/**/*.ts and index.ts to dist/
npm start        # build, then run dist/index.js
npm test         # build, then run tests with node --test
```

## Status

Early stage: the bot connects to both Discord and Stoat, lists visible guilds/servers and
their channels, and can create channels and send messages on Stoat. Mirroring Discord
activity into Stoat is not implemented yet.

## Architecture

Hexagonal (ports and adapters):

```
index.ts        # composition root: wires config + adapters together
src/domain/      # business logic and port definitions, no external dependencies
src/discord/     # Discord adapter (discord.js)
src/stoat/       # Stoat adapter (stoat.js)
```

