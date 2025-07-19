import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      default: "",
      maxLength: 50,
    },
    bio: {
      type: String,
      default: "",
      maxLength: 200,
    },
    location: {
      type: String,
      default: "",
      maxLength: 50,
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
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    following: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
  },
  { timestamps: true }
);

// Hashing password sebelum menyimpan (pre-save hook)
userSchema.pre("save", async function (next) {
  // Hanya jalankan ini jika password dimodifikasi (atau baru dibuat)
  if (!this.isModified("password")) {
    next();
  }
  // Generate salt dan hash password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Metode untuk membandingkan password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
