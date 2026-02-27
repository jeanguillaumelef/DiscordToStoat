using Discord;
using Discord.WebSocket;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace DiscordReader
{
    public static class ServiceConfiguration
    {
        private static readonly ServiceProvider _provider = new ServiceCollection()
            .AddSingleton(BuildConfiguration())
            .AddSingleton(new DiscordSocketClient(new DiscordSocketConfig
            {
                GatewayIntents = GatewayIntents.Guilds | GatewayIntents.GuildMessages | GatewayIntents.MessageContent
            }))
            .AddSingleton<IDiscordRepository, DiscordRepository>()
            .BuildServiceProvider();

        public static IDiscordRepository DiscordRepository =>
            _provider.GetRequiredService<IDiscordRepository>();

        private static IConfiguration BuildConfiguration()
        {
            var env = Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT") ?? "Production";

            return new ConfigurationBuilder()
                .AddJsonFile("appsettings.json", optional: false)
                .AddJsonFile($"appsettings.{env}.json", optional: true)
                .AddEnvironmentVariables()
                .Build();
        }
    }
}
