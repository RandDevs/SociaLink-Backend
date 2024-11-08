import multer from "multer";
import path from "path";

// Helper function to create storage
const createStorage = (destination) => {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, destination);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 5);
      const extension = path.extname(file.originalname);
      cb(null, uniqueSuffix + extension);
    },
  });
};

// Create storage for different file types
const postStorage = createStorage("public/posts/");
const bannerStorage = createStorage("public/banners/");
const profilePictStorage = createStorage("public/profile_pictures/");

// Create multer instances
export const uploadPost = multer({ storage: postStorage });
export const uploadBanner = multer({ storage: bannerStorage });
export const uploadProfilePict = multer({ storage: profilePictStorage });
