// config/config.js
import dotenv from "dotenv";

dotenv.config();

export default {
	port: process.env.PORT || 3000,
	accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
	// Add more configurations as needed
};
