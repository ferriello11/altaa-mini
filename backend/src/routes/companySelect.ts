import { Router } from "express";
import { authSession } from "../middlewares/authSession";
import { CompanySelectController } from "../controllers/CompanySelectController";

const router = Router();
const controller = new CompanySelectController();

router.post("/:id/select", authSession, controller.select);

export default router;
