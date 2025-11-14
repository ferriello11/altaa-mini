import { Router } from "express";
import { authSession } from "../middlewares/authSession";
import { companyScope } from "../middlewares/companyScope";
import { requireRole } from "../middlewares/roleGuard";

import { MembersController } from "../controllers/MembersController";

const router = Router();
const controller = new MembersController();

router.get(
  "/:id/members",
  authSession,
  companyScope,
  requireRole("ADMIN", "OWNER", "MEMBER"),
  controller.list
);

router.put(
  "/:id/members/:memberId",
  authSession,
  companyScope,
  requireRole("ADMIN", "OWNER"),
  controller.updateRole
);

router.delete(
  "/:id/members/:memberId",
  authSession,
  companyScope,
  requireRole("ADMIN", "OWNER"),
  controller.remove
);

export default router;
