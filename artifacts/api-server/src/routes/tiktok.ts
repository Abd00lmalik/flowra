import { Router } from "express";
import { db } from "@workspace/db";
import { connectedAccountsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { logger } from "../lib/logger.js";

const router = Router();

router.get("/auth/tiktok", requireAuth, (req, res) => {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  if (!clientKey) { res.status(503).json({ error: "TikTok OAuth not configured. Set TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET." }); return; }

  const domain = process.env.REPLIT_DEV_DOMAIN || "localhost";
  const redirectUri = `https://${domain}/api/auth/tiktok/callback`;
  const state = `${(req as any).userId}_${Math.random().toString(36).slice(2)}`;
  const scope = "user.info.basic,video.list";
  res.redirect(`https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&response_type=code&scope=${scope}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`);
});

router.get("/auth/tiktok/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) { res.redirect("/app/settings/integrations?error=tiktok_failed"); return; }

    const userId = (state as string).split("_")[0];
    const clientKey = process.env.TIKTOK_CLIENT_KEY!;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET!;
    const domain = process.env.REPLIT_DEV_DOMAIN || "localhost";
    const redirectUri = `https://${domain}/api/auth/tiktok/callback`;

    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_key: clientKey, client_secret: clientSecret, code: code as string, grant_type: "authorization_code", redirect_uri: redirectUri }),
    });
    const tokenData = await tokenRes.json() as any;
    if (!tokenData.access_token) { res.redirect("/app/settings/integrations?error=tiktok_failed"); return; }

    // Fetch user info
    const userRes = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=display_name,avatar_url,follower_count", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json() as any;

    const existing = await db.select().from(connectedAccountsTable).where(and(eq(connectedAccountsTable.userId, userId), eq(connectedAccountsTable.provider, "tiktok"))).limit(1);
    const accountData = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      scope: tokenData.scope,
      status: "connected",
      providerAccountId: userData.data?.user?.open_id,
      metadata: { displayName: userData.data?.user?.display_name, avatarUrl: userData.data?.user?.avatar_url },
      updatedAt: new Date(),
    };

    if (existing.length > 0) {
      await db.update(connectedAccountsTable).set(accountData as any).where(and(eq(connectedAccountsTable.userId, userId), eq(connectedAccountsTable.provider, "tiktok")));
    } else {
      await db.insert(connectedAccountsTable).values({ userId, provider: "tiktok", ...accountData });
    }

    res.redirect("/app/settings/integrations?connected=tiktok");
  } catch (err) {
    logger.error({ err }, "TikTok callback error");
    res.redirect("/app/settings/integrations?error=tiktok_failed");
  }
});

export default router;
