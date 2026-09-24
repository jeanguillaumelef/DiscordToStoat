import { Client, GatewayIntentBits } from "discord.js";

import type { Channel } from "../domain/channel.js";

/** Default time to wait for the `clientReady` event before giving up. */
const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Intents needed to see guilds/channels and read message content.
 * `MessageContent` is privileged and must also be enabled for the bot in the
 * Discord Developer Portal, or `login` will be rejected.
 */
const DEFAULT_INTENTS = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent,
];

export interface DiscordRepositoryConfig {
  /** Bot token used with `login`. */
  token: string;
  /**
   * How long `connect()` waits for the session to become ready before
   * rejecting. Defaults to 30000. Pass 0 (or a non-finite value) to disable
   * the timeout.
   */
  timeoutMs?: number;
  /**
   * Factory for the underlying SDK client. Injectable for tests; defaults to
   * `new Client({ intents: DEFAULT_INTENTS })`.
   */
  createClient?: () => Client;
}

/** Manages all interactions with a Discord server: connecting, etc. */
export class DiscordRepository {
  private readonly token: string;
  private readonly timeoutMs: number;
  private readonly makeClient: () => Client;
  private client: Client | undefined;

  constructor({ token, timeoutMs = DEFAULT_TIMEOUT_MS, createClient }: DiscordRepositoryConfig) {
    if (!token) throw new Error("discord repository requires a bot token");

    this.token = token;
    this.timeoutMs = timeoutMs;
    this.makeClient = createClient ?? (() => new Client({ intents: DEFAULT_INTENTS }));
  }

  /**
   * Connect to the Discord server: log the bot in and wait for the live
   * session to be ready.
   */
  async connect(): Promise<Client> {
    const client = this.makeClient();
    let failConnect: ((error: Error) => void) | undefined;
    let cleanup = () => {};

    // The only 'error' listener, permanent so an 'error' is never left without
    // one. While connecting it rejects; afterwards it just logs.
    client.on("error", (error) => {
      if (failConnect) {
        failConnect(
          error instanceof Error
            ? error
            : new Error(`discord connection failed: ${JSON.stringify(error)}`),
        );
      } else {
        console.error("discord client error:", error);
      }
    });

    const ready = new Promise<Client>((resolve, reject) => {
      const onReady = () => {
        cleanup();
        resolve(client);
      };
      const timer =
        Number.isFinite(this.timeoutMs) && this.timeoutMs > 0
          ? setTimeout(() => {
              cleanup();
              reject(
                new Error(`discord connection timed out after ${this.timeoutMs}ms`),
              );
            }, this.timeoutMs)
          : undefined;

      failConnect = (error) => {
        cleanup();
        reject(error);
      };
      cleanup = () => {
        clearTimeout(timer);
        client.off("clientReady", onReady);
        failConnect = undefined;
      };

      client.once("clientReady", onReady);
    });

    try {
      await client.login(this.token);
      this.client = await ready;
      return this.client;
    } catch (error) {
      cleanup();
      ready.catch(() => {}); // a later timeout/error must not go unhandled
      await client.destroy();
      throw error;
    }
  }

  /** List the channels on a guild the bot can see. */
  listChannels(guildId: string): Channel[] {
    if (!this.client) throw new Error("discord repository is not connected");

    const guild = this.client.guilds.cache.get(guildId);
    if (!guild) throw new Error(`unknown discord guild: ${guildId}`);

    return [...guild.channels.cache.values()].map((channel) => ({
      id: channel.id,
      name: channel.name,
    }));
  }
}
