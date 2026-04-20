import pool from "../config/db.js";

export const addService = async (service) => {
  const { userId, vehicleId, serviceType, customServiceType, cost, date, notes } = service;

  const [result] = await pool.query(
    `INSERT INTO services (user_id, vehicle_id, service_type, custom_service_type, cost, date, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, vehicleId, serviceType, customServiceType || null, cost, date, notes]
  );

  return result.insertId;
};

export const getServicesByVehicleId = async (vehicleId, userId) => {
  const [rows] = await pool.query(
    `SELECT * FROM services
     WHERE vehicle_id = ? AND user_id = ?
     ORDER BY date DESC, id DESC`,
    [vehicleId, userId]
  );

  return rows;
};

export const getLastServiceByVehicleId = async (vehicleId, userId) => {
  const [rows] = await pool.query(
    `SELECT * FROM services
     WHERE vehicle_id = ? AND user_id = ?
     ORDER BY date DESC, id DESC
     LIMIT 1`,
    [vehicleId, userId]
  );

  return rows[0];
};
