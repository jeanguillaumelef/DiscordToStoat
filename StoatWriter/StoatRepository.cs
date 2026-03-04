using System.Text;
using System.Text.Json;
using Domain;

namespace StoatWriter
{
    public class StoatRepository : IStoatRepository
    {
        private readonly HttpClient _client;

        public StoatRepository(string token)
        {
            _client = new HttpClient { BaseAddress = new Uri("https://api.revolt.chat") };
            _client.DefaultRequestHeaders.Add("x-bot-token", token);
        }

        public async Task<IEnumerable<Channel>> GetChannelsAsync(string serverId)
        {
            var response = await _client.GetAsync($"/servers/{serverId}");
            response.EnsureSuccessStatusCode();

            var json = JsonSerializer.Deserialize<JsonElement>(await response.Content.ReadAsStringAsync());
            var channelIds = json.GetProperty("channels").EnumerateArray()
                .Select(c => c.GetString()!);

            var channels = new List<Channel>();
            foreach (var id in channelIds)
                await AddChannelIfExistsAsync(channels, id);
            return channels;
        }

        private async Task AddChannelIfExistsAsync(List<Channel> channels, string id)
        {
            var channel = await TryGetChannelAsync(id);
            if (channel is not null)
                channels.Add(channel);
        }

        private async Task<Channel?> TryGetChannelAsync(string id)
        {
            var response = await _client.GetAsync($"/channels/{id}");
            if (!response.IsSuccessStatusCode) return null;

            var json = JsonSerializer.Deserialize<JsonElement>(await response.Content.ReadAsStringAsync());
            var name = json.TryGetProperty("name", out var nameProp) ? nameProp.GetString()! : id;
            return new Channel(id, name);
        }

        public async Task SendMessageAsync(string channelId, string author, string content)
        {
            var body = JsonSerializer.Serialize(new { content = $"**{author}**: {content}" });
            var response = await _client.PostAsync(
                $"/channels/{channelId}/messages",
                new StringContent(body, Encoding.UTF8, "application/json"));
            response.EnsureSuccessStatusCode();
        }

        public string GetUserMention(string userId) => $"<@{userId}>";
    }
}
