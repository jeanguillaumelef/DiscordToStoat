import assert from "node:assert/strict";
import test from "node:test";

import type { Client } from "discord.js";
import {
  DiscordRepository,
  type DiscordRepositoryConfig,
} from "./discordRepository.js";

type Listener = (...args: unknown[]) => void;

/**
 * Minimal stand-in for the `discord.js` Client: just the event surface
 * (`once` / `off`) and `login` that `connect()` touches. Cast to `Client` at
 * the call site since it doesn't implement the SDK's full surface.
 */
function fakeClient(onLogin?: (fake: FakeClient) => void | Promise<void>) {
  const listeners = new Map<string, Set<Listener>>();
  const fake = {
    loginCalls: [] as string[],
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
    async login(token: string) {
      fake.loginCalls.push(token);
      await onLogin?.(fake);
      return token;
    },
  };
  return fake;
}

type FakeClient = ReturnType<typeof fakeClient>;

test("connect() logs the bot in and resolves with the ready client", async () => {
  const client = fakeClient((c) => queueMicrotask(() => c.emit("ready")));
  const repo = new DiscordRepository({
    token: "bot-token",
    createClient: () => client as unknown as Client,
  });

  const connected = await repo.connect();

  assert.equal(connected, client);
  assert.deepEqual(client.loginCalls, ["bot-token"]);
});

test("connect() rejects when the client emits an error", async () => {
  const client = fakeClient((c) =>
    queueMicrotask(() => c.emit("error", new Error("InvalidToken"))),
  );
  const repo = new DiscordRepository({
    token: "bot-token",
    createClient: () => client as unknown as Client,
  });

  await assert.rejects(repo.connect(), /InvalidToken/);
});

test("connect() rejects when the client never becomes ready", async () => {
  const repo = new DiscordRepository({
    token: "bot-token",
    timeoutMs: 10,
    createClient: () => fakeClient() as unknown as Client, // login resolves, but no "ready"
  });

  await assert.rejects(repo.connect(), /timed out after 10ms/);
});

test("connect() propagates a login() failure", async () => {
  const boom = new Error("bad token");
  const repo = new DiscordRepository({
    token: "bot-token",
    createClient: () =>
      fakeClient(() => {
        throw boom;
      }) as unknown as Client,
  });

  await assert.rejects(repo.connect(), boom);
});

test("new DiscordRepository() throws without a token", () => {
  assert.throws(
    () => new DiscordRepository({} as DiscordRepositoryConfig),
    /bot token/,
  );
});
