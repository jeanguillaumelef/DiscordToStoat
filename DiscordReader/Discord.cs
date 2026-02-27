using Discord;
using Discord.WebSocket;
using Microsoft.Extensions.Configuration;

namespace DiscordReader
{
    public class DiscordRepository(DiscordSocketClient client, IConfiguration config) : IDiscordRepository
    {
        public async Task ConnectAsync()
        {
            var token = config["Discord:Token"]
                ?? throw new InvalidOperationException("Discord:Token is not configured.");

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