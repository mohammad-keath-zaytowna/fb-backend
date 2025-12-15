const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { Readable } = require("stream");

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

module.exports = { upload, cloudinaryUpload };
