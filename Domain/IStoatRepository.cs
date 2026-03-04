namespace Domain
{
    public interface IStoatRepository
    {
        Task<IEnumerable<Channel>> GetChannelsAsync(string serverId);
        Task SendMessageAsync(string channelId, string author, string content);
    }
}
