using Domain;

namespace Start
{
    public class DiscordExplorerUI(IDiscordRepository repo)
    {
        public async Task RunAsync()
        {
            var channel = SelectChannel();
            var message = await SelectMessage(channel);
            DisplayMessage(message);
        }

        public Channel SelectChannel()
        {
            var channels = repo.GetTextChannels().ToList();
            Console.WriteLine("Available channels:");
            for (int i = 0; i < channels.Count; i++)
                DisplayChannel(channels[i], i);

            Console.Write("Select a channel: ");
            return channels[int.Parse(Console.ReadLine()!) - 1];
        }

        static void DisplayChannel(Channel channel, int index) =>
            Console.WriteLine($"  {index + 1}. {channel.Name}");

        async Task<Message> SelectMessage(Channel channel)
        {
            var messages = (await repo.GetMessagesAsync(channel.Id)).ToList();
            Console.WriteLine("\nAvailable messages:");
            for (int i = 0; i < messages.Count; i++)
                DisplayMessagePreview(messages[i], i);

            Console.Write("Select a message: ");
            return messages[int.Parse(Console.ReadLine()!) - 1];
        }

        static void DisplayMessagePreview(Message message, int index)
        {
            var preview = message.Content.Length > 60
                ? message.Content[..60] + "..."
                : message.Content;
            Console.WriteLine($"  {index + 1}. [{message.Author}]: {preview}");
        }

        static void DisplayMessage(Message message)
        {
            Console.WriteLine($"\n[{message.Author}] {message.Timestamp:g}");
            Console.WriteLine(message.Content);

            foreach (var attachment in message.Attachments)
                Console.WriteLine($"  Attachment: {attachment.Filename} ({attachment.Url})");
        }
    }
}
