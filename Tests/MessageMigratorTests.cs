using Domain;
using Moq;

namespace Tests
{
    public class MessageMigratorTests
    {
        private readonly Mock<IDiscordRepository> _discord = new();
        private readonly Mock<IStoatRepository> _stoat = new();

        [Fact]
        public async Task MigrateChannelAsync_CallsSendMessageAsync_ForEachDiscordMessage()
        {
            var messages = new List<Message>
            {
                new("Author1", "Hello", DateTimeOffset.Now, []),
                new("Author2", "World", DateTimeOffset.Now, [])
            };

            _discord
                .Setup(r => r.GetAllMessagesAsync("discord-channel"))
                .Returns(ToAsyncEnumerable(messages));

            _stoat
                .Setup(r => r.SendMessageAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
                .Returns(Task.CompletedTask);

            await new MessageMigrator(_discord.Object, _stoat.Object)
                .MigrateChannelAsync("discord-channel", "stoat-channel");

            _stoat.Verify(r => r.SendMessageAsync("stoat-channel", "Author1", "Hello"), Times.Once);
            _stoat.Verify(r => r.SendMessageAsync("stoat-channel", "Author2", "World"), Times.Once);
        }

        private static async IAsyncEnumerable<T> ToAsyncEnumerable<T>(IEnumerable<T> items)
        {
            foreach (var item in items)
                yield return item;
            await Task.CompletedTask;
        }
    }
}
