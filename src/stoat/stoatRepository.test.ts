import assert from "node:assert/strict";
import test from "node:test";

import type { Client } from "stoat.js";
import {
  StoatRepository,
  type StoatRepositoryConfig,
} from "./stoatRepository.js";

type Listener = (...args: unknown[]) => void;

/** Minimal stand-in for the `stoat.js` Channel class. */
type FakeChannel = { id: string; name: string };

/** Minimal stand-in for the `stoat.js` Server class: just `channels`. */
type FakeServer = { channels: FakeChannel[] };

/**
 * Minimal stand-in for the `stoat.js` Client: just the event surface
 * (`once` / `off`), `loginBot`, and `servers.get` that `connect()` and
 * `listChannels()` touch. Cast to `Client` at the call site since it doesn't
 * implement the SDK's full surface.
 */
function fakeClient(
  onLoginBot?: (fake: FakeClient) => void | Promise<void>,
  servers: Record<string, FakeServer> = {},
) {
  const listeners = new Map<string, Set<Listener>>();
  const fake = {
    loginBotCalls: [] as string[],
    servers: {
      get: (id: string) => servers[id],
    },
    once(event: string, cb: Listener) {
      const wrapped: Listener = (...args) => {
        fake.off(event, wrapped);
        cb(...args);
      };
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(wrapped);
    },
    off(event: string, cb: Listener) {
      listeners.get(event)?.delete(cb);
    },
    emit(event: string, ...args: unknown[]) {
      for (const cb of [...(listeners.get(event) ?? [])]) cb(...args);
    },
    async loginBot(token: string) {
      fake.loginBotCalls.push(token);
      await onLoginBot?.(fake);
    },
  };
  return fake;
}

type FakeClient = ReturnType<typeof fakeClient>;

test("connect() logs the bot in and resolves with the ready client", async () => {
  const client = fakeClient((c) => queueMicrotask(() => c.emit("ready")));
  const repo = new StoatRepository({
    token: "bot-token",
    createClient: () => client as unknown as Client,
  });

  const connected = await repo.connect();

  assert.equal(connected, client);
  assert.deepEqual(client.loginBotCalls, ["bot-token"]);
});

test("connect() rejects when the client emits an error", async () => {
  const client = fakeClient((c) =>
    queueMicrotask(() => c.emit("error", { type: "InvalidSession" })),
  );
  const repo = new StoatRepository({
    token: "bot-token",
    createClient: () => client as unknown as Client,
  });

  await assert.rejects(repo.connect(), /InvalidSession/);
});

test("connect() rejects when the client never becomes ready", async () => {
  const repo = new StoatRepository({
    token: "bot-token",
    timeoutMs: 10,
    createClient: () => fakeClient() as unknown as Client, // loginBot resolves, but no "ready"
  });

  await assert.rejects(repo.connect(), /timed out after 10ms/);
});

test("connect() propagates a loginBot() failure", async () => {
  const boom = new Error("bad token");
  const repo = new StoatRepository({
    token: "bot-token",
    createClient: () =>
      fakeClient(() => {
        throw boom;
      }) as unknown as Client,
  });

  await assert.rejects(repo.connect(), boom);
});

test("listChannels() returns the server's channels", async () => {
  const channels: FakeChannel[] = [
    { id: "channel-1", name: "general" },
    { id: "channel-2", name: "random" },
  ];
  const client = fakeClient(
    (c) => queueMicrotask(() => c.emit("ready")),
    { "server-1": { channels } },
  );
  const repo = new StoatRepository({
    token: "bot-token",
    createClient: () => client as unknown as Client,
  });
  await repo.connect();

  const result = repo.listChannels("server-1");

  assert.deepEqual(result, channels);
});

test("listChannels() throws for an unknown server", async () => {
  const client = fakeClient((c) => queueMicrotask(() => c.emit("ready")));
  const repo = new StoatRepository({
    token: "bot-token",
    createClient: () => client as unknown as Client,
  });
  await repo.connect();

  assert.throws(() => repo.listChannels("unknown"), /unknown stoat server/);
});

test("listChannels() throws when not connected", () => {
  const repo = new StoatRepository({ token: "bot-token" });

  assert.throws(() => repo.listChannels("server-1"), /not connected/);
});

test("new StoatRepository() throws without a token", () => {
  assert.throws(
    () => new StoatRepository({} as StoatRepositoryConfig),
    /bot token/,
  );
});
