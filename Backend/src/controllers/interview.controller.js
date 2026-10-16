const mongoose = require("mongoose")
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const { extractTextFromPdf } = require("../services/pdf.service")
const interviewReportModel = require("../models/interviewReport.model")
const AppError = require("../utils/AppError")
const { validateReportInput } = require("../utils/validators")


/** Throws a 404 if the id in the URL is not a valid MongoDB ObjectId (avoids a confusing CastError). */
function assertValidId(id) {
    if (!mongoose.isValidObjectId(id)) {
        throw new AppError(404, "Interview report not found.")
    }
}

/**
 * Finds a report by id that BELONGS TO the logged-in user.
 * Every read/delete goes through this function, so one user can never touch another user's data.
 */
async function findOwnedReport(interviewId, userId) {
    assertValidId(interviewId)

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: userId })

    if (!interviewReport) {
        throw new AppError(404, "Interview report not found.")
    }

    return interviewReport
}


/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {

    const { selfDescription, jobDescription } = req.body ?? {}

    const validationError = validateReportInput({ selfDescription, jobDescription }, Boolean(req.file))
    if (validationError) {
        throw new AppError(400, validationError)
    }

    let resumeText = ""
    if (req.file) {
        resumeText = await extractTextFromPdf(req.file.buffer)

        if (!resumeText && !(selfDescription && selfDescription.trim())) {
            throw new AppError(400, "We couldn't find any text in this PDF (is it a scanned image?). Please add a self description or upload a text-based PDF.")
        }
    }

    const interViewReportByAi = await generateInterviewReport({
        resume: resumeText,
        selfDescription,
        jobDescription
    })

    const interviewReport = await interviewReportModel.create({
        user: req.user.id,
        resume: resumeText,
        selfDescription,
        jobDescription,
        ...interViewReportByAi
    })

    res.status(201).json({
        message: "Interview report generated successfully.",
        interviewReport
    })

}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {

    const interviewReport = await findOwnedReport(req.params.interviewId, req.user.id)

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
}


/**
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}


/**
 * @description Controller to delete one of the logged in user's reports.
 */
async function deleteInterviewReportController(req, res) {

    const interviewReport = await findOwnedReport(req.params.interviewId, req.user.id)

    await interviewReport.deleteOne()

    res.status(200).json({
        message: "Interview report deleted successfully."
    })
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {

    // Ownership check: only the report's owner can generate a resume from its data.
    const interviewReport = await findOwnedReport(req.params.interviewReportId, req.user.id)

    const { resume, jobDescription, selfDescription } = interviewReport

    const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=resume_${interviewReport._id}.pdf`
    })

    res.send(pdfBuffer)
}

module.exports = {
    generateInterViewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    deleteInterviewReportController,
    generateResumePdfController
}
