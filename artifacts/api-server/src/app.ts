import { createRequire } from "node:module";
import express from "express";
import cors from "cors";
import type { HttpLogger } from "pino-http";
import type { IncomingMessage, ServerResponse } from "node:http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const require = createRequire(import.meta.url);
const pinoHttp = require("pino-http") as typeof import("pino-http").default;

const app = express();

const httpLogger: HttpLogger = pinoHttp({
  logger,
  serializers: {
    req(req: IncomingMessage & { id?: string }) {
      return {
        id: req.id,
        method: req.method,
        url: req.url?.split("?")[0],
      };
    },
    res(res: ServerResponse) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
});

app.use(httpLogger);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Global error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    logger.error({ err }, "Unhandled request error");
    res.statusCode = 500;
    res.json({ error: "Internal server error" });
  }
);

export default app;
