import pool from "../config/db.js";

export const addVehicle = async (vehicle) => {
  const { userId, customerName, customerEmail, name, model, number, type, purchaseDate } = vehicle;

  const [result] = await pool.query(
    `INSERT INTO vehicles (user_id, customer_name, customer_email, name, model, number, type, purchase_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, customerName, customerEmail, name, model, number, type, purchaseDate]
  );

  return result.insertId;
};

export const getVehiclesByUserId = async (userId) => {
  const [rows] = await pool.query(
    "SELECT * FROM vehicles WHERE user_id = ? ORDER BY id DESC",
    [userId]
  );

  return rows;
};

export const getVehicleByIdAndUserId = async (id, userId) => {
  const [rows] = await pool.query(
    "SELECT * FROM vehicles WHERE id = ? AND user_id = ?",
    [id, userId]
  );

  return rows[0];
};

export const deleteVehicleByIdAndUserId = async (id, userId) => {
  const [result] = await pool.query(
    "DELETE FROM vehicles WHERE id = ? AND user_id = ?",
    [id, userId]
  );

  return result.affectedRows;
};
