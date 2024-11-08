import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
	const authHeader = req.header("Authorization");
	const token = authHeader && authHeader.split(" ")[1];

	if (token == null)
		return res.status(401).json({ status: "error", msg: "Unauthorized" });

	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
		if (err) return res.status(403).json({ status: "error", msg: "Forbidden" });
		req.user = user;
		next();
	});
};
