using Discord;
using Discord.WebSocket;
using Microsoft.Extensions.Configuration;
using DomainAttachment = Domain.Attachment;
using DomainChannel = Domain.Channel;
using DomainMessage = Domain.Message;

namespace DiscordReader
{
    public class DiscordRepository(DiscordSocketClient client, IConfiguration config) : Domain.IDiscordRepository
    {
        public async Task ConnectAsync()
        {
            var token = config["Discord:Token"]
                ?? throw new InvalidOperationException("Discord:Token is not configured.");

            var ready = new TaskCompletionSource();
            client.Ready += () => { ready.SetResult(); return Task.CompletedTask; };
            client.Log += msg => { Console.WriteLine(msg.ToString()); return Task.CompletedTask; };

            await client.LoginAsync(TokenType.Bot, token);
            await client.StartAsync();
            await ready.Task;
        }

        public IEnumerable<DomainChannel> GetTextChannels() =>
            client.Guilds
                .SelectMany(g => g.TextChannels)
                .Select(c => new DomainChannel(c.Id.ToString(), c.Name));

        public async Task<IEnumerable<DomainMessage>> GetMessagesAsync(string channelId, int limit = 20)
        {
            if (client.GetChannel(ulong.Parse(channelId)) is not IMessageChannel channel)
                return Enumerable.Empty<DomainMessage>();

            var messages = await channel.GetMessagesAsync(limit).FlattenAsync();
            return messages.Select(ToMessage);
        }

        public async IAsyncEnumerable<DomainMessage> GetAllMessagesAsync(string channelId)
        {
            if (client.GetChannel(ulong.Parse(channelId)) is not IMessageChannel channel)
                yield break;

            ulong lastId = 0;
            while (true)
            {
                var batch = await channel.GetMessagesAsync(lastId, Direction.After, 100).FlattenAsync();
                var messages = batch.OrderBy(m => m.Id).ToList();

                if (messages.Count == 0)
                    yield break;

                foreach (var message in messages)
                    yield return ToMessage(message);

                lastId = messages[^1].Id;
            }
        }

        private static DomainMessage ToMessage(IMessage m) =>
            new(
                m.Author.Username,
                m.Content,
                m.Timestamp,
                m.Attachments.Select(a => new DomainAttachment(a.Filename, a.Url)).ToList()
            );
    }
}
