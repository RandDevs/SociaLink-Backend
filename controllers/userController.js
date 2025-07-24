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
    // userId dari authenticateToken middleware
    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ status: "error", msg: "User not found" });

    // Hapus gambar profil lama jika ada dan bukan default
    if (
      user.picturePath &&
      user.picturePath !== "https://via.placeholder.com/150"
    ) {
      const oldPicturePath = path.join(__dirname, "..", user.picturePath); // Asumsi path relatif dari server root
      if (fs.existsSync(oldPicturePath)) {
        fs.unlinkSync(oldPicturePath);
      }
    }

    const picturePath = req.file
      ? req.file.path.replace(/\\/g, "/")
      : user.picturePath; // Normalize path
    await User.updateOne({ _id: userId }, { $set: { picturePath } });

    res.status(200).json({ status: "success", picturePath });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", msg: "Internal server error" });
  }
};

export const uploadBanner = async (req, res) => {
  try {
    const userId = req.user.userId; // userId dari authenticateToken middleware
    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ status: "error", msg: "User not found" });

    // Hapus banner lama jika ada
    if (user.bannerPath) {
      const oldBannerPath = path.join(__dirname, "..", user.bannerPath); // Asumsi path relatif dari server root
      if (fs.existsSync(oldBannerPath)) {
        fs.unlinkSync(oldBannerPath);
      }
    }

    const bannerPath = req.file
      ? req.file.path.replace(/\\/g, "/")
      : user.bannerPath; // Normalize path
    await User.updateOne({ _id: userId }, { $set: { bannerPath } });

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

export const getNotifications = async (req, res) => {
  const { userId } = req.user.userId;
  try {
    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ status: "error", msg: "User not found" });
    // const notifications = await Notification.find({ recipient: userId }).populate('sender', 'displayName picturePath').sort({ createdAt: -1 });
    res.status(200).json({ notifications: user.notifications });
  } catch (err) {
    res.status(500).json({ status: "error", msg: "Internal server error" });
  }
};

export const getNewestUser = async (req, res) => {
  const { limit = 5 } = req.query;

  try {
    const users = await User.find({
      displayName: { $exists: true, $ne: null, $ne: "" },
    })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .select("-password");
    res.status(200).json({ users });
  } catch (err) {
    res.status(500).json({ status: "error", msg: "Internal serever error" });
  }
};

// * FOLLOW HANDLER
export const handleFollow = async (req, res) => {
  const { targetUserId } = req.params;
  const userId = req.user.userId;
  try {
    const user = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);

    if (!user || !targetUser) {
      return res.status(404).json({ status: "error", msg: "User not found" });
    }

    if (user._id.toString() === targetUser._id.toString()) {
      return res
        .status(400)
        .json({ status: "error", msg: "You cannot follow yourself" });
    }

    // Send notification
    // if (!targetUser.followers.includes(userId)) {
    //   targetUser.followers.push(userId);

    //   targetUser.notifications.push({
    //     picturePath: user.picturePath,
    //     displayName: user.displayName,
    //     notification: "following you",
    //     date: new Date(),
    //     type: "follow",
    //     state: "unread",
    //   });
    //   await targetUser.save();
    // }

    // Tambahkan ke followers targetUser jika belum ada
    if (!targetUser.followers.includes(userId)) {
      targetUser.followers.push(userId);
      // Trigger notifikasi jika ada model Notification terpisah
      await Notification.create({
        recipient: targetUserId,
        sender: userId,
        type: "follow",
        content: `${user.displayName} started following you.`,
        link: `/profile/${userId}`,
      });
    }

    // Tambahkan ke following user yang login jika belum ada
    if (!user.following.includes(targetUserId)) {
      user.following.push(targetUserId);
    }

    await user.save();
    await targetUser.save();

    res.status(200).json({ status: "success", msg: "Succeded to follow" });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ status: "error", msg: "Internal server error" });
  }
};

export const handleUnfollow = async (req, res) => {
  const { targetUserId } = req.params;
  const userId = req.user.userId;
  try {
    const user = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);

    if (!user || !targetUser) {
      return res.status(404).json({ status: "error", msg: "User not found" });
    }

    if (user._id.toString() === targetUser._id.toString()) {
      return res
        .status(400)
        .json({ status: "error", msg: "You cannot unfollow yourself" });
    }

    // remove followings
    // Hapus dari followers targetUser
    targetUser.followers = targetUser.followers.filter(
      (followerId) => followerId.toString() !== userId.toString()
    );

    // remove followers for target user
    user.following = user.following.filter(
      // Mengubah 'followings' menjadi 'following'
      (followingId) => followingId.toString() !== targetUserId.toString()
    );

    await user.save();
    await targetUser.save();

    console.log("hitted");
    res.status(200).json({ status: "success", msg: "Succeded to unfollow" });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ status: "error", msg: err.message });
  }
};

// // ! DELETE ACCOUNT API
// export const handleDeleteAccount = async (req, res) => {
//   const { userId } = req.params;
//   console.log(req.params);
//   try {
//     const user = await User.findById(userId);
//     const userPosts = await Post.find({ userId: userId });

//     if (!user) {
//       throw new Error("User not found");
//     }

//     // // Delete the image file if it exists
//     // if (user.picturePath) {
//     // 	const picturePath = path.join(__dirname, user.imagePath);
//     // 	fs.unlink(picturePath, (err) => {
//     // 		if (err) {
//     // 			console.error("Error deleting the image:", err);
//     // 			throw new Error("Error deleting your account!");
//     // 		} else {
//     // 			console.log("Image deleted successfully");
//     // 		}
//     // 	});
//     // }

//     // await User.findByIdAndDelete(userId);
//     res
//       .status(200)
//       .json({ status: "success", msg: "Account deleted!", userPosts });
//   } catch (err) {
//     console.log(err.message);
//     res.status(500).json({ status: "error", msg: "Internal server error!" });
//   }
// };
