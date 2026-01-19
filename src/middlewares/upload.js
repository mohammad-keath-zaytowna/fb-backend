const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for local disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    cb(null, baseName + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({ storage: storage });

/**
 * Compress image if it's larger than 1MB
 */
const compressImage = async (req, res, next) => {
  if (!req.file) return next();

  const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

  try {
    const filePath = req.file.path;
    const fileSize = req.file.size;

    // If file is under 1MB, skip compression
    if (fileSize <= MAX_FILE_SIZE) {
      console.log(`Image size: ${(fileSize / 1024 / 1024).toFixed(2)}MB - no compression needed`);
      return next();
    }

    

    // Start with quality 80 and reduce if needed
    let quality = 80;
    let compressedBuffer;
    let compressedSize;

    do {
      compressedBuffer = await sharp(filePath)
        .jpeg({ quality, progressive: true })
        .toBuffer();

      compressedSize = compressedBuffer.length;

      // If still too large and quality can be reduced, try again
      if (compressedSize > MAX_FILE_SIZE && quality > 20) {
        quality -= 10;
      } else {
        break;
      }
    } while (compressedSize > MAX_FILE_SIZE && quality > 20);

    // Write compressed buffer back to file
    fs.writeFileSync(filePath, compressedBuffer);
    req.file.size = compressedSize;

    

    next();
  } catch (error) {
    console.error('Image compression error:', error);
    // If compression fails, continue with original file
    next();
  }
};

/**
 * Middleware to set upload result similar to cloudinary
 */
const localUpload = (req, res, next) => {
  if (!req.file) return next();

  // Create a result object similar to cloudinary's response
  // The URL will be /uploads/filename
  const fileUrl = `/uploads/${req.file.filename}`;

  req.uploadResult = {
    url: fileUrl,
    secure_url: fileUrl,
    filename: req.file.filename,
    path: req.file.path,
    size: req.file.size,
  };

  next();
};

module.exports = { upload, compressImage, localUpload };
