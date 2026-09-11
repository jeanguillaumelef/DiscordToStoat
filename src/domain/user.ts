/**
 * A user's display identity, shared between the Discord and Stoat adapters
 * so a message can be sent while masquerading as its original author.
 */
export interface User {
  displayName: string;
  avatarUrl?: string;
}
