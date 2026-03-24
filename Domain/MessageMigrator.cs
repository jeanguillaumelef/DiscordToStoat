namespace Domain
{
    public class MessageMigrator(IDiscordRepository discord, IStoatRepository stoat, IMigrationLogger? logger = null)
    {
        private const string FailedToSendMessage = "Failed to send message";
        public async Task MigrateChannelAsync(string discordChannelId, string stoatServerId)
        {
            var channelName = discord.GetTextChannels().First(c => c.Id == discordChannelId).Name;
            var stoatChannels = await stoat.GetChannelsAsync(stoatServerId);

            var stoatChannelId = stoatChannels.FirstOrDefault(c => c.Name == channelName)?.Id
                ?? await stoat.CreateChannelAsync(stoatServerId, channelName);

            await foreach (var message in discord.GetAllMessagesAsync(discordChannelId))
            {
                var success = await stoat.TrySendMessageAsync(stoatChannelId, message.Author, message.Content);
                if (!success)
                    logger?.LogFailure(new MigrationFailure(message.Author, message.Content, message.Timestamp, FailedToSendMessage));
            }
        }
    }
}
