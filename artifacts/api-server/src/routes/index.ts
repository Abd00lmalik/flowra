import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import dashboardRouter from "./dashboard.js";
import contractsRouter from "./contracts.js";
import milestonesRouter from "./milestones.js";
import invoicesRouter from "./invoices.js";
import taxRouter from "./tax.js";
import performanceRouter from "./performance.js";
import sentimentRouter from "./sentiment.js";
import youtubeRouter from "./youtube.js";
import tiktokRouter from "./tiktok.js";
import notionRouter from "./notion.js";
import settingsRouter from "./settings.js";
import billingRouter from "./billing.js";
import cronRouter from "./cron.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(dashboardRouter);
router.use(contractsRouter);
router.use(milestonesRouter);
router.use(invoicesRouter);
router.use(taxRouter);
router.use(performanceRouter);
router.use(sentimentRouter);
router.use(youtubeRouter);
router.use(tiktokRouter);
router.use(notionRouter);
router.use(settingsRouter);
router.use(billingRouter);
router.use(cronRouter);

export default router;
