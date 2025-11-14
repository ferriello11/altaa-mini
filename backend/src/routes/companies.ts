import { Router } from "express";
import { authSession } from "../middlewares/authSession";
import multer from "multer";
import { CompanyController } from "../controllers/CompaniesController";

const router = Router();
const upload = multer();

const controller = new CompanyController();

router.post("/", authSession, upload.single("logo"), controller.create);
router.get("/", authSession, controller.list);

export default router;
