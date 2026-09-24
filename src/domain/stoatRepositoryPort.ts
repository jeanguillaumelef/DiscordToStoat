import type { Channel } from "./channel.js";
import type { Result } from "./result.js";
import type { User } from "./user.js";

export const SendMessageError = {
  ChannelNotFound: "channel_not_found",
} as const;
export type SendMessageError = (typeof SendMessageError)[keyof typeof SendMessageError];

export interface StoatRepositoryPort {
  listChannels(serverId: string): Channel[];
  createChannel(serverId: string, name: string): Promise<Channel>;
  sendMessage(
    serverId: string,
    channelName: string,
    content: string,
    user?: User,
  ): Promise<Result<void, SendMessageError>>;
}
