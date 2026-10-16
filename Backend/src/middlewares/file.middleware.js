const multer = require("multer")
const AppError = require("../utils/AppError")

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 3 * 1024 * 1024 // 3MB
    },
    fileFilter: (req, file, cb) => {
        // Only PDFs are supported because the backend extracts text with pdf-parse.
        if (file.mimetype !== "application/pdf") {
            return cb(new AppError(400, "Only PDF resumes are supported."))
        }
        cb(null, true)
    }
})

module.exports = upload
