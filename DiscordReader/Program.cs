using DiscordReader;

var repo = ServiceConfiguration.DiscordRepository;
await repo.ConnectAsync();

await new DiscordExplorerUI(repo).RunAsync();
