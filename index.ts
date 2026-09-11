import { createStoatRepository } from "./src/stoat/stoatRepository.js";

const token = process.env.STOAT_TOKEN;
if (!token) {
  console.error(
    "STOAT_TOKEN is not set. Copy .env.example to .env and fill it in.",
  );
  process.exit(1);
}

const stoat = createStoatRepository({
  token,
  baseURL: process.env.STOAT_BASE_URL,
});

const client = await stoat.connect();
console.log(`Connected to Stoat as ${client.user?.username ?? "unknown user"}.`);

const servers = client.servers.toList();
if (servers.length === 0) {
  console.log("The bot is not in any servers yet. Invite it to one and retry.");
} else {
  console.log(`Visible servers (${servers.length}):`);
  for (const server of servers) {
    console.log(`  - ${server.name} (${server.id})`);
  }
}

client.events.disconnect();
process.exit(0);
