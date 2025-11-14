import { Router } from "express";
import { authSession } from "../middlewares/authSession";
import { companyScope } from "../middlewares/companyScope";
import { requireRole } from "../middlewares/roleGuard";
import multer from "multer";

import { CompanyController } from "../controllers/CompanyController";
import { CompanyInviteController } from "../controllers/CompanyInviteController";

const router = Router();
const upload = multer();

const controller = new CompanyController();
const inviteController = new CompanyInviteController();

router.get(
  "/active",
  authSession,
  companyScope,
  controller.getActive
);

router.put(
  "/:id",
  authSession,
  companyScope,
  requireRole("ADMIN", "OWNER"),
  upload.single("logo"),
  controller.update
);

router.delete(
  "/:id",
  authSession,
  companyScope,
  requireRole("OWNER"),
  controller.delete
);

router.post(
  "/:id/invite",
  authSession,
  companyScope,
  requireRole("ADMIN", "OWNER"),
  inviteController.createInvite
);

export default router;
