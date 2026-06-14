import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

// Validate required env vars
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  throw new Error(
    "Missing Cloudinary config: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are required",
  );
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload a buffer to Cloudinary as a raw file (preserves PDF/doc as-is).
 * Sets proper filename with extension so downloads have correct file type.
 * Returns the secure_url and public_id for storage in the DB.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  originalName: string,
): Promise<{ secureUrl: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const ext = originalName.split(".").pop() || "pdf";
    const baseName = originalName.replace(/\.[^.]+$/, "");
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "raw",
        public_id: `${baseName}_${Date.now()}.${ext}`,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        access_mode: "public",
        context: `original_name=${originalName}`,
      },
      (error, result) => {
        if (error || !result)
          return reject(error ?? new Error("Cloudinary upload failed"));
        resolve({ secureUrl: result.secure_url, publicId: result.public_id });
      },
    );
    Readable.from(buffer).pipe(stream);
  });
}

/**
 * Delete a file from Cloudinary by public_id.
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
}

export { cloudinary };
