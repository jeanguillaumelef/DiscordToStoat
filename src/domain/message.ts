import type { User } from "./user.js";

export interface Message {
  content: string;
  author: User;
}
