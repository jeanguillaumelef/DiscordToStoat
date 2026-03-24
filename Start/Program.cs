using DiscordReader;
using Domain;
using Start;
using StoatWriter;

var discordRepo = ServiceConfiguration.DiscordRepository;
await discordRepo.ConnectAsync();

var stoatToken = ServiceConfiguration.Configuration["Stoat:Token"]
    ?? throw new InvalidOperationException("Stoat:Token is not configured.");
var stoatRepo = new StoatRepository(stoatToken);

var discordChannel = new DiscordExplorerUI(discordRepo).SelectChannel();

Console.Write("\nStoat server ID: ");
var serverId = Console.ReadLine()!;
Console.WriteLine("\nStarting migration...");
var logger = new FileMigrationLogger("migration-failures.log");
var messageMigrator = new MessageMigrator(discordRepo, stoatRepo, logger);

await messageMigrator.MigrateChannelAsync(discordChannel.Id, serverId);

Console.WriteLine("Migration complete.");
