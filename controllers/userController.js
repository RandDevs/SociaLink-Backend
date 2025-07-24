import Post from "../models/Post.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import Comment from "../models/Comment.js"; // Import Comment
import isEmail from "../functions/isEmail.js";
// import Notification from "../models/Notification.js"; // Akan kita import jika sudah ada model Notifikasi terpisah
import fs from "fs";
import path from "path";
// * UPLOADS HANDLER
export const uploadProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.body._id);
    if (!user)
      return res.status(404).json({ status: "error", msg: "User not found" });

    const picturePath = req.file.path;
    await User.updateOne({ _id: req.body._id }, { $set: { picturePath } });

    res.status(200).json({ status: "success", picturePath });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", msg: "Internal server error" });
  }
};

export const uploadBanner = async (req, res) => {
  try {
    const user = await User.findById(req.body._id);
    if (!user)
      return res.status(404).json({ status: "error", msg: "User not found" });

    const bannerPath = req.file.path;
    await User.updateOne({ _id: req.body._id }, { $set: { bannerPath } });

    res.status(200).json({ status: "success", bannerPath });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", msg: "Internal server error" });
  }
};

// * CREATE USER PROFILE
export const createUserProfile = async (req, res) => {
  try {
    const { displayName, location, bio } = req.body;
    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ status: "error", msg: "User not found" });

    // Check for duplicate display name
    const duplicateDisplayName = await User.findOne({
      displayName,
      _id: { $ne: userId },
    });
    if (duplicateDisplayName) {
      return res
        .status(409)
        .json({ status: "warn", msg: "Display Name already in use" });
    }

    if (displayName.length > 20) {
      return res
        .status(400)
        .json({ status: "warn", msg: "Display name is too long" });
    }

    if (location && location.length >= 25) {
      return res
        .status(400)
        .json({ status: "warn", msg: "Location is too long" });
    }

    if (bio && bio.length >= 200) {
      return res.status(400).json({ status: "warn", msg: "Bio is too long" });
    }

    // Update fields only if they are provided
    const updateFields = {};
    if (displayName !== undefined) updateFields.displayName = displayName;
    if (location !== undefined) updateFields.location = location;
    if (bio !== undefined) updateFields.bio = bio;

    await User.updateOne({ _id: userId }, { $set: updateFields });

    const accessToken = jwt.sign(
      { userId: _id },
      process.env.ACCESS_TOKEN_SECRET
    );
    const updatedUser = await User.findById(userId).select("-password");

    res.status(200).json({
      status: "success",
      msg: "Profile updated",
      userId: updatedUser._id,
      accessToken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", msg: "Internal server error" });
  }
};

// * UPDATE USER PROFILE (Rute baru untuk PUT /api/users/profile)
export const updateUserProfile = async (req, res) => {
  try {
    const { displayName, location, bio, email, password } = req.body;
    const userId = req.user.userId; // Dari authenticateToken

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: "error", msg: "User not found" });
    }

    // Validasi dan update fields
    if (email && email !== user.email) {
      if (!isEmail(email)) {
        return res
          .status(400)
          .json({ status: "error", msg: "Invalid email format" });
      }
      const duplicateUser = await User.findOne({ email, _id: { $ne: userId } });
      if (duplicateUser) {
        return res
          .status(409)
          .json({ status: "warn", msg: "Email already exists" });
      }
      user.email = email;
    }

    if (password) {
      // Password akan dihash otomatis oleh pre('save') hook
      if (password.length < 8 || password.length > 64) {
        return res.status(400).json({
          status: "error",
          msg: "Password must be between 8 and 64 characters",
        });
      }
      user.password = password;
    }

    if (displayName) {
      const duplicateDisplayName = await User.findOne({
        displayName,
        _id: { $ne: userId },
      });
      if (duplicateDisplayName) {
        return res
          .status(409)
          .json({ status: "warn", msg: "Display Name already in use" });
      }
      user.displayName = displayName;
    }

    if (location !== undefined) user.location = location; // Izinkan string kosong
    if (bio !== undefined) user.bio = bio; // Izinkan string kosong

    const updatedUser = await user.save(); // Panggil save() agar pre-save hook hashing password berjalan

    res.status(200).json({
      status: "success",
      msg: "Profile updated",
      user: updatedUser.toObject({
        getters: true,
        virtuals: false,
        transform: (doc, ret) => {
          delete ret.password;
          return ret;
        },
      }), // Hapus password dari respon
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", msg: "Internal server error" });
  }
};

