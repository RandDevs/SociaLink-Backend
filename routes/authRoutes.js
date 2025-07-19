import express from "express";
import { signup, login, deleteAccount } from "../controllers/authController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Sign up route
router.post("/signup", signup);

// Log in route
router.post("/login", login);

// Delete account route
router.delete("/delete/:userId", authenticateToken, deleteAccount);

export default router;
