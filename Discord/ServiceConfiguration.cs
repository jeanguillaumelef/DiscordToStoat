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
            .AddSingleton<Domain.IDiscordRepository, DiscordRepository>()
            .BuildServiceProvider();

        public static Domain.IDiscordRepository DiscordRepository =>
            _provider.GetRequiredService<Domain.IDiscordRepository>();

        public static IConfiguration Configuration =>
            _provider.GetRequiredService<IConfiguration>();

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
