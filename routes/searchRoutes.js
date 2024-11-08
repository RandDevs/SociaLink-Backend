import express from "express";
import {
	searchUsers,
	searchHashtags,
} from "../controllers/searchController.js";

const router = express.Router();

router.post("/users", searchUsers);
router.post("/hashtags", searchHashtags);

export default router;
