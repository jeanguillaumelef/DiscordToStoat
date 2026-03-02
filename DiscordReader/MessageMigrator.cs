using Discord;

namespace DiscordReader
{
    public class DiscordExplorerUI(IDiscordRepository repo)
    {
        public async Task RunAsync()
        {
            var channel = SelectChannel();
            var message = await SelectMessage(channel);
            DisplayMessage(message);
        }

        IMessageChannel SelectChannel()
        {
            var channels = repo.GetTextChannels().ToList();
            Console.WriteLine("Available channels:");
            for (int i = 0; i < channels.Count; i++)
            {
                DisplayChannel(channels[i], i);
            }
                
            Console.Write("Select a channel: ");
            return channels[int.Parse(Console.ReadLine()!) - 1];
        }

        void DisplayChannel(IMessageChannel channel, int index)
        {
            var name = channel is IGuildChannel gc ? gc.Name : channel.Id.ToString();
            Console.WriteLine($"  {index + 1}. {name}");
        }

        async Task<IMessage> SelectMessage(IMessageChannel channel)
        {
            var messages = (await repo.GetMessagesAsync(channel.Id)).ToList();
            Console.WriteLine("\nAvailable messages:");
            for (int i = 0; i < messages.Count; i++)
            {
                DisplayMessagePreview(messages[i], i);
            }
                
            Console.Write("Select a message: ");
            return messages[int.Parse(Console.ReadLine()!) - 1];
        }

        static void DisplayMessagePreview(IMessage message, int index)
        {
            var preview = message.Content.Length > 60
                ? message.Content[..60] + "..."
                : message.Content;
            Console.WriteLine($"  {index + 1}. [{message.Author}]: {preview}");
        }

        static void DisplayMessage(IMessage message)
        {
            Console.WriteLine($"\n[{message.Author}] {message.Timestamp:g}");
            Console.WriteLine(message.Content);

            foreach (var attachment in message.Attachments)
                Console.WriteLine($"  Attachment: {attachment.Filename} ({attachment.Url})");
        }
    }
}
