using Domain;
using Moq;

namespace Tests
{
    internal class MessageMigratorFixture
    {
        internal const string DiscordChannel = "discord-channel";
        internal const string StoatChannel = "stoat-channel";
        internal const string StoatServer = "stoat-server";
        internal const string StoatChannelName = "stoat-channel-name";

        internal readonly Mock<IDiscordRepository> Discord = new();
        internal readonly Mock<IStoatRepository> Stoat = new();

        internal void SetupDiscord(IEnumerable<Message> messages)
        {
            Discord
                .Setup(r => r.GetTextChannels())
                .Returns([new Channel(DiscordChannel, StoatChannelName)]);
            Discord
                .Setup(r => r.GetAllMessagesAsync(DiscordChannel))
                .Returns(ToAsyncEnumerable(messages));

            Stoat
                .Setup(r => r.GetChannelsAsync(StoatServer))
                .ReturnsAsync([new Channel(StoatChannel, StoatChannelName)]);
            Stoat
                .Setup(r => r.SendMessageAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
                .Returns(Task.CompletedTask);
        }

        internal Task Migrate() =>
            new MessageMigrator(Discord.Object, Stoat.Object)
                .MigrateChannelAsync(DiscordChannel, StoatServer);

        internal static async IAsyncEnumerable<T> ToAsyncEnumerable<T>(IEnumerable<T> items)
        {
            foreach (var item in items)
                yield return item;
            await Task.CompletedTask;
        }
    }
}
