using Domain;
using Moq;

namespace Tests
{
    public class MessageMigratorTests
    {
        private readonly MessageMigratorFixture _fixture = new();

        [Fact]
        public async Task MigrateChannelAsync_CallsSendMessageAsync_ForEachDiscordMessage()
        {
            var messages = new List<Message>
            {
                new("Author1", "Hello", DateTimeOffset.Now, []),
                new("Author2", "World", DateTimeOffset.Now, [])
            };

            _fixture.SetupDiscord(messages);

            await _fixture.Migrate();

            _fixture.Stoat.Verify(r => r.SendMessageAsync(MessageMigratorFixture.StoatChannel, "Author1", "Hello"), Times.Once);
            _fixture.Stoat.Verify(r => r.SendMessageAsync(MessageMigratorFixture.StoatChannel, "Author2", "World"), Times.Once);
        }

        [Fact]
        public async Task MigrateChannelAsync_SendsAllMessages_AcrossMultiplePages()
        {
            var page1 = Enumerable.Range(1, 100).Select(i => new Message($"Author{i}", $"Message{i}", DateTimeOffset.Now, []));
            var page2 = Enumerable.Range(101, 100).Select(i => new Message($"Author{i}", $"Message{i}", DateTimeOffset.Now, []));

            _fixture.SetupDiscord([.. page1, .. page2]);

            await _fixture.Migrate();

            _fixture.Stoat.Verify(r => r.SendMessageAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Exactly(200));
        }

        [Fact]
        public async Task MigrateChannelAsync_SendsMessages_InReceivedOrder()
        {
            var sentOrder = new List<string>();
            var messages = new List<Message>
            {
                new("A", "first", DateTimeOffset.Now, []),
                new("B", "second", DateTimeOffset.Now, []),
                new("C", "third", DateTimeOffset.Now, [])
            };

            _fixture.SetupDiscord(messages);
            _fixture.Stoat
                .Setup(r => r.SendMessageAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
                .Callback<string, string, string>((_, _, content) => sentOrder.Add(content))
                .Returns(Task.CompletedTask);

            await _fixture.Migrate();

            Assert.Equal(["first", "second", "third"], sentOrder);
        }

        [Fact]
        public async Task MigrateChannelAsync_CreatesChannelAndSendsMessages_WhenChannelDoesNotExistInStoat()
        {
            _fixture.SetupDiscord([new Message("Author", "Hello", DateTimeOffset.Now, [])]);

            _fixture.Stoat.Setup(r => r.GetChannelsAsync(MessageMigratorFixture.StoatServer))
                .ReturnsAsync([]);
            _fixture.Stoat.Setup(r => r.CreateChannelAsync(MessageMigratorFixture.StoatServer, MessageMigratorFixture.StoatChannelName))
                .ReturnsAsync(MessageMigratorFixture.StoatChannel);

            await _fixture.Migrate();

            _fixture.Stoat.Verify(r => r.CreateChannelAsync(MessageMigratorFixture.StoatServer, MessageMigratorFixture.StoatChannelName), Times.Once);
            _fixture.Stoat.Verify(r => r.SendMessageAsync(MessageMigratorFixture.StoatChannel, "Author", "Hello"), Times.Once);
        }

        [Fact]
        public async Task MigrateChannelAsync_SendsNoMessages_WhenChannelIsEmpty()
        {
            _fixture.SetupDiscord([]);

            await _fixture.Migrate();

            _fixture.Stoat.Verify(r => r.SendMessageAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        }
    }
}
