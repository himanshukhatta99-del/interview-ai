import { useContext } from "react"
import { InterviewContext } from "../interview.context.js"
import { AuthContext } from "../../auth/auth.context.js"
import {
    generateInterviewReport,
    getInterviewReportById,
    getAllInterviewReports,
    deleteInterviewReport,
    generateResumePdf
} from "../services/interview.api.js"
import { getErrorMessage } from "../../../utils/getErrorMessage.js"

/**
 * All interview actions in one place. Each action:
 *   1. clears the old error
 *   2. calls the API
 *   3. on success updates the shared state
 *   4. on failure stores a readable message in `error` and returns null/false (it never crashes the page)
 */
export const useInterview = () => {

    const context = useContext(InterviewContext)
    const { setUser } = useContext(AuthContext)

    const {
        report, setReport, reports, setReports,
        loading, setLoading, generating, setGenerating,
        error, setError
    } = context

    // If the login cookie expired while the page was open, log out in the UI so the user is sent to /login.
    const handleFailure = (err, fallback) => {
        if (err?.response?.status === 401) {
            setUser(null)
        }
        setError(getErrorMessage(err, fallback))
    }

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
        setGenerating(true)
        setError(null)
        try {
            const response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            setReport(response.interviewReport)
            return response.interviewReport
        } catch (err) {
            handleFailure(err, "Could not generate your interview plan. Please try again.")
            return null
        } finally {
            setGenerating(false)
        }
    }

    const getReportById = async (interviewId) => {
        setLoading(true)
        setError(null)
        setReport(null) // don't show the previous report while the new one loads
        try {
            const response = await getInterviewReportById(interviewId)
            setReport(response.interviewReport)
            return response.interviewReport
        } catch (err) {
            handleFailure(err, "Could not load this interview plan.")
            return null
        } finally {
            setLoading(false)
        }
    }

    const getReports = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await getAllInterviewReports()
            setReports(response.interviewReports)
            return response.interviewReports
        } catch (err) {
            handleFailure(err, "Could not load your previous plans.")
            return null
        } finally {
            setLoading(false)
        }
    }

    const deleteReport = async (interviewId) => {
        setError(null)
        try {
            await deleteInterviewReport(interviewId)
            // Update the list locally instead of re-fetching it.
            setReports((current) => current.filter((item) => item._id !== interviewId))
            return true
        } catch (err) {
            handleFailure(err, "Could not delete this plan.")
            return false
        }
    }

    const getResumePdf = async (interviewReportId) => {
        setError(null)
        try {
            const blob = await generateResumePdf({ interviewReportId })

            // Create a temporary link to the PDF in memory and click it to start the download.
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = `resume_${interviewReportId}.pdf`
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url) // free the memory

            return true
        } catch (err) {
            handleFailure(err, "Could not create your resume PDF. Please try again.")
            return false
        }
    }

    return {
        report, reports, loading, generating, error,
        generateReport, getReportById, getReports, deleteReport, getResumePdf
    }
}
