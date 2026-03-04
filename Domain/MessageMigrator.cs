namespace Domain
{
    public class MessageMigrator(IDiscordRepository discord, IStoatRepository stoat)
    {
        public async Task MigrateChannelAsync(string discordChannelId, string stoatChannelId)
        {
            var messages = discord.GetAllMessagesAsync(discordChannelId);
            await foreach (var message in messages)
            {
                await stoat.SendMessageAsync(stoatChannelId, message.Author, message.Content);
            }
        }
    }
}
