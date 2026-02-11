import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: "admin" | "editor" | "viewer";
    };
  }

  interface User {
    role?: "admin" | "editor" | "viewer";
  }
}
