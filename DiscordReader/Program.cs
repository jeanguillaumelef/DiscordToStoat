using DiscordReader;

var repo = ServiceConfiguration.DiscordRepository;

var token = Environment.GetEnvironmentVariable("DISCORD_TOKEN")
    ?? throw new InvalidOperationException("DISCORD_TOKEN environment variable is not set.");

await repo.ConnectAsync(token);

Console.Write("Channel ID: ");
var channelId = ulong.Parse(Console.ReadLine()!);

Console.Write("Message ID: ");
var messageId = ulong.Parse(Console.ReadLine()!);

var message = await repo.TryGetMessageAsync(channelId, messageId);
Console.WriteLine(message is null ? "Message not found." : $"[{message.Author}]: {message.Content}");
