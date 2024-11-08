import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import isEmail from "../functions/isEmail.js";
// User sign-up controller
export const signup = async (req, res) => {
	try {
		const { email, password } = req.body;

		// Check if the email is already in use
		const duplicateUser = await User.findOne({ email });
		if (duplicateUser) {
			return res
				.status(409)
				.json({ status: "error", msg: "Email already exists" });
		}

		// Validate email format
		if (!isEmail(email)) {
			return res
				.status(400)
				.json({ status: "error", msg: "Invalid email format" });
		}

		// Check password length
		if (password.length < 8 || password.length > 64) {
			return res.status(400).json({
				status: "error",
				msg: "Password must be between 8 and 64 characters",
			});
		}

		// Hash the password and create the user
		const hashedPassword = await bcrypt.hash(password, 10);
		await User.create({ email, password: hashedPassword });

		res.status(201).json({ status: "success", msg: "Account created" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ status: "error", msg: "Internal server error" });
	}
};

// User login controller
export const login = async (req, res) => {
	try {
		const { email, password } = req.body;

		// Check if the user exists
		const user = await User.findOne({ email });
		if (!user)
			return res.status(404).json({ status: "error", msg: "Invalid email" });

		// Compare passwords
		const passwordMatch = await bcrypt.compare(password, user.password);
		if (passwordMatch) {
			const accessToken = jwt.sign(
				{ userId: user._id },
				process.env.ACCESS_TOKEN_SECRET
			);
			return res.status(200).json({
				status: "success",
				msg: "Login succeeded",
				accessToken,
				_id: user._id,
				displayName: user.displayName,
				picturePath: user.picturePath,
			});
		} else {
			return res.status(401).json({ status: "error", msg: "Invalid password" });
		}
	} catch (error) {
		console.error(error);
		res.status(500).json({ status: "error", msg: "Internal server error" });
	}
};
