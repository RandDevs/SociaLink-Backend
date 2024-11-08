import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
	{
		profilePictPath: {
			type: String,
			default: "",
		},
		username: {
			type: String,
			default: "",
		},
		message: {
			type: String,
			default: "",
		},
	},
	{ timestamps: true } // Tambahkan timestamp jika Anda ingin menyimpan waktu pembuatan dan pembaruan komentar
);

const postSchema = new mongoose.Schema(
	{
		userId: {
			type: String,
			default: "",
		},
		displayName: {
			type: String,
			default: "",
		},
		picturePath: {
			type: String,
			default: "",
		},
		location: {
			type: String,
			default: "",
		},
		description: {
			type: String,
			default: "",
		},
		hashtags: {
			type: [String],
			default: [],
		},
		imagePath: {
			type: String,
			default: "",
		},
		likes: {
			type: Number, // Correct type for numbers
			default: 0,
			min: 0,
		},
		comments: {
			type: Array,
			default: [],
		},
		likedBy: {
			type: [String],
			default: [],
		},
	},
	{ timestamps: true }
);

const Post = mongoose.model("Post", postSchema);
export default Post;
