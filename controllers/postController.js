import Post from "../models/Post.js";
import User from "../models/User.js";
import shuffleArray from "../functions/shuffleArray.js";
// Create a post controller
export const createPost = async (req, res) => {
  try {
    const { _id, description, hashtags } = req.body;
    const user = await User.findById(_id);
    if (!user)
      return res.status(404).json({ status: "error", msg: "User not found" });

    const post = new Post({
      userId: user._id,
      displayName: user.displayName,
      picturePath: user.picturePath,
      location: user.location,
      description,
      hashtags: hashtags.split(" "),
      imagePath: req.file ? req.file.path : "",
    });

    await post.save();
    res.status(200).json({ status: "success", msg: "Post created" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", msg: "Internal server error" });
  }
};

// Get posts controller
export const getPosts = async (req, res) => {
  try {
    const { skipPost, limit } = req.query;
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(skipPost));

    res.status(200).json({ data: shuffleArray(posts) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", msg: "Internal server error" });
  }
};

// Get comments for a post controller
export const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);
    if (!post)
      return res.status(404).json({ status: "error", msg: "Post not found" });

    res.status(200).json({ data: post.comments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", msg: "Internal server error" });
  }
};

// Add comment to a post controller
export const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId, comment } = req.body;
    const post = await Post.findById(postId);
    const user = await User.findById(userId);
    const postOwner = await User.findById(post.userId);
    console.log(`Post owner ${postOwner.displayName}`);
    // validation
    if (!post)
      return res.status(404).json({ status: "error", msg: "Post not found" });
    if (!user)
      return res.status(404).json({ status: "error", msg: "User not found" });

    post.comments.push({
      displayName: user.displayName,
      picturePath: user.picturePath,
      comment,
    });

    await post.save();

    // push notification
    postOwner.notifications.push({
      picturePath: user.picturePath,
      displayName: user.displayName,
      notification: "add a comment to your post",
      date: new Date(),
      type: "comment",
      state: "unread",
    });

    await postOwner.save();
    res.status(200).json({ status: "success", msg: "Comment added" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", msg: "Internal server error" });
  }
};

// Delete a comment controller
export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    const post = await Post.findById(postId);
    if (!post)
      return res.status(404).json({ status: "error", msg: "Post not found" });

    post.comments = post.comments.filter(
      (comment) => comment._id.toString() !== commentId
    );
    await post.save();

    res.status(200).json({ status: "success", msg: "Comment deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", msg: "Internal server error" });
  }
};

// Like a post controller
export const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;

    const post = await Post.findById(postId);
    const postOwner = await User.findById(post.userId);
    const user = await User.findById(userId);

    if (!post)
      return res.status(404).json({ status: "error", msg: "Post not found" });
    if (!user || !postOwner)
      return res.status(404).json({ status: "error", msg: "User not found" });

    if (!post.likedBy.includes(userId)) {
      post.likes += 1;
      post.likedBy.push(userId);
      await post.save();

      postOwner.notifications.push({
        picturePath: user.picturePath,
        displayName: user.displayName,
        notification: "liked your post",
        date: new Date(),
        type: "like",
        state: "unread",
      });

      await postOwner.save();
    }

    res.status(200).json({ status: "success", likes: post.likes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", msg: "Internal server error" });
  }
};

// Unlike a post controller
export const unlikePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;

    const post = await Post.findById(postId);
    if (!post)
      return res.status(404).json({ status: "error", msg: "Post not found" });

    const index = post.likedBy.indexOf(userId);
    if (index > -1) {
      post.likes -= 1;
      post.likedBy.splice(index, 1);
      await post.save();
    }

    res.status(200).json({ status: "success", likes: post.likes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", msg: "Internal server error" });
  }
};
