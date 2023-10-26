const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "da2qeovq7",
  api_key: "363579753917956",
  api_secret: "SGjK-Ca0zIEajE3GuBSINrjbOZw",
});

async function uploadImageToCloudinary(imagePath) {
  try {
    const result = await cloudinary.uploader.upload(imagePath);
    return result.secure_url;
  } catch (error) {
    console.error("Lỗi tải lên ảnh lên Cloudinary:", error);
    throw error;
  }
}

module.exports = uploadImageToCloudinary;
