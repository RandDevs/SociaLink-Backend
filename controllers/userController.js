import Post from "../models/Post.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
// * UPLOADS HANDLER
export const uploadProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.body._id);
    if (!user) return res.status(404).json({ status: "error", msg: "User not found" });

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
    if (!user) return res.status(404).json({ status: "error", msg: "User not found" });

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
    const { _id, displayName, location, bio } = req.body;

    const user = await User.findById(_id);
    if (!user) return res.status(404).json({ status: "error", msg: "User not found" });

    // Check for duplicate display name
    const duplicateDisplayName = await User.findOne({ displayName });
    if (duplicateDisplayName) {
      return res.status(409).json({ status: "warn", msg: "Display Name already in use" });
    }

    if (displayName.length > 20) {
      return res.status(409).json({ status: "warn", msg: "Display name is too long" });
    }

    if (location.length >= 25) {
      return res.status(409).json({ status: "warn", msg: "Location is too long" });
    }

    if (bio.length >= 200) {
      return res.status(409).json({ status: "warn", msg: "Bio is too long" });
    }

    await User.updateOne({ _id }, { $set: { displayName, location, bio } });

    const accessToken = jwt.sign({ userId: _id }, process.env.ACCESS_TOKEN_SECRET);

    res.status(200).json({
      status: "success",
      msg: "Profile updated",
      _id,
      accessToken,
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
    const user = await User.findById(userId);
    const userPosts = await Post.find({ userId });

    if (!user) {
      throw new Error("User not found");
    }

    res.status(200).json({ user, userPosts });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ status: "error", msg: "Error" });
  }
};

export const getNotifications = async (req, res) => {
  const { userId } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ status: "error", msg: "User not found" });

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
    res.status(200).json({ status: "success", msg: "Account deleted!", userPosts });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ status: "error", msg: "Internal server error!" });
  }
};
