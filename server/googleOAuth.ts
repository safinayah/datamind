import type { Express, Request, Response } from "express";
import { google } from "googleapis";
import { ENV } from "./_core/env";
import { upsertGoogleUser } from "./authHelpers";
import { SignJWT } from "jose";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";

function getOAuth2Client(redirectUri: string) {
  return new google.auth.OAuth2(
    ENV.googleClientId,
    ENV.googleClientSecret,
    redirectUri
  );
}

function getRedirectUri(): string {
  // Always use the primary published domain as the redirect URI.
  // This must exactly match one of the Authorized Redirect URIs in Google Cloud Console.
  // In production the app is served at safinayah.manus.space; locally use localhost:3000.
  if (process.env.NODE_ENV === "production") {
    return "https://safinayah.manus.space/api/auth/google/callback";
  }
  return "http://localhost:3000/api/auth/google/callback";
}

async function signUserJwt(userId: number): Promise<string> {
  const secret = new TextEncoder().encode(ENV.cookieSecret);
  return new SignJWT({ sub: String(userId), type: "email_auth" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export function registerGoogleOAuthRoutes(app: Express) {
  // Step 1: Redirect user to Google consent screen
  app.get("/api/auth/google", (req: Request, res: Response) => {
    const redirectUri = getRedirectUri();
    const oauth2Client = getOAuth2Client(redirectUri);

    // Store the frontend origin in state so we can redirect back correctly
    const origin = (req.query.origin as string) || `${req.protocol}://${req.headers.host}`;
    const returnTo = (req.query.returnTo as string) || "/dashboard";
    const state = Buffer.from(JSON.stringify({ origin, returnTo })).toString("base64url");

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["openid", "email", "profile"],
      state,
      prompt: "select_account",
    });

    res.redirect(authUrl);
  });

  // Step 2: Handle Google callback, exchange code for tokens, create session
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const { code, state, error } = req.query as Record<string, string>;

    if (error) {
      console.error("[Google OAuth] Error from Google:", error);
      return res.redirect("/?error=google_auth_failed");
    }

    if (!code) {
      return res.status(400).send("Missing authorization code");
    }

    // Parse state to get origin and returnTo
    let origin = `${req.protocol}://${req.headers.host}`;
    let returnTo = "/dashboard";
    try {
      if (state) {
        const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf-8"));
        if (parsed.origin) origin = parsed.origin;
        if (parsed.returnTo) returnTo = parsed.returnTo;
      }
    } catch {
      // Use defaults
    }

    try {
      const redirectUri = getRedirectUri();
      const oauth2Client = getOAuth2Client(redirectUri);

      // Exchange code for tokens
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      // Get user info from Google
      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const { data: googleUser } = await oauth2.userinfo.get();

      if (!googleUser.id || !googleUser.email) {
        return res.status(400).send("Could not retrieve user info from Google");
      }

      // Upsert user in our database
      const user = await upsertGoogleUser({
        googleId: googleUser.id,
        email: googleUser.email,
        name: googleUser.name || googleUser.email.split("@")[0],
      });

      if (!user) {
        return res.status(500).send("Failed to create or update user");
      }

      // Create JWT session token
      const token = await signUserJwt(user.id);

      // Set session cookie
      res.cookie(COOKIE_NAME, token, getSessionCookieOptions(req));

      // Redirect back to frontend
      return res.redirect(`${origin}${returnTo}`);
    } catch (err) {
      console.error("[Google OAuth] Callback error:", err);
      return res.redirect(`${origin}/?error=google_auth_failed`);
    }
  });
}
