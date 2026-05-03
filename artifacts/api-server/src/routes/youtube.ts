import { Router } from "express";
import { db } from "@workspace/db";
import { connectedAccountsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { logger } from "../lib/logger.js";

const router = Router();

router.get("/auth/youtube", requireAuth, (req, res) => {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  if (!clientId) { res.status(503).json({ error: "YouTube OAuth not configured" }); return; }

  const domain = process.env.REPLIT_DEV_DOMAIN || "localhost";
  const redirectUri = `https://${domain}/api/auth/youtube/callback`;
  const state = (req as any).userId;
  const scope = encodeURIComponent("https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.force-ssl");
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}&access_type=offline&prompt=consent`);
});

router.get("/auth/youtube/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) { res.redirect("/app/settings/integrations?error=youtube_failed"); return; }

    const userId = state as string;
    const clientId = process.env.YOUTUBE_CLIENT_ID!;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET!;
    const domain = process.env.REPLIT_DEV_DOMAIN || "localhost";
    const redirectUri = `https://${domain}/api/auth/youtube/callback`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code: code as string, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
    });
    const tokenData = await tokenRes.json() as any;
    if (!tokenData.access_token) { res.redirect("/app/settings/integrations?error=youtube_failed"); return; }

    // Fetch channel info
    const channelRes = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const channelData = await channelRes.json() as any;
    const channel = channelData.items?.[0];

    const existing = await db.select().from(connectedAccountsTable).where(and(eq(connectedAccountsTable.userId, userId), eq(connectedAccountsTable.provider, "youtube"))).limit(1);
    const accountData = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiry: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : undefined,
      scope: tokenData.scope,
      status: "connected",
      providerAccountId: channel?.id,
      metadata: channel ? { title: channel.snippet?.title, thumbnailUrl: channel.snippet?.thumbnails?.default?.url, subscriberCount: channel.statistics?.subscriberCount } : {},
      updatedAt: new Date(),
    };

    if (existing.length > 0) {
      await db.update(connectedAccountsTable).set(accountData as any).where(and(eq(connectedAccountsTable.userId, userId), eq(connectedAccountsTable.provider, "youtube")));
    } else {
      await db.insert(connectedAccountsTable).values({ userId, provider: "youtube", ...accountData });
    }

    res.redirect("/app/settings/integrations?connected=youtube");
  } catch (err) {
    logger.error({ err }, "YouTube callback error");
    res.redirect("/app/settings/integrations?error=youtube_failed");
  }
});

router.get("/youtube/channels", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const [account] = await db.select().from(connectedAccountsTable).where(and(eq(connectedAccountsTable.userId, userId), eq(connectedAccountsTable.provider, "youtube"))).limit(1);

    if (!account || account.status !== "connected") {
      res.status(400).json({ error: "YouTube not connected" });
      return;
    }

    const channelRes = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true", {
      headers: { Authorization: `Bearer ${account.accessToken}` },
    });
    const data = await channelRes.json() as any;
    const channel = data.items?.[0];
    if (!channel) { res.status(404).json({ error: "Channel not found" }); return; }

    res.json({
      id: channel.id,
      title: channel.snippet?.title,
      description: channel.snippet?.description,
      thumbnailUrl: channel.snippet?.thumbnails?.default?.url,
      subscriberCount: channel.statistics?.subscriberCount,
      videoCount: channel.statistics?.videoCount,
      viewCount: channel.statistics?.viewCount,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch channel" });
  }
});

router.get("/youtube/videos", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const [account] = await db.select().from(connectedAccountsTable).where(and(eq(connectedAccountsTable.userId, userId), eq(connectedAccountsTable.provider, "youtube"))).limit(1);

    if (!account || account.status !== "connected") {
      res.status(400).json({ error: "YouTube not connected" });
      return;
    }

    const searchRes = await fetch("https://www.googleapis.com/youtube/v3/search?part=snippet&forMine=true&maxResults=50&type=video&order=date", {
      headers: { Authorization: `Bearer ${account.accessToken}` },
    });
    const data = await searchRes.json() as any;
    const videos = (data.items || []).map((item: any) => ({
      videoId: item.id?.videoId,
      title: item.snippet?.title,
      description: item.snippet?.description,
      publishedAt: item.snippet?.publishedAt,
      url: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
      thumbnailUrl: item.snippet?.thumbnails?.default?.url,
      tags: [],
    }));
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

export default router;
