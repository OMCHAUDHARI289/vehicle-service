import {
  addService,
  getLastServiceByVehicleId,
  getServicesByVehicleId
} from "../models/serviceModel.js";
import { getVehicleByIdAndUserId } from "../models/vehicleModel.js";

export const createService = async (req, res) => {
  try {
    const { vehicle_id, service_type, custom_service_type, cost, date, notes } = req.body;
    const parsedCost = Number(cost);

    if (!vehicle_id || !service_type || Number.isNaN(parsedCost) || !date) {
      return res.status(400).json({
        message: "Vehicle, service type, cost and date are required"
      });
    }

    if (parsedCost < 0) {
      return res.status(400).json({
        message: "Cost cannot be negative"
      });
    }

    // If service type is "Other", custom_service_type is required
    if (service_type === "Other" && !custom_service_type) {
      return res.status(400).json({
        message: "Please enter a custom service type"
      });
    }

    const vehicle = await getVehicleByIdAndUserId(vehicle_id, req.user.id);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    const serviceId = await addService({
      userId: req.user.id,
      vehicleId: vehicle_id,
      serviceType: service_type,
      customServiceType: custom_service_type || null,
      cost: parsedCost,
      date,
      notes: notes || null
    });

    return res.status(201).json({
      message: "Service added successfully",
      serviceId
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to add service", error: error.message });
  }
};

export const getVehicleServices = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const vehicle = await getVehicleByIdAndUserId(vehicleId, req.user.id);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    const services = await getServicesByVehicleId(vehicleId, req.user.id);

    return res.status(200).json({
      message: "Services fetched successfully",
      services
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch services", error: error.message });
  }
};

export const getLastVehicleService = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const vehicle = await getVehicleByIdAndUserId(vehicleId, req.user.id);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    const service = await getLastServiceByVehicleId(vehicleId, req.user.id);
    if (!service) {
      return res.status(404).json({ message: "No service found for this vehicle" });
    }

    return res.status(200).json({
      message: "Last service fetched successfully",
      service
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch last service", error: error.message });
  }
};
