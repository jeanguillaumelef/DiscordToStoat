import type { Channel } from "./channel.js";
import type { Message } from "./message.js";
import type { Result } from "./result.js";
import { SendMessageError, type StoatRepositoryPort } from "./stoatRepositoryPort.js";

/**
 * Migrate a channel from Discord to Stoat.
 */
export class ChannelMigrator {
  constructor(
    private readonly stoat: StoatRepositoryPort,
    private readonly stoatServerId: string,
  ) {}

  async migrateMessage(
    channel: Channel,
    message: Message,
  ): Promise<Result<void, SendMessageError>> {
    const send = () =>
      this.stoat.sendMessage(
        this.stoatServerId,
        channel.name,
        message.content,
        message.author,
      );

    const result = await send();
    if (result.ok || result.error !== SendMessageError.ChannelNotFound) return result;

    await this.stoat.createChannel(this.stoatServerId, channel.name);
    return send();
  }
}
