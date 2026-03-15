import multer from 'multer';

/**
 * Handles file uploads and stores them temporarily on local disk before sending to Cloudinary
 */
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp"); // Temp storage folder for multer
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

export const upload = multer({ 
    storage, 
});
