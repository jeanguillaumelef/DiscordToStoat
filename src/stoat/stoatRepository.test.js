import assert from "node:assert/strict";
import test from "node:test";

import { createStoatRepository } from "./stoatRepository.js";

/**
 * Minimal stand-in for the `stoat.js` Client: just the event surface
 * (`once` / `off`) and `loginBot` that `connect()` touches.
 * @param {(fake: any) => void} [onLoginBot] side effect to run when
 *   `loginBot` is called (e.g. emit `ready` or `error`).
 */
function fakeClient(onLoginBot) {
  /** @type {Map<string, Set<Function>>} */
  const listeners = new Map();
  const fake = {
    loginBotCalls: /** @type {string[]} */ ([]),
    once(event, cb) {
      const wrapped = (...args) => {
        fake.off(event, wrapped);
        cb(...args);
      };
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(wrapped);
    },
    off(event, cb) {
      listeners.get(event)?.delete(cb);
    },
    emit(event, ...args) {
      for (const cb of [...(listeners.get(event) ?? [])]) cb(...args);
    },
    async loginBot(token) {
      fake.loginBotCalls.push(token);
      await onLoginBot?.(fake);
    },
  };
  return fake;
}

test("connect() logs the bot in and resolves with the ready client", async () => {
  const client = fakeClient((c) => queueMicrotask(() => c.emit("ready")));
  const repo = createStoatRepository({
    token: "bot-token",
    createClient: () => client,
  });

  const connected = await repo.connect();

  assert.equal(connected, client);
  assert.deepEqual(client.loginBotCalls, ["bot-token"]);
});

test("connect() rejects when the client emits an error", async () => {
  const client = fakeClient((c) =>
    queueMicrotask(() => c.emit("error", { type: "InvalidSession" })),
  );
  const repo = createStoatRepository({
    token: "bot-token",
    createClient: () => client,
  });

  await assert.rejects(repo.connect(), /InvalidSession/);
});

test("connect() rejects when the client never becomes ready", async () => {
  const repo = createStoatRepository({
    token: "bot-token",
    timeoutMs: 10,
    createClient: () => fakeClient(), // loginBot resolves, but no "ready"
  });

  await assert.rejects(repo.connect(), /timed out after 10ms/);
});

test("connect() propagates a loginBot() failure", async () => {
  const boom = new Error("bad token");
  const repo = createStoatRepository({
    token: "bot-token",
    createClient: () =>
      fakeClient(() => {
        throw boom;
      }),
  });

  await assert.rejects(repo.connect(), boom);
});

test("createStoatRepository() throws without a token", () => {
  assert.throws(() => createStoatRepository({}), /bot token/);
});
