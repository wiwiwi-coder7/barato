export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_IMAGE_BYTES = 1 * 1024 * 1024;

export function validateGiftImage(file: Pick<File, "type" | "size">) {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    return "فقط فایل‌های JPG، PNG و WebP پذیرفته می‌شوند.";
  }
  if (file.size > MAX_IMAGE_BYTES) return "حجم تصویر باید حداکثر ۱ مگابایت باشد.";
  return null;
}

export function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("خواندن تصویر انجام نشد."));
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const base64 = result.split(",")[1];
      if (!base64) return reject(new Error("تصویر انتخاب‌شده معتبر نیست."));
      resolve(base64);
    };
    reader.readAsDataURL(file);
  });
}
