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

        public async Task<string> CreateChannelAsync(string serverId, string channelName)
        {
            var body = JsonSerializer.Serialize(new { type = "Text", name = channelName });
            var response = await _client.PostAsync(
                $"/servers/{serverId}/channels",
                new StringContent(body, Encoding.UTF8, "application/json"));
            response.EnsureSuccessStatusCode();

            var json = JsonSerializer.Deserialize<JsonElement>(await response.Content.ReadAsStringAsync());
            return json.GetProperty("_id").GetString()!;
        }

        public async Task<bool> TrySendMessageAsync(string channelId, string author, string content)
        {
            var body = JsonSerializer.Serialize(new { content, masquerade = new { name = author } });
            while (true)
            {
                var result = await TrySendMessageOnceAsync($"/channels/{channelId}/messages", body);
                if (result.HasValue)
                    return result.Value;
            }
        }

        private async Task<bool?> TrySendMessageOnceAsync(string url, string body)
        {
            HttpResponseMessage response;
            try
            {
                response = await _client.PostAsync(url, new StringContent(body, Encoding.UTF8, "application/json"));
            }
            catch (HttpRequestException)
            {
                return false;
            }

            if (response.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
            {
                var retryAfter = response.Headers.RetryAfter?.Delta ?? TimeSpan.FromSeconds(1);
                await Task.Delay(retryAfter);
                return null;
            }

            return response.IsSuccessStatusCode;
        }

        public string GetUserMention(string userId) => $"<@{userId}>";
    }
}
