import { Router } from "express";
import { authSession } from "../middlewares/authSession";
import { AuthController } from "../controllers/AuthController";

const router = Router();
const controller = new AuthController();

router.post("/signup", controller.signup);
router.post("/login", controller.login);
router.post("/logout", controller.logout);

router.get("/me", authSession, controller.me);
router.get("/invites", authSession, controller.invites);

router.post("/accept-invite", authSession, controller.acceptInvite);
router.get("/session", authSession, controller.session);

export default router;
