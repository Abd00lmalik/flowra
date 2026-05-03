import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, creatorProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, hashPassword, comparePassword, requireAuth } from "../lib/auth.js";
import { logger } from "../lib/logger.js";

const router = Router();

router.post("/auth/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({ error: "email, password, and name are required" });
      return;
    }
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }
    const passwordHash = await hashPassword(password);
    const [user] = await db.insert(usersTable).values({ email, name, passwordHash }).returning();
    const token = signToken(user.id);
    const profile = await db.select().from(creatorProfilesTable).where(eq(creatorProfilesTable.userId, user.id)).limit(1);
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name }, needsOnboarding: profile.length === 0 });
  } catch (err) {
    logger.error({ err }, "Register error");
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = signToken(user.id);
    const profile = await db.select().from(creatorProfilesTable).where(eq(creatorProfilesTable.userId, user.id)).limit(1);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name }, needsOnboarding: profile.length === 0 });
  } catch (err) {
    logger.error({ err }, "Login error");
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/auth/logout", (_req, res) => {
  res.json({ success: true });
});

router.get("/auth/me", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) { res.status(401).json({ error: "User not found" }); return; }
    const [profile] = await db.select().from(creatorProfilesTable).where(eq(creatorProfilesTable.userId, userId)).limit(1);
    res.json({ user: { id: user.id, email: user.email, name: user.name, image: user.image }, profile: profile || null, needsOnboarding: !profile });
  } catch (err) {
    logger.error({ err }, "Get me error");
    res.status(500).json({ error: "Failed" });
  }
});

router.post("/auth/onboarding", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { name, businessName, country, defaultCurrency, paymentTermsDays, niche, taxReservePercent, averageSponsorshipValue } = req.body;
    if (name) {
      await db.update(usersTable).set({ name, updatedAt: new Date() }).where(eq(usersTable.id, userId));
    }
    const existing = await db.select().from(creatorProfilesTable).where(eq(creatorProfilesTable.userId, userId)).limit(1);
    let profile;
    if (existing.length > 0) {
      [profile] = await db.update(creatorProfilesTable).set({ businessName, country, defaultCurrency: defaultCurrency || "USD", paymentTermsDays: paymentTermsDays || 30, niche, taxReservePercent: taxReservePercent || 30, averageSponsorshipValue: averageSponsorshipValue?.toString(), updatedAt: new Date() }).where(eq(creatorProfilesTable.userId, userId)).returning();
    } else {
      [profile] = await db.insert(creatorProfilesTable).values({ userId, businessName, country, defaultCurrency: defaultCurrency || "USD", paymentTermsDays: paymentTermsDays || 30, niche, taxReservePercent: taxReservePercent || 30, averageSponsorshipValue: averageSponsorshipValue?.toString() }).returning();
    }
    res.json({ id: profile.id, userId: profile.userId, businessName: profile.businessName, country: profile.country, defaultCurrency: profile.defaultCurrency, taxReservePercent: profile.taxReservePercent, paymentTermsDays: profile.paymentTermsDays, niche: profile.niche, subscriptionPlan: profile.subscriptionPlan });
  } catch (err) {
    logger.error({ err }, "Onboarding error");
    res.status(500).json({ error: "Onboarding failed" });
  }
});

// Google OAuth
router.get("/auth/google", (_req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) { res.status(503).json({ error: "Google OAuth not configured" }); return; }
  const domain = process.env.REPLIT_DEV_DOMAIN || "localhost";
  const redirectUri = `https://${domain}/api/auth/google/callback`;
  const scope = encodeURIComponent("openid email profile");
  const state = Math.random().toString(36).slice(2);
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}`);
});

router.get("/auth/google/callback", async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) { res.redirect("/?error=no_code"); return; }
    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const domain = process.env.REPLIT_DEV_DOMAIN || "localhost";
    const redirectUri = `https://${domain}/api/auth/google/callback`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code: code as string, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
    });
    const tokenData = await tokenRes.json() as any;
    if (!tokenData.access_token) { res.redirect("/login?error=oauth_failed"); return; }

    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: `Bearer ${tokenData.access_token}` } });
    const googleUser = await userRes.json() as any;

    let [user] = await db.select().from(usersTable).where(eq(usersTable.email, googleUser.email)).limit(1);
    if (!user) {
      [user] = await db.insert(usersTable).values({ email: googleUser.email, name: googleUser.name, image: googleUser.picture, emailVerified: new Date() }).returning();
    }
    const token = signToken(user.id);
    const [profile] = await db.select().from(creatorProfilesTable).where(eq(creatorProfilesTable.userId, user.id)).limit(1);
    const needsOnboarding = !profile;
    res.redirect(`/login?token=${token}&needsOnboarding=${needsOnboarding}`);
  } catch (err) {
    logger.error({ err }, "Google callback error");
    res.redirect("/login?error=oauth_failed");
  }
});

export default router;
