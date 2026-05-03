import { Router } from "express";
import { db } from "@workspace/db";
import { creatorProfilesTable, connectedAccountsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();

router.get("/settings/profile", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const [profile] = await db.select().from(creatorProfilesTable).where(eq(creatorProfilesTable.userId, userId)).limit(1);
    if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }
    res.json({ id: profile.id, userId: profile.userId, businessName: profile.businessName, country: profile.country, defaultCurrency: profile.defaultCurrency, taxReservePercent: profile.taxReservePercent, paymentTermsDays: profile.paymentTermsDays, niche: profile.niche, averageSponsorshipValue: profile.averageSponsorshipValue, subscriptionPlan: profile.subscriptionPlan, subscriptionStatus: profile.subscriptionStatus, createdAt: profile.createdAt });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

router.patch("/settings/profile", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { name, businessName, country, defaultCurrency, paymentTermsDays, niche, taxReservePercent, averageSponsorshipValue } = req.body;

    if (name) {
      await db.update(usersTable).set({ name, updatedAt: new Date() }).where(eq(usersTable.id, userId));
    }

    const [existing] = await db.select().from(creatorProfilesTable).where(eq(creatorProfilesTable.userId, userId)).limit(1);
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (businessName !== undefined) updates["businessName"] = businessName;
    if (country !== undefined) updates["country"] = country;
    if (defaultCurrency !== undefined) updates["defaultCurrency"] = defaultCurrency;
    if (paymentTermsDays !== undefined) updates["paymentTermsDays"] = paymentTermsDays;
    if (niche !== undefined) updates["niche"] = niche;
    if (taxReservePercent !== undefined) updates["taxReservePercent"] = taxReservePercent;
    if (averageSponsorshipValue !== undefined) updates["averageSponsorshipValue"] = averageSponsorshipValue?.toString();

    let profile;
    if (existing) {
      [profile] = await db.update(creatorProfilesTable).set(updates as any).where(eq(creatorProfilesTable.userId, userId)).returning();
    } else {
      [profile] = await db.insert(creatorProfilesTable).values({ userId, ...updates }).returning();
    }

    res.json({ id: profile.id, userId: profile.userId, businessName: profile.businessName, country: profile.country, defaultCurrency: profile.defaultCurrency, taxReservePercent: profile.taxReservePercent, paymentTermsDays: profile.paymentTermsDays, niche: profile.niche, subscriptionPlan: profile.subscriptionPlan });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

router.get("/settings/integrations", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const accounts = await db.select().from(connectedAccountsTable).where(eq(connectedAccountsTable.userId, userId));

    const getAccount = (provider: string) => accounts.find(a => a.provider === provider);

    const ytAccount = getAccount("youtube");
    const ttAccount = getAccount("tiktok");
    const notionAccount = getAccount("notion");

    const hasTiktokKeys = !!(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET);
    const hasYoutubeKeys = !!(process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET);
    const hasNotionKey = !!process.env.NOTION_API_KEY;
    const hasResend = !!process.env.RESEND_API_KEY;
    const hasPaystack = !!process.env.PAYSTACK_SECRET_KEY;

    res.json({
      youtube: {
        status: ytAccount?.status === "connected" ? "connected" : hasYoutubeKeys ? "not_connected" : "requires_setup",
        accountName: ytAccount?.status === "connected" ? (ytAccount.metadata as any)?.title : undefined,
        accountDetails: ytAccount?.status === "connected" ? `${(ytAccount.metadata as any)?.subscriberCount || 0} subscribers` : undefined,
        errorMessage: ytAccount?.status === "error" ? ytAccount.errorMessage : undefined,
        setupInstructions: !hasYoutubeKeys ? "Set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET in settings to enable YouTube integration." : undefined,
      },
      tiktok: {
        status: ttAccount?.status === "connected" ? "connected" : hasTiktokKeys ? "not_connected" : "requires_setup",
        accountName: ttAccount?.status === "connected" ? (ttAccount.metadata as any)?.displayName : undefined,
        requiresApproval: !hasTiktokKeys,
        setupInstructions: !hasTiktokKeys ? "TikTok API access requires: 1. A TikTok developer account at developers.tiktok.com 2. An approved app with Login Kit and Video List scopes 3. Client Key and Client Secret from TikTok Developer Portal" : undefined,
      },
      paystack: {
        status: hasPaystack ? "connected" : "requires_setup",
        accountName: hasPaystack ? "Paystack Connected" : undefined,
        setupInstructions: !hasPaystack ? "Add PAYSTACK_SECRET_KEY and NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY to enable Paystack invoicing and payments." : undefined,
      },
      notion: {
        status: notionAccount?.status === "connected" ? "connected" : hasNotionKey ? "connected" : "requires_setup",
        accountName: hasNotionKey ? "Notion API Key configured" : undefined,
        setupInstructions: !hasNotionKey ? "Add NOTION_API_KEY to enable Notion exports." : undefined,
      },
      resend: {
        status: hasResend ? "connected" : "requires_setup",
        accountName: hasResend ? (process.env.FROM_EMAIL || "Configured") : undefined,
        accountDetails: hasResend ? process.env.FROM_EMAIL : undefined,
        setupInstructions: !hasResend ? "Add RESEND_API_KEY and FROM_EMAIL to enable email reminders." : undefined,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

router.post("/settings/integrations/:provider/disconnect", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const provider = Array.isArray(req.params.provider) ? req.params.provider[0] : req.params.provider;
    await db.update(connectedAccountsTable).set({ status: "pending", accessToken: null, refreshToken: null, updatedAt: new Date() } as any).where(and(eq(connectedAccountsTable.userId, userId), eq(connectedAccountsTable.provider, provider)));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});

router.get("/settings/api-status", requireAuth, (_req, res) => {
  res.json({
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    paystack: !!process.env.PAYSTACK_SECRET_KEY,
    resend: !!process.env.RESEND_API_KEY,
    youtubeClient: !!process.env.YOUTUBE_CLIENT_ID,
    tiktokClient: !!process.env.TIKTOK_CLIENT_KEY,
    notion: !!process.env.NOTION_API_KEY,
  });
});

export default router;
