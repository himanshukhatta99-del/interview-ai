import { useState } from "react"
import { InterviewContext } from "./interview.context.js"

/**
 * Shared state for the interview feature:
 *  - report:     the report currently being viewed
 *  - reports:    the list shown on the home page
 *  - loading:    true while fetching the list or a single report
 *  - generating: true while the AI is creating a new report (takes ~30s)
 *  - error:      the latest error message to show to the user (or null)
 */
export const InterviewProvider = ({ children }) => {

    const [ report, setReport ] = useState(null)
    const [ reports, setReports ] = useState([])
    const [ loading, setLoading ] = useState(false)
    const [ generating, setGenerating ] = useState(false)
    const [ error, setError ] = useState(null)

    return (
        <InterviewContext.Provider value={{
            report, setReport,
            reports, setReports,
            loading, setLoading,
            generating, setGenerating,
            error, setError
        }}>
            {children}
        </InterviewContext.Provider>
    )
}
