import { Router } from "express";
import { db } from "@workspace/db";
import { rulesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListRulesQueryParams,
  GetRuleParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/rules", async (req, res) => {
  const query = ListRulesQueryParams.safeParse(req.query);
  let rules = await db.select().from(rulesTable).orderBy(rulesTable.id);

  if (query.success && query.data.category) {
    rules = rules.filter((r) => r.category === query.data.category);
  }

  res.json(rules);
});

router.get("/rules/:id", async (req, res) => {
  const params = GetRuleParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [rule] = await db.select().from(rulesTable).where(eq(rulesTable.id, params.data.id));
  if (!rule) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(rule);
});

export default router;
