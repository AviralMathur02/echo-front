// client/src/utils/imageUtils.js

// --- IMPORTANT: CONFIGURE YOUR S3 BASE URL HERE ---
// This should match your S3 bucket's public URL structure.
// Format: https://your-bucket-name.s3.your-region.amazonaws.com/
// Based on your input: aws.s3.bucket-name=aviralawsbucket123 and aws.s3.region=us-west-2
const S3_BASE_URL = "https://echobackendstorage.s3.ap-south-1.amazonaws.com/";

// If your backend stores paths like "profile_pics/filename.jpg" or "cover_pics/filename.jpg",
// these subfolders are part of the S3 'key' and will be correctly appended to S3_BASE_URL.

export const getImageSrc = (imagePath) => {
  if (!imagePath) {
    return null; // Or a default placeholder path if you always want one
  }

  // Case 1: If it's already a full URL (e.g., from S3 or an external source)
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // Case 2: If it's a relative path (a filename or path within S3 that your backend stores)
  // Prepend the S3 base URL. Ensure there are no double slashes if imagePath starts with '/'
  const normalizedImagePath = imagePath.startsWith("/")
    ? imagePath.substring(1)
    : imagePath;
  return `${S3_BASE_URL}${normalizedImagePath}`;

  // Removed the old local "/upload/" logic as all images should now be served from S3.
  // // Old local upload path logic (REMOVE THIS if all images are S3)
  // return `/upload/${imagePath}`;
};
