using Discord;

namespace DiscordReader
{
    public interface IDiscordRepository
    {
        Task ConnectAsync();
        IEnumerable<IMessageChannel> GetTextChannels();
        Task<IMessageChannel?> GetChannelAsync(ulong channelId);
        Task<IEnumerable<IMessage>> GetMessagesAsync(ulong channelId, int limit = 20);
        Task<IMessage?> TryGetMessageAsync(ulong channelId, ulong messageId);
    }
}