// * GET USER INFO
export const getUserProfile = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId)
      .select("-password")
      .populate("followers", "displayName picturePath")
      .populate("following", "displayName picturePath");

    if (!user) {
      throw res.status(404).json({ status: "error", msg: "User not found" });
    }
    const userPosts = await Post.find({ userId })
      .populate("user", "displayName picturePath") // Populate user di post
      .populate({
        // Populate comments dan user di dalam komentar
        path: "comments",
        populate: {
          path: "user",
          select: "displayName picturePath",
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      user: {
        _id: user._id,
        email: user.email,
        displayName: user.displayName,
        bio: user.bio,
        location: user.location,
        picturePath: user.picturePath,
        bannerPath: user.bannerPath,
        followers: user.followers,
        following: user.following,
        postCount: userPosts.length, // Tambahkan jumlah post
      },
      userPosts, // Kirim posts terpisah
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ status: "error", msg: "Internal server error" });
  }
};

// ! WE STRANDED HERE --  WE BEGIN TONIGHT
export const getNotifications = async (req, res) => {
  const { userId } = req.user.userId;
  try {
    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ status: "error", msg: "User not found" });

    res.status(200).json({ notifications: user.notifications });
  } catch (err) {
    res.status(500).json({ status: "error", msg: "Internal server error" });
  }
};

export const getNewestUser = async (req, res) => {
  const { limit } = req.query;

  try {
    const users = await User.find({ displayName: { $exists: true, $ne: null } })
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    res.status(200).json({ users });
  } catch (err) {
    res.status(500).json({ status: "error", msg: "Internal serever error" });
  }
};

// * FOLLOW HANDLER
export const handleFollow = async (req, res) => {
  const { userId, targetUserId } = req.params;
  try {
    const user = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);

    if (!user || !targetUser) {
      throw new Error("User not found");
    }

    // Send notification
    if (!targetUser.followers.includes(userId)) {
      targetUser.followers.push(userId);

      targetUser.notifications.push({
        picturePath: user.picturePath,
        displayName: user.displayName,
        notification: "following you",
        date: new Date(),
        type: "follow",
        state: "unread",
      });
      await targetUser.save();
    }

    if (!user.followings.includes(targetUser._id)) {
      user.followings.push(targetUser._id);
      await user.save();
    }

    res.status(200).json({ status: "success", msg: "Succeded to follow" });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ status: "error", msg: "Error" });
  }
};

export const handleUnfollow = async (req, res) => {
  const { userId, targetUserId } = req.params;
  try {
    const user = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);

    if (!user || !targetUser) {
      throw new Error("User not found");
    }

    // remove followings
    const indexUser = user.followings.indexOf(targetUserId);
    if (indexUser > -1) {
      user.followings.splice(indexUser, 1);
      await user.save();
      console.log("remove followings");
    }

    // remove followers for target user
    const indexTargetUser = targetUser.followers.indexOf(userId);
    if (indexTargetUser > -1) {
      targetUser.followers.splice(indexTargetUser, 1);
      await targetUser.save();
      console.log("remove followers");
    }

    console.log("hitted");
    res.status(200).json({ status: "success", msg: "Succeded to unfollow" });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ status: "error", msg: err.message });
  }
};

// ! DELETE ACCOUNT API
export const handleDeleteAccount = async (req, res) => {
  const { userId } = req.params;
  console.log(req.params);
  try {
    const user = await User.findById(userId);
    const userPosts = await Post.find({ userId: userId });

    if (!user) {
      throw new Error("User not found");
    }

    // // Delete the image file if it exists
    // if (user.picturePath) {
    // 	const picturePath = path.join(__dirname, user.imagePath);
    // 	fs.unlink(picturePath, (err) => {
    // 		if (err) {
    // 			console.error("Error deleting the image:", err);
    // 			throw new Error("Error deleting your account!");
    // 		} else {
    // 			console.log("Image deleted successfully");
    // 		}
    // 	});
    // }

    // await User.findByIdAndDelete(userId);
    res
      .status(200)
      .json({ status: "success", msg: "Account deleted!", userPosts });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ status: "error", msg: "Internal server error!" });
  }
};
