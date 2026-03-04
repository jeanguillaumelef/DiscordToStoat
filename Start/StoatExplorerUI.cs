using Domain;

namespace Start
{
    public class StoatExplorerUI(IStoatRepository repo)
    {
        public async Task<string> SelectChannelAsync(string serverId)
        {
            var channels = (await repo.GetChannelsAsync(serverId)).ToList();
            Console.WriteLine("Available Stoat channels:");
            for (int i = 0; i < channels.Count; i++)
                Console.WriteLine($"  {i + 1}. {channels[i].Name}");

            Console.Write("Select a channel: ");
            return channels[int.Parse(Console.ReadLine()!) - 1].Id;
        }

        public async Task SendMessageAsync(string channelId, string author, string content) =>
            await repo.SendMessageAsync(channelId, author, content);
    }
}
