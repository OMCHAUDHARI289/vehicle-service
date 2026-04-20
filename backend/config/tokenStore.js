import crypto from "crypto";

const tokens = new Map();

export const createToken = (user) => {
  const token = crypto.randomBytes(32).toString("hex");
  tokens.set(token, user);
  return token;
};

export const getUserByToken = (token) => {
  if (!token) return null;
  return tokens.get(token);
};

export const removeToken = (token) => {
  if (token) tokens.delete(token);
};
