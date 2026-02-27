using Discord;

namespace DiscordReader
{
    public interface IDiscordRepository
    {
        Task ConnectAsync(string token);
        Task<IMessageChannel?> GetChannelAsync(ulong channelId);
        Task<IMessage?> TryGetMessageAsync(ulong channelId, ulong messageId);
    }
}
