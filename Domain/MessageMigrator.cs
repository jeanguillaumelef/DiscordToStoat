namespace Domain
{
    public class MessageMigrator(IDiscordRepository discord, IStoatRepository stoat)
    {
        public async Task MigrateChannelAsync(string discordChannelId, string stoatServerId)
        {
            var channelName = discord.GetTextChannels().First(c => c.Id == discordChannelId).Name;
            var stoatChannels = await stoat.GetChannelsAsync(stoatServerId);
            
            var stoatChannelId = stoatChannels.FirstOrDefault(c => c.Name == channelName)?.Id
                ?? await stoat.CreateChannelAsync(stoatServerId, channelName);

            await foreach (var message in discord.GetAllMessagesAsync(discordChannelId))
                await stoat.SendMessageAsync(stoatChannelId, message.Author, message.Content);
        }
    }
}
