const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { Readable } = require("stream");
const sharp = require("sharp");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });

function bufferToStream(buffer) {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
}

/**
 * Compress image if it's larger than 1MB
 */
const compressImage = async (req, res, next) => {
  if (!req.file) return next();

  const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

  try {
    const fileSize = req.file.buffer.length;

    // If file is under 1MB, skip compression
    if (fileSize <= MAX_FILE_SIZE) {
      console.log(`Image size: ${(fileSize / 1024 / 1024).toFixed(2)}MB - no compression needed`);
      return next();
    }

    console.log(`Image size: ${(fileSize / 1024 / 1024).toFixed(2)}MB - compressing...`);

    // Start with quality 80 and reduce if needed
    let quality = 80;
    let compressedBuffer;
    let compressedSize;

    do {
      compressedBuffer = await sharp(req.file.buffer)
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

    // Replace the original buffer with compressed one
    req.file.buffer = compressedBuffer;
    req.file.size = compressedSize;

    console.log(`Image compressed to ${(compressedSize / 1024 / 1024).toFixed(2)}MB (quality: ${quality})`);

    next();
  } catch (error) {
    console.error('Image compression error:', error);
    // If compression fails, continue with original file
    next();
  }
};

const cloudinaryUpload = (req, res, next) => {
  if (!req.file) return next();

  const uploadStream = cloudinary.uploader.upload_stream(
    { folder: "products" }, // customize folder
    (error, result) => {
      if (error) return next(error);
      req.cloudinaryResult = result;
      next();
    }
  );

  bufferToStream(req.file.buffer).pipe(uploadStream);
};

module.exports = { upload, compressImage, cloudinaryUpload };
