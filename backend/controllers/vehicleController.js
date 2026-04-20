import {
  addVehicle,
  deleteVehicleByIdAndUserId,
  getVehicleByIdAndUserId,
  getVehiclesByUserId
} from "../models/vehicleModel.js";

export const createVehicle = async (req, res) => {
  try {
    const { name, model, number, type, purchase_date } = req.body;

    if (!name || !model || !number || !type) {
      return res.status(400).json({ message: "Name, model, plate number and type are required" });
    }

    const vehicleId = await addVehicle({
      userId: req.user.id,
      name,
      model,
      number,
      type,
      purchaseDate: purchase_date
    });

    return res.status(201).json({
      message: "Vehicle added successfully",
      vehicleId
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to add vehicle", error: error.message });
  }
};

export const getMyVehicles = async (req, res) => {
  try {
    const vehicles = await getVehiclesByUserId(req.user.id);

    return res.status(200).json({
      message: "Vehicles fetched successfully",
      vehicles
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch vehicles", error: error.message });
  }
};

export const deleteVehicle = async (req, res) => {
  try {
    const vehicleId = req.params.id;

    const vehicle = await getVehicleByIdAndUserId(vehicleId, req.user.id);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    await deleteVehicleByIdAndUserId(vehicleId, req.user.id);

    return res.status(200).json({ message: "Vehicle deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete vehicle", error: error.message });
  }
};
