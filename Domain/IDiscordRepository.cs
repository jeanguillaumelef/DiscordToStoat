namespace Domain
{
    public interface IDiscordRepository
    {
        Task ConnectAsync();
        IEnumerable<Channel> GetTextChannels();
        Task<IEnumerable<Message>> GetMessagesAsync(string channelId, int limit = 20);
        IAsyncEnumerable<Message> GetAllMessagesAsync(string channelId);
    }
}
