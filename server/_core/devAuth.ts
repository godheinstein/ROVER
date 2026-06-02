import type { Express, Request, Response } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { sdk } from "./sdk";
import { ENV } from "./env";
import { upsertUser } from "../db";

/**
 * Local development login. The normal login flow depends on an external OAuth
 * portal that isn't available locally, so this route mints a valid session
 * cookie for an admin user. It is DISABLED in production.
 *
 * Visit http://localhost:3000/api/dev-login to sign in as a local admin, then
 * navigate to /admin. Use /api/dev-logout to clear the session.
 */
const DEV_OPEN_ID = ENV.ownerOpenId || "local-admin";

export function registerDevAuthRoutes(app: Express) {
  if (ENV.isProduction) return;

  app.get("/api/dev-login", async (req: Request, res: Response) => {
    try {
      const email = (req.query.email as string) || "admin@local.dev";
      const name = (req.query.name as string) || "Local Admin";

      // Pre-create the user so authenticateRequest doesn't try to sync from
      // the (unavailable) OAuth server, and grant the admin role.
      await upsertUser({
        openId: DEV_OPEN_ID,
        email,
        name,
        loginMethod: "dev",
        role: "admin",
        lastSignedIn: new Date(),
      });

      // appId and name must be non-empty for verifySession() to accept the token.
      const token = await sdk.signSession({
        openId: DEV_OPEN_ID,
        appId: ENV.appId || "local-dev",
        name,
      });

      // sameSite "lax" + secure:false so the cookie is accepted over http://localhost.
      res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: false,
        maxAge: ONE_YEAR_MS,
      });

      res.redirect("/admin");
    } catch (error) {
      res
        .status(500)
        .send("dev-login failed: " + (error instanceof Error ? error.message : String(error)));
    }
  });

  app.get("/api/dev-logout", (_req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME, { path: "/" });
    res.redirect("/");
  });

  console.log("[DevAuth] Local login enabled — visit /api/dev-login to sign in as admin");
}
