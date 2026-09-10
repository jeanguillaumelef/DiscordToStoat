import { Client } from "stoat.js";

/** Default time to wait for the `ready` event before giving up. */
const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * @typedef {object} StoatRepositoryConfig
 * @property {string} token Bot token used with `loginBot`.
 * @property {string} [baseURL] Stoat API base URL. Defaults to the SDK default
 *   (`https://stoat.chat/api`).
 * @property {number} [timeoutMs] How long `connect()` waits for the session to
 *   become ready before rejecting. Defaults to 30000. Pass 0 (or a non-finite
 *   value) to disable the timeout.
 * @property {() => import("stoat.js").Client} [createClient] Factory for the
 *   underlying SDK client. Injectable for tests; defaults to
 *   `new Client({ baseURL })`.
 */

/**
 * Build the Stoat adapter.
 * @param {StoatRepositoryConfig} config
 */
export function createStoatRepository({
  token,
  baseURL,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  createClient,
} = {}) {
  if (!token) throw new Error("stoat repository requires a bot token");

  const makeClient =
    createClient ?? (() => new Client(baseURL ? { baseURL } : undefined));

  return {
    /**
     * Connect to the Stoat server: log the bot in and wait for the live session
     * to be ready.
     * @returns {Promise<import("stoat.js").Client>} the ready client
     */
    async connect() {
      const client = makeClient();
      let cleanup = () => {};

      const ready = new Promise((resolve, reject) => {
        const onReady = () => {
          cleanup();
          resolve(client);
        };
        const onError = (error) => {
          cleanup();
          reject(
            error instanceof Error
              ? error
              : new Error(`stoat connection failed: ${JSON.stringify(error)}`),
          );
        };
        const timer =
          Number.isFinite(timeoutMs) && timeoutMs > 0
            ? setTimeout(() => {
                cleanup();
                reject(
                  new Error(`stoat connection timed out after ${timeoutMs}ms`),
                );
              }, timeoutMs)
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
        await client.loginBot(token);
        return await ready;
      } catch (error) {
        cleanup();
        ready.catch(() => {}); // a later timeout/error must not go unhandled
        throw error;
      }
    },
  };
}
