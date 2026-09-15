import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { jwtVerify } from "jose";
import { parse as parseCookieHeader } from "cookie";
import { COOKIE_NAME } from "@shared/const";
import { ENV } from "./env";
import { findUserById } from "../authHelpers";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

/**
 * Try to authenticate using the custom email/Google JWT (sub + type fields).
 * This handles sessions created by email/password login and Google OAuth.
 */
async function authenticateEmailOrGoogleJwt(req: CreateExpressContextOptions["req"]): Promise<User | null> {
  try {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return null;

    const cookies = parseCookieHeader(cookieHeader);
    const token = cookies[COOKIE_NAME];
    if (!token) return null;

    const secret = new TextEncoder().encode(ENV.cookieSecret);
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });

    // Check for our custom JWT format (email/Google auth)
    if (payload.type === "email_auth" && payload.sub) {
      const userId = parseInt(payload.sub as string, 10);
      if (!isNaN(userId)) {
        return await findUserById(userId);
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // First try Manus OAuth session (openId-based)
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    // Fall through to email/Google JWT check
  }

  // If Manus auth failed, try email/password or Google OAuth JWT
  if (!user) {
    user = await authenticateEmailOrGoogleJwt(opts.req);
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
