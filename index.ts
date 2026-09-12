import { DiscordRepository } from "./src/discord/discordRepository.js";
import { StoatRepository } from "./src/stoat/stoatRepository.js";

const discordToken = process.env.DISCORD_TOKEN;
if (!discordToken) {
  console.error(
    "DISCORD_TOKEN is not set. Copy .env.example to .env and fill it in.",
  );
  process.exit(1);
}

const token = process.env.STOAT_TOKEN;
if (!token) {
  console.error(
    "STOAT_TOKEN is not set. Copy .env.example to .env and fill it in.",
  );
  process.exit(1);
}

const discord = new DiscordRepository({ token: discordToken });

const discordClient = await discord.connect();
console.log(`Connected to Discord as ${discordClient.user?.tag ?? "unknown user"}.`);

const guilds = [...discordClient.guilds.cache.values()];
if (guilds.length === 0) {
  console.log("The bot is not in any guilds yet. Invite it to one and retry.");
} else {
  console.log(`Visible guilds (${guilds.length}):`);
  for (const guild of guilds) {
    console.log(`  - ${guild.name} (${guild.id})`);
    const channels = discord.listChannels(guild.id);
    for (const channel of channels.slice(0, 5)) {
      console.log(`      # ${channel.name} (${channel.id})`);
    }
  }
}

const stoat = new StoatRepository({
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
    const channels = stoat.listChannels(server.id);
    for (const channel of channels) {
      console.log(`      # ${channel.name} (${channel.id})`);
    }

    const testChannel = channels.find((channel) => channel.name === "TestChannel");
    if (testChannel) {
      await stoat.sendMessage(testChannel.id, "test", {
        displayName: "Prontonpon",
      });
      console.log(`Sent a test message to #${testChannel.name}.`);
    }
  }
}

client.events.disconnect();
process.exit(0);
