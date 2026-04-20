import { getUserByToken } from "../config/tokenStore.js";

const authMiddleware = (req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const user = getUserByToken(token);

  if (!user) {
    return res.status(401).json({ message: "Please login first" });
  }

  req.user = user;
  next();
};

export default authMiddleware;
