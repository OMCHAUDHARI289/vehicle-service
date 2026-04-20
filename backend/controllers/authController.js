import bcrypt from "bcryptjs";
import { createToken, removeToken } from "../config/tokenStore.js";
import { createUser, findUserByEmail, findUserById } from "../models/userModel.js";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await createUser(name, email, hashedPassword);
    const user = await findUserById(userId);

    req.session.user = user;
    const token = createToken(user);

    return res.status(201).json({
      message: "User registered successfully",
      user,
      token
    });
  } catch (error) {
    return res.status(500).json({ message: "Registration failed", error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const loggedInUser = {
      id: user.id,
      name: user.name,
      email: user.email
    };
    req.session.user = loggedInUser;
    const token = createToken(loggedInUser);

    return res.status(200).json({
      message: "Login successful",
      user: loggedInUser,
      token
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed", error: error.message });
  }
};

export const logoutUser = async (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  removeToken(token);

  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({ message: "Logout failed", error: error.message });
    }

    res.clearCookie("connect.sid");
    return res.status(200).json({ message: "Logout successful" });
  });
};
