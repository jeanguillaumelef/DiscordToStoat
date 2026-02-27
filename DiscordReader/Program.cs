using DiscordReader;

var repo = ServiceConfiguration.DiscordRepository;

await repo.ConnectAsync();

Console.Write("Channel ID: ");
var channelId = ulong.Parse(Console.ReadLine()!);

Console.Write("Message ID: ");
var messageId = ulong.Parse(Console.ReadLine()!);

var message = await repo.TryGetMessageAsync(channelId, messageId);
Console.WriteLine(message is null ? "Message not found." : $"[{message.Author}]: {message.Content}");
