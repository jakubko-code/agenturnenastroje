export type AppRole = "admin" | "editor" | "viewer";

export type SessionUser = {
  id: string;
  email: string;
  role: AppRole;
};
