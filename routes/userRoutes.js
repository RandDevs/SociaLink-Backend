import express from "express";
import {
  createUserProfile,
  uploadProfilePicture,
  uploadBanner,
  getNotifications,
  getUserProfile,
  handleFollow,
  handleUnfollow,
  getNewestUser,
  updateUserProfile,
} from "../controllers/userController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import {
  uploadProfilePict,
  uploadBanner as bannerUpload,
} from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Create user profile route
router.post("/createUserProfile", authenticateToken, createUserProfile);

router.post(
  "/upload-profile-pict",
  authenticateToken,
  uploadProfilePict.single("profilePict"),
  uploadProfilePicture
);

router.post(
  "/upload-banner",
  authenticateToken,
  bannerUpload.single("banner"),
  uploadBanner
);

// Update User Profile
router.put("/profile", authenticateToken, updateUserProfile);

// Get newest user
router.get("/newest", getNewestUser);

// Notification page
router.get("/notifications", authenticateToken, getNotifications);
// User profile page
router.get("/:userId", getUserProfile);

// handle follow
router.post("/:targetUserId/follow", handleFollow);
router.post("/:targetUserId/unfollow", handleUnfollow);

export default router;
