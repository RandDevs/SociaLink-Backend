import User from "../models/User.js";
import Post from "../models/Post.js";

export const searchUsers = async (req, res) => {
  const { userId, displayName, limit, skipUser } = req.body;

  try {
    const users = await User.find({
      displayName: { $regex: displayName, $options: "i" },
      _id: { $ne: userId },
    })
      .select("displayName location followers picturePath")
      .limit(Number(limit))
      .skip(Number(skipUser));

    res.status(200).json({ users });
  } catch (err) {
    res.status(500).json({ status: "error", msg: "Internal serever error" });
  }
};

export const searchHashtags = async (req, res) => {
  const { hashtag, limit, skipPost } = req.body;
  console.log(hashtag);

  try {
    const posts = await Post.find({
      hashtags: { $regex: hashtag, $options: "i" },
    })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(skipPost));

    res.status(200).json({ posts });
  } catch (err) {
    res.status(500).json({ status: "error", msg: "Internal server error" });
  }
};
