import supabase from "@/utils/supabase";

const storageBucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET as string;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const bucketUrl = `${supabaseUrl}/storage/v1/object/public/${storageBucket}/`;

const getFilenameFromURL = (url: string) => {
  const path = new URL(url).pathname;
  return path.substring(path.lastIndexOf("/") + 1);
};

const convertToWebP = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    // Validate that file is a valid File/Blob object
    if (!file || !(file instanceof Blob)) {
      reject(new Error("Invalid file: Expected a Blob or File object"));
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to convert image to WebP"));
        }
      }, "image/webp");
    };
    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };
    img.src = URL.createObjectURL(file);
  });
};

const changeFileExtensionToWebpExtension = (name: string) => {
  return name.replace(/\s+/g, "-").replace(/\.[^.]+$/, "") + ".webp";
};

const uploadFileTos3 = async (bucket: string, file: any, fileName: string) => {
  const filePath = `${bucket}/${fileName}`;

  try {
    if (!storageBucket) {
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET");
    }

    const { error: uploadError } = await supabase.storage
      .from(storageBucket)
      .upload(filePath, file, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(storageBucket).getPublicUrl(filePath);

    if (!data.publicUrl) {
      throw new Error("Failed to generate Supabase Storage public URL");
    }

    return data.publicUrl;
  } catch (error) {
    console.error("Error while uploading file to storage: ", error);
  }

  return "";
};

const getStoragePathFromURL = (fileUrl: string) => {
  if (fileUrl.startsWith(bucketUrl)) {
    return fileUrl.replace(bucketUrl, "");
  }

  try {
    const path = new URL(fileUrl).pathname;
    const marker = `/storage/v1/object/public/${storageBucket}/`;
    const markerIndex = path.indexOf(marker);

    if (markerIndex >= 0) {
      return decodeURIComponent(path.substring(markerIndex + marker.length));
    }
  } catch (error) {
    console.error("Error while parsing storage path: ", error);
  }

  return fileUrl;
};

const deleteFileFroms3 = async (fileUrl: string) => {
  try {
    if (!storageBucket) {
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET");
    }

    const filePath = getStoragePathFromURL(fileUrl);
    const { error } = await supabase.storage
      .from(storageBucket)
      .remove([filePath]);

    if (error) throw error;
  } catch (error) {
    console.error("Error while deleting the file from storage: ", error);
  }
};

export {
  getFilenameFromURL,
  convertToWebP,
  changeFileExtensionToWebpExtension,
  uploadFileTos3,
  deleteFileFroms3,
};