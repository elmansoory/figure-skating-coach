import express, { type Express, type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Postgres foreign_key_violation: the body references an athlete or session that doesn't exist.
const FOREIGN_KEY_VIOLATION = "23503";

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  const pgError = (err as { cause?: { code?: string } })?.cause ?? err;
  if ((pgError as { code?: string })?.code === FOREIGN_KEY_VIOLATION) {
    res.status(400).json({ error: "Referenced athlete or session does not exist" });
    return;
  }
  next(err);
});

export default app;
