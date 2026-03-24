namespace Domain
{
    public interface IStoatRepository
    {
        Task<IEnumerable<Channel>> GetChannelsAsync(string serverId);
        Task<string> CreateChannelAsync(string serverId, string channelName);
        Task<bool> TrySendMessageAsync(string channelId, string author, string content);
    }
}
