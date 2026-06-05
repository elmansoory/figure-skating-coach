import { Router, type IRouter } from "express";
import healthRouter from "./health";
import athletesRouter from "./athletes";
import sessionsRouter from "./sessions";
import elementsRouter from "./elements";
import trainingRouter from "./training";
import rulesRouter from "./rules";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(athletesRouter);
router.use(sessionsRouter);
router.use(elementsRouter);
router.use(trainingRouter);
router.use(rulesRouter);
router.use(dashboardRouter);

export default router;
