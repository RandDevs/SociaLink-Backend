import express from "express";
import {
  searchUsers,
  searchHashtags,
} from "../controllers/searchController.js";

const router = express.Router();

router.get("/users", searchUsers);
router.get("/hashtags", searchHashtags);

export default router;
