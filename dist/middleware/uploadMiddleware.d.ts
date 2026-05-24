import multer from 'multer';
export declare const upload: multer.Multer;
export interface CloudinaryUploadResponse {
    secure_url: string;
    public_id: string;
}
/**
 * Uploads a file buffer directly to Cloudinary using a readable stream.
 * @param fileBuffer The buffer of the uploaded file
 * @param folder Cloudinary folder name
 */
export declare const uploadToCloudinary: (fileBuffer: Buffer, folder?: string) => Promise<CloudinaryUploadResponse>;
/**
 * Deletes an image from Cloudinary using its public_id.
 * @param publicId Cloudinary resource public_id
 */
export declare const deleteFromCloudinary: (publicId: string) => Promise<any>;
