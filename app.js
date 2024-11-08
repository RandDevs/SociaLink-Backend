import express from "express";
import cors from "cors";
import dotenv from "dotenv/config";
import "./utils/db.js";
import router from "./routes/index.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(express.json());
app.use(express.static("public"));
app.use(cors());

// Route setup
app.use("/api", router);

// Server listening
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
