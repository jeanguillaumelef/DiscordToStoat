import type { Channel } from "./channel.js";
import type { Message } from "./message.js";
import type { User } from "./user.js";

export interface StoatRepositoryPort {
  listChannels(serverId: string): Channel[];
  createChannel(serverId: string, name: string): Promise<Channel>;
  sendMessage(
    serverId: string,
    channelName: string,
    content: string,
    user?: User,
  ): Promise<unknown>;
}

/**
 * Migrate a channel from Discord to Stoat.
 */
export class ChannelMigrator {
  constructor(
    private readonly stoat: StoatRepositoryPort,
    private readonly stoatServerId: string,
  ) {}

  async migrateMessage(channel: Channel, message: Message): Promise<void> {
    await this.stoat.sendMessage(
      this.stoatServerId,
      channel.name,
      message.content,
      message.author,
    );
  }
}
