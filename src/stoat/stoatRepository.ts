import { Client, Message } from "stoat.js";

import type { Channel } from "../domain/channel.js";
import type { User } from "../domain/user.js";

/** Default time to wait for the `ready` event before giving up. */
const DEFAULT_TIMEOUT_MS = 30_000;

export interface StoatRepositoryConfig {
  /** Bot token used with `loginBot`. */
  token: string;
  /** Stoat API base URL. Defaults to the SDK default (`https://stoat.chat/api`). */
  baseURL?: string;
  /**
   * How long `connect()` waits for the session to become ready before
   * rejecting. Defaults to 30000. Pass 0 (or a non-finite value) to disable
   * the timeout.
   */
  timeoutMs?: number;
  /**
   * Factory for the underlying SDK client. Injectable for tests; defaults to
   * `new Client({ baseURL })`.
   */
  createClient?: () => Client;
}

/** Manages all interactions with a Stoat server: connecting, sending, etc. */
export class StoatRepository {
  private readonly token: string;
  private readonly timeoutMs: number;
  private readonly makeClient: () => Client;
  private client: Client | undefined;

  constructor({ token, baseURL, timeoutMs = DEFAULT_TIMEOUT_MS, createClient }: StoatRepositoryConfig) {
    if (!token) throw new Error("stoat repository requires a bot token");

    this.token = token;
    this.timeoutMs = timeoutMs;
    this.makeClient = createClient ?? (() => new Client(baseURL ? { baseURL } : undefined));
  }

  /**
   * Connect to the Stoat server: log the bot in and wait for the live
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
            : new Error(`stoat connection failed: ${JSON.stringify(error)}`),
        );
      } else {
        console.error("stoat client error:", error);
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
                new Error(`stoat connection timed out after ${this.timeoutMs}ms`),
              );
            }, this.timeoutMs)
          : undefined;

      failConnect = (error) => {
        cleanup();
        reject(error);
      };
      cleanup = () => {
        clearTimeout(timer);
        client.off("ready", onReady);
        failConnect = undefined;
      };

      client.once("ready", onReady);
    });

    try {
      await client.loginBot(this.token);
      this.client = await ready;
      return this.client;
    } catch (error) {
      cleanup();
      ready.catch(() => {}); // a later timeout/error must not go unhandled
      client.events.disconnect();
      throw error;
    }
  }

  /** List the channels on a server the bot can see. */
  listChannels(serverId: string): Channel[] {
    if (!this.client) throw new Error("stoat repository is not connected");

    const server = this.client.servers.get(serverId);
    if (!server) throw new Error(`unknown stoat server: ${serverId}`);

    return server.channels.map((channel) => ({
      id: channel.id,
      name: channel.name,
    }));
  }

  /**
   * Create a new text channel on a server. Throws if a channel with that
   * name already exists there (channel names aren't unique to the Stoat
   * API, so this repository enforces it instead).
   */
  async createChannel(serverId: string, name: string): Promise<Channel> {
    if (!this.client) throw new Error("stoat repository is not connected");

    const server = this.client.servers.get(serverId);
    if (!server) throw new Error(`unknown stoat server: ${serverId}`);

    if (server.channels.some((channel) => channel.name === name)) {
      throw new Error(`stoat channel already exists: ${name}`);
    }

    const channel = await server.createChannel({ name });
    return { id: channel.id, name: channel.name };
  }

  /**
   * Send a message to the channel with the given name on a server,
   * optionally masquerading as the given user (e.g. the Discord user being
   * bridged) via their display name and avatar.
   */
  async sendMessage(
    serverId: string,
    channelName: string,
    content: string,
    user?: User,
  ): Promise<Message> {
    if (!this.client) throw new Error("stoat repository is not connected");

    const server = this.client.servers.get(serverId);
    if (!server) throw new Error(`unknown stoat server: ${serverId}`);

    const channel = server.channels.find((c) => c.name === channelName);
    if (!channel) throw new Error(`unknown stoat channel: ${channelName}`);

    return channel.sendMessage({
      content,
      masquerade: user && { name: user.displayName, avatar: user.avatarUrl },
    });
  }
}
