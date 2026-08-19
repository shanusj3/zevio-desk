import { Router } from "express";
import { catalogController } from "./catalog.controller.js";

const router = Router();

router.get("/search", catalogController.search);
router.get("/items", catalogController.getItems);

export default router;
