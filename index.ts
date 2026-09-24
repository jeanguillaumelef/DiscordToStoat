import { ChannelMigrator } from "./src/domain/channelMigrator.js";
import { StoatRepository } from "./src/stoat/stoatRepository.js";

const token = process.env.STOAT_TOKEN;
if (!token) {
  console.error(
    "STOAT_TOKEN is not set. Copy .env.example to .env and fill it in.",
  );
  process.exit(1);
}

const stoat = new StoatRepository({
  token,
  baseURL: process.env.STOAT_BASE_URL,
});

const client = await stoat.connect();
console.log(`Connected to Stoat as ${client.user?.username ?? "unknown user"}.`);

const server = client.servers.toList()[0];
if (!server) {
  console.log("The bot is not in any servers yet. Invite it to one and retry.");
} else {
  const channel = { id: "test", name: "TestChannel" };
  const migrator = new ChannelMigrator(stoat, server.id);
  const result = await migrator.migrateMessage(channel, {
    content: "test",
    author: { displayName: "Prontonpon" },
  });
  if (result.ok) {
    console.log(`Sent a test message to #${channel.name}.`);
  } else {
    console.error(
      `Failed to send a test message to #${channel.name}: ${result.error}.`,
    );
  }
}

client.events.disconnect();
process.exit(0);
