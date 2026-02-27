using Discord;
using DiscordReader;

var repo = ServiceConfiguration.DiscordRepository;
await repo.ConnectAsync();

var channel = SelectChannel();
var message = await SelectMessage(channel);
DisplayMessage(message);

IMessageChannel SelectChannel()
{
    var channels = repo.GetTextChannels().ToList();
    Console.WriteLine("Available channels:");
    for (int i = 0; i < channels.Count; i++)
    {
        var name = channels[i] is IGuildChannel gc ? gc.Name : channels[i].Id.ToString();
        Console.WriteLine($"  {i + 1}. {name}");
    }
    Console.Write("Select a channel: ");
    return channels[int.Parse(Console.ReadLine()!) - 1];
}

async Task<IMessage> SelectMessage(IMessageChannel channel)
{
    var messages = (await repo.GetMessagesAsync(channel.Id)).ToList();
    Console.WriteLine("\nAvailable messages:");
    for (int i = 0; i < messages.Count; i++)
    {
        var preview = messages[i].Content.Length > 60
            ? messages[i].Content[..60] + "..."
            : messages[i].Content;
        Console.WriteLine($"  {i + 1}. [{messages[i].Author}]: {preview}");
    }
    Console.Write("Select a message: ");
    return messages[int.Parse(Console.ReadLine()!) - 1];
}

void DisplayMessage(IMessage message)
{
    Console.WriteLine($"\n[{message.Author}] {message.Timestamp:g}");
    Console.WriteLine(message.Content);

    foreach (var attachment in message.Attachments)
        Console.WriteLine($"  Attachment: {attachment.Filename} ({attachment.Url})");
}
