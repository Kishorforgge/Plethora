import multer from 'multer';
import cloudinary from '../config/cloudinary';
import { Readable } from 'stream';

// Set up memory storage for Multer
const storage = multer.memoryStorage();

// Ensure only images are uploaded
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only image files are allowed.') as any, false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
}

/**
 * Uploads a file buffer directly to Cloudinary using a readable stream.
 * @param fileBuffer The buffer of the uploaded file
 * @param folder Cloudinary folder name
 */
export const uploadToCloudinary = (
  fileBuffer: Buffer,
  folder: string = 'plethora'
): Promise<CloudinaryUploadResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
      },
      (error, result) => {
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
      }
    );

    // Convert file buffer to readable stream and pipe to uploadStream
    const stream = new Readable();
    stream.push(fileBuffer);
    stream.push(null);
    stream.pipe(uploadStream);
  });
};

/**
 * Deletes an image from Cloudinary using its public_id.
 * @param publicId Cloudinary resource public_id
 */
export const deleteFromCloudinary = async (publicId: string): Promise<any> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};
