import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import { AppError } from "../middleware/errorHandler";

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
        if (error || !result) {
          // Cloudinary rejects files above the account plan's cap
          // (e.g. 10MB for raw files on the free plan). Surface a clear error.
          const msg = (error as { message?: string } | undefined)?.message ?? "";
          const maxMatch = msg.match(/Maximum is (\d+)/);
          if (/file size too large/i.test(msg)) {
            const maxBytes = maxMatch ? Number(maxMatch[1]) : 10 * 1024 * 1024;
            const maxMB = (maxBytes / (1024 * 1024)).toFixed(0);
            return reject(
              new AppError(
                413,
                `File is too large for storage (limit: ${maxMB}MB on the current Cloudinary plan). Compress the PDF or upgrade the Cloudinary plan.`,
              ),
            );
          }
          return reject(error ?? new Error("Cloudinary upload failed"));
        }
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
