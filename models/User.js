import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			required: true,
		},
		password: {
			type: String,
			required: true,
		},
		displayName: {
			type: String,
			default: "",
		},
		bio: {
			type: String,
			default: "",
		},
		location: {
			type: String,
			default: "",
		},
		picturePath: {
			type: String,
			default: "",
		},
		bannerPath: {
			type: String,
			default: "",
		},
		notifications: {
			type: Array,
			default: [],
		},
		followers: {
			type: [String],
			default: [],
		},
		followings: {
			type: [String],
			default: [],
		},
	},
	{ timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
