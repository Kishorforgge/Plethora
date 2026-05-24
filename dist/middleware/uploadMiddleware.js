"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromCloudinary = exports.uploadToCloudinary = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const stream_1 = require("stream");
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});
exports.upload = upload;
exports.default = upload;
/**
 * Uploads a file buffer directly to Cloudinary using a readable stream.
 * @param fileBuffer The buffer of the uploaded file
 * @param folder Cloudinary folder name
 */
const uploadToCloudinary = (fileBuffer, folder = 'plethora') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.default.uploader.upload_stream({
            folder,
            resource_type: 'auto',
        }, (error, result) => {
            if (error) {
                return reject(error);
            }
            if (!result) {
                return reject(new Error('Cloudinary upload returned empty result.'));
            }
            resolve({
                secure_url: result.secure_url,
                public_id: result.public_id,
            });
        });
        // Convert file buffer to readable stream and pipe to uploadStream
        const stream = new stream_1.Readable();
        stream.push(fileBuffer);
        stream.push(null);
        stream.pipe(uploadStream);
    });
};
exports.uploadToCloudinary = uploadToCloudinary;
/**
 * Deletes an image from Cloudinary using its public_id.
 * @param publicId Cloudinary resource public_id
 */
const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary_1.default.uploader.destroy(publicId);
        return result;
    }
    catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        throw error;
    }
};
exports.deleteFromCloudinary = deleteFromCloudinary;
//# sourceMappingURL=uploadMiddleware.js.map