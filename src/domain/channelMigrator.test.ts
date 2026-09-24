import assert from "node:assert/strict";
import test from "node:test";

import { ChannelMigrator } from "./channelMigrator.js";
import { SendMessageError, type StoatRepositoryPort } from "./stoatRepositoryPort.js";
import type { Channel } from "./channel.js";
import type { Message } from "./message.js";
import type { User } from "./user.js";

type SendMessageCall = {
  serverId: string;
  channelName: string;
  content: string;
  user?: User;
};

/**
 * In-memory fake of the Stoat port. It records every `sendMessage` and
 * `createChannel` call; `sendMessage` reports `channel_not_found` until the
 * channel has been created (or was in `existingChannels` to begin with).
 * `createChannel` rejects a duplicate name, like the real server would.
 * `createError` makes `createChannel` reject; `createHasNoEffect` makes it
 * succeed without the channel becoming visible to `sendMessage`.
 */
function fakeStoat(
  existingChannels: string[] = ["general"],
  sendError?: Error,
  { createError, createHasNoEffect }: { createError?: Error; createHasNoEffect?: boolean } = {},
) {
  const channels = new Set(existingChannels);
  const sendMessageCalls: SendMessageCall[] = [];
  const createChannelCalls: { serverId: string; name: string }[] = [];
  const stoat: StoatRepositoryPort = {
    listChannels: () => [],
    async createChannel(serverId, name) {
      createChannelCalls.push({ serverId, name });
      if (createError) throw createError;
      if (channels.has(name)) throw new Error(`channel "${name}" already exists`);
      if (!createHasNoEffect) channels.add(name);
      return { id: `${name}-id`, name };
    },
    async sendMessage(serverId, channelName, content, user) {
      sendMessageCalls.push({ serverId, channelName, content, user });
      if (sendError) throw sendError;
      if (!channels.has(channelName)) return { ok: false, error: SendMessageError.ChannelNotFound };
      return { ok: true, value: undefined };
    },
  };
  return { stoat, sendMessageCalls, createChannelCalls };
}

const channel: Channel = { id: "discord-1", name: "general" };
const message: Message = {
  content: "hello",
  author: { displayName: "Alice", avatarUrl: "https://example.com/a.png" },
};

test("migrateMessage sends the message to the named channel as its author", async () => {
  const { stoat, sendMessageCalls } = fakeStoat();

  const result = await new ChannelMigrator(stoat, "server-1").migrateMessage(channel, message);

  assert.deepEqual(result, { ok: true, value: undefined });
  assert.deepEqual(sendMessageCalls, [
    {
      serverId: "server-1",
      channelName: "general",
      content: "hello",
      user: message.author,
    },
  ]);
});

test("migrateMessage uses the server id given at construction", async () => {
  const { stoat, sendMessageCalls } = fakeStoat();

  await new ChannelMigrator(stoat, "server-1").migrateMessage(channel, message);
  await new ChannelMigrator(stoat, "server-2").migrateMessage(channel, message);

  assert.deepEqual(
    sendMessageCalls.map((call) => call.serverId),
    ["server-1", "server-2"],
  );
});

test("migrateMessage does not create the channel when it already exists", async () => {
  const { stoat, createChannelCalls } = fakeStoat();

  await new ChannelMigrator(stoat, "server-1").migrateMessage(channel, message);

  assert.deepEqual(createChannelCalls, []);
});

test("migrateMessage creates the channel and resends when it does not exist", async () => {
  const { stoat, sendMessageCalls, createChannelCalls } = fakeStoat([]);

  const result = await new ChannelMigrator(stoat, "server-1").migrateMessage(channel, message);

  assert.deepEqual(result, { ok: true, value: undefined });
  assert.deepEqual(createChannelCalls, [{ serverId: "server-1", name: "general" }]);
  assert.equal(sendMessageCalls.length, 2);
});

test("migrateMessage propagates a createChannel failure without resending", async () => {
  const { stoat, sendMessageCalls } = fakeStoat([], undefined, {
    createError: new Error("create failed"),
  });

  await assert.rejects(
    new ChannelMigrator(stoat, "server-1").migrateMessage(channel, message),
    /create failed/,
  );
  assert.equal(sendMessageCalls.length, 1);
});

test("migrateMessage returns the error when the resend still reports channel_not_found", async () => {
  const { stoat, sendMessageCalls, createChannelCalls } = fakeStoat([], undefined, {
    createHasNoEffect: true,
  });

  const result = await new ChannelMigrator(stoat, "server-1").migrateMessage(channel, message);

  assert.deepEqual(result, { ok: false, error: SendMessageError.ChannelNotFound });
  assert.equal(createChannelCalls.length, 1);
  assert.equal(sendMessageCalls.length, 2);
});

test("migrateMessage propagates a sendMessage failure", async () => {
  const { stoat } = fakeStoat(["general"], new Error("boom"));

  await assert.rejects(
    new ChannelMigrator(stoat, "server-1").migrateMessage(channel, message),
    /boom/,
  );
});
