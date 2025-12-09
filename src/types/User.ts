// src/types/User.ts

export interface User {
  id?: string;
  role: "player" | "dm";
  displayName?: string;
}
