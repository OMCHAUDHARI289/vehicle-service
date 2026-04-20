import express from "express";
import {
  createVehicle,
  deleteVehicle,
  getMyVehicles
} from "../controllers/vehicleController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/add", authMiddleware, createVehicle);
router.get("/my", authMiddleware, getMyVehicles);
router.delete("/:id", authMiddleware, deleteVehicle);

export default router;
