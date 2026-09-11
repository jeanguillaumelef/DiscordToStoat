import { Channel, Client } from "stoat.js";

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
    let cleanup = () => {};

    const ready = new Promise<Client>((resolve, reject) => {
      const onReady = () => {
        cleanup();
        resolve(client);
      };
      const onError = (error: unknown) => {
        cleanup();
        reject(
          error instanceof Error
            ? error
            : new Error(`stoat connection failed: ${JSON.stringify(error)}`),
        );
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

      cleanup = () => {
        clearTimeout(timer);
        client.off("ready", onReady);
        client.off("error", onError);
      };

      client.once("ready", onReady);
      client.once("error", onError);
    });

    try {
      await client.loginBot(this.token);
      this.client = await ready;
      return this.client;
    } catch (error) {
      cleanup();
      ready.catch(() => {}); // a later timeout/error must not go unhandled
      throw error;
    }
  }

  /** List the channels on a server the bot can see. */
  listChannels(serverId: string): Channel[] {
    if (!this.client) throw new Error("stoat repository is not connected");

    const server = this.client.servers.get(serverId);
    if (!server) throw new Error(`unknown stoat server: ${serverId}`);

    return server.channels;
  }
}
