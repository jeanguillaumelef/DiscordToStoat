using Discord;
using Discord.WebSocket;

namespace DiscordReader
{
    public class DiscordRepository(DiscordSocketClient client) : IDiscordRepository
    {
        public async Task ConnectAsync(string token)
        {
            var ready = new TaskCompletionSource();
            client.Ready += () => { ready.SetResult(); return Task.CompletedTask; };

            await client.LoginAsync(TokenType.Bot, token);
            await client.StartAsync();
            await ready.Task;
        }

        public async Task<IMessageChannel?> GetChannelAsync(ulong channelId)
        {
            var channel = await client.GetChannelAsync(channelId);
            return channel as IMessageChannel;
        }

        public async Task<IMessage?> TryGetMessageAsync(ulong channelId, ulong messageId)
        {
            if (client.GetChannel(channelId) is not IMessageChannel channel)
                return null;

            return await channel.GetMessageAsync(messageId);
        }
    }
}