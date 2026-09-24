import assert from "node:assert/strict";
import test from "node:test";

import { ChannelMigrator, type StoatRepositoryPort } from "./channelMigrator.js";
import type { Channel } from "./channel.js";
import type { Message } from "./message.js";
import type { User } from "./user.js";

type SendMessageCall = {
  serverId: string;
  channelName: string;
  content: string;
  user?: User;
};

/** In-memory fake of the Stoat port that records every `sendMessage` call. */
function fakeStoat(sendError?: Error) {
  const sendMessageCalls: SendMessageCall[] = [];
  const stoat: StoatRepositoryPort = {
    listChannels: () => [],
    createChannel: async (_serverId, name) => ({ id: `${name}-id`, name }),
    async sendMessage(serverId, channelName, content, user) {
      sendMessageCalls.push({ serverId, channelName, content, user });
      if (sendError) throw sendError;
      return undefined;
    },
  };
  return { stoat, sendMessageCalls };
}

const channel: Channel = { id: "discord-1", name: "general" };
const message: Message = {
  content: "hello",
  author: { displayName: "Alice", avatarUrl: "https://example.com/a.png" },
};

test("migrateMessage sends the message to the named channel as its author", async () => {
  const { stoat, sendMessageCalls } = fakeStoat();

  await new ChannelMigrator(stoat, "server-1").migrateMessage(channel, message);

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

test("migrateMessage propagates a sendMessage failure", async () => {
  const { stoat } = fakeStoat(new Error("boom"));

  await assert.rejects(
    new ChannelMigrator(stoat, "server-1").migrateMessage(channel, message),
    /boom/,
  );
});
