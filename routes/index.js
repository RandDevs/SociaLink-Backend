import express from "express";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import postRoutes from "./postRoutes.js";
import searchRoutes from "./searchRoutes.js";

const router = express.Router();

// Use specific route files
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/posts", postRoutes);
router.use("/search", searchRoutes);
// router.use("/comments", commentRoutes);

export default router;
