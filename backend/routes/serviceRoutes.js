import express from "express";
import {
  createService,
  getLastVehicleService,
  getVehicleServices
} from "../controllers/serviceController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/add", authMiddleware, createService);
router.get("/last/:vehicleId", authMiddleware, getLastVehicleService);
router.get("/:vehicleId", authMiddleware, getVehicleServices);

export default router;
