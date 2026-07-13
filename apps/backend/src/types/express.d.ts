import "express";

export interface AuthUser {
  id: string;
  role: "super_admin" | "owner" | "admin" | "customer" | "toko";
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
