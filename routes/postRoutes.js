import express from "express";
import {
  createPost,
  getPosts,
  getPostById,
  likePost,
  unlikePost,
  addComment,
  deleteComment,
  deletePost,
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

// Get single post by Id
router.get("/:postId", getPostById);

// Get posts route
router.get("/", getPosts);

// Like a post route
router.post("/:postId/like", authenticateToken, likePost);

// Unlike a post route
router.post("/:postId/unlike", authenticateToken, unlikePost);

// router.post("/:postId/get/comments", getComments);

router.post("/:postId/comment", addComment);

// Delete a comment
router.delete("/:postId/comments/:commentId", authenticateToken, deletePost);

// Delete a post
router.delete("/:postId", authenticateToken, deletePost);

export default router;
