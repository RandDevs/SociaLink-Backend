import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
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

    const user = await User.create({ email, password });
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET
    );

    res.status(201).json({
      status: "success",
      msg: "Account created",
      accessToken,
      _id: user._id,
    });
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
    const passwordMatch = await user.matchPassword(password);
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

// ! DELETE ACCOUNT API
export const deleteAccount = async (req, res) => {
  const { userId } = req.params;
  const authenticatedUserId = req.user.userId;
  console.log(authenticatedUserId);

  try {
    if (userId !== authenticatedUserId) {
      return res.status(403).json({
        status: "error",
        msg: "Not authorized to delete this account",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: "error", msg: "User not found" });
    }

    await Post.deleteMany({ user: userId });
    await Comment.deleteMany({ user: userId });

    await User.updateMany(
      { followers: userId },
      { $pull: { followers: userId } }
    );
    await User.updateMany(
      { following: userId }, // Mengubah 'followings' menjadi 'following'
      { $pull: { following: userId } } // Mengubah 'followings' menjadi 'following'
    );

    // 5. Hapus notifikasi yang dikirim ke/dari user ini
    // (Jika ada model Notifikasi terpisah, ini akan lebih mudah)
    // await Notification.deleteMany({ $or: [{ recipient: userId }, { sender: userId }] });

    // --- AKHIR LOGIKA PENGHAPUSAN DATA TERKAIT ---

    // Akhirnya, hapus akun user itu sendiri
    await User.findByIdAndDelete(userId);

    res
      .status(200)
      .json({ status: "success", msg: "Account deleted successfully!" });
    // 5. Hapus notifikasi yang dikirim ke/dari user ini
    // (Jika ada model Notifikasi terpisah, ini akan lebih mudah)
    // await Notification.deleteMany({ $or: [{ recipient: userId }, { sender: userId }] });

    // --- AKHIR LOGIKA PENGHAPUSAN DATA TERKAIT ---

    // Akhirnya, hapus akun user itu sendiri
    await User.findByIdAndDelete(userId);

    res
      .status(200)
      .json({ status: "success", msg: "Account deleted successfully!" });
  } catch {
    {
      console.error(err.message);
      res.status(500).json({ status: "error", msg: "Internal server error!" });
    }
  }
};
