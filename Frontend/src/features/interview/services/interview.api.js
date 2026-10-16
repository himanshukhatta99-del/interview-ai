import api from "../../../api/client.js"

// Errors are NOT caught here: they bubble up to useInterview, which turns them into messages.

/**
 * @description Generate an interview report from a job description plus a resume file and/or a self description.
 */
export const generateInterviewReport = async ({ jobDescription, selfDescription, resumeFile }) => {

    const formData = new FormData()
    formData.append("jobDescription", jobDescription)
    formData.append("selfDescription", selfDescription)

    // Only attach the file if the user actually chose one.
    // (Appending `undefined` would send the text "undefined" as the "file".)
    if (resumeFile) {
        formData.append("resume", resumeFile)
    }

    // No manual Content-Type header: the browser must add it itself because it includes the multipart boundary.
    const response = await api.post("/api/interview/", formData)

    return response.data
}


/** @description Get one interview report by id. */
export const getInterviewReportById = async (interviewId) => {
    const response = await api.get(`/api/interview/report/${interviewId}`)

    return response.data
}


/** @description Get all interview reports of the logged in user. */
export const getAllInterviewReports = async () => {
    const response = await api.get("/api/interview/")

    return response.data
}


/** @description Delete one interview report. */
export const deleteInterviewReport = async (interviewId) => {
    const response = await api.delete(`/api/interview/report/${interviewId}`)

    return response.data
}


/** @description Generate a tailored resume PDF from an existing report. Returns the PDF as a Blob. */
export const generateResumePdf = async ({ interviewReportId }) => {
    try {
        const response = await api.post(`/api/interview/resume/pdf/${interviewReportId}`, null, {
            responseType: "blob"
        })

        return response.data
    } catch (err) {
        // With responseType "blob", error responses also arrive as a Blob.
        // Convert it back to JSON so the real server message can be shown.
        if (err.response?.data instanceof Blob) {
            try {
                err.response.data = JSON.parse(await err.response.data.text())
            } catch { /* keep the original error */ }
        }
        throw err
    }
}
