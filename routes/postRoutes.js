import express from "express";
import {
	createPost,
	getPosts,
	likePost,
	unlikePost,
	getComments,
	addComment,
} from "../controllers/postController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { uploadPost } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Create post route
router.post(
	"/create",
	authenticateToken,
	uploadPost.single("image"),
	createPost
);

// Get posts route
router.get("/get", getPosts);

// Like a post route
router.post("/:postId/like", likePost);

// Unlike a post route
router.post("/:postId/unlike", unlikePost);

router.post("/:postId/get/comments", getComments);

router.post("/:postId/add/comment", addComment);

export default router;
