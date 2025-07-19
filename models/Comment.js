import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxLength: 500,
    },
  },
  { timestamps: true } // Tambahkan timestamp jika Anda ingin menyimpan waktu pembuatan dan pembaruan komentar
);

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;
