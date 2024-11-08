import express from "express";
import {
	createUserProfile,
	uploadProfilePicture,
	uploadBanner,
	getNotifications,
	getUserProfile,
	handleFollow,
	handleUnfollow,
	handleDeleteAccount,
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
	uploadProfilePict.single("profilePict"),
	uploadProfilePicture
);

router.post("/upload-banner", bannerUpload.single("banner"), uploadBanner);

// Notification page
router.post("/get/notifications", authenticateToken, getNotifications);

// User profile page
router.post("/get/userProfile", authenticateToken, getUserProfile);

// handle follow
router.post("/:userId/follow/:targetUserId", handleFollow);
router.post("/:userId/unfollow/:targetUserId", handleUnfollow);

// ! Delete account
router.post("/delete/:userId", handleDeleteAccount);

export default router;