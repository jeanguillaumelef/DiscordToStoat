using Discord.WebSocket;
using Microsoft.Extensions.DependencyInjection;

namespace DiscordReader
{
    public static class ServiceConfiguration
    {
        private static readonly ServiceProvider _provider = new ServiceCollection()
            .AddSingleton<DiscordSocketClient>()
            .AddSingleton<IDiscordRepository, DiscordRepository>()
            .BuildServiceProvider();

        public static IDiscordRepository DiscordRepository =>
            _provider.GetRequiredService<IDiscordRepository>();
    }
}
