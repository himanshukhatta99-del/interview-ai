const { PDFParse } = require("pdf-parse")
const AppError = require("../utils/AppError")

/**
 * Extracts plain text from a PDF buffer (the uploaded resume).
 * Throws a friendly AppError if the file is not a readable PDF.
 */
async function extractTextFromPdf(buffer) {

    // Every real PDF starts with "%PDF". The browser-provided mimetype can be faked, this check can't.
    if (!buffer || buffer.subarray(0, 4).toString() !== "%PDF") {
        throw new AppError(400, "The uploaded file is not a valid PDF.")
    }

    const parser = new PDFParse({ data: new Uint8Array(buffer) })

    try {
        const result = await parser.getText()

        // pdf-parse adds page markers like "-- 1 of 2 --", remove them so they don't pollute the AI prompt.
        return result.text.replace(/^-- \d+ of \d+ --$/gm, "").trim()
    } catch (err) {
        throw new AppError(400, "We couldn't read this PDF. Please upload a different file.")
    } finally {
        await parser.destroy()
    }
}

module.exports = { extractTextFromPdf }
