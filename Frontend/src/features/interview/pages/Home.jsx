import { useEffect, useState } from 'react'
import "../style/home.scss"
import { useInterview } from '../hooks/useInterview.js'
import { useAuth } from '../../auth/hooks/useAuth.js'
import { Link, useNavigate } from 'react-router'
import LoadingScreen from '../../../components/LoadingScreen.jsx'

const MAX_JOB_DESCRIPTION = 5000
const MAX_FILE_SIZE = 3 * 1024 * 1024 // 3MB, must match the backend limit

const scoreClass = (score) => score >= 80 ? 'score--high' : score >= 60 ? 'score--mid' : 'score--low'

const Home = () => {

    const { loading, generating, error, generateReport, getReports, deleteReport, reports } = useInterview()
    const { user, handleLogout } = useAuth()
    const navigate = useNavigate()

    const [ jobDescription, setJobDescription ] = useState("")
    const [ selfDescription, setSelfDescription ] = useState("")
    const [ resumeFile, setResumeFile ] = useState(null)
    const [ formError, setFormError ] = useState("")
    const [ dragging, setDragging ] = useState(false)

    // Load the user's previous plans once, when the page opens.
    // (getReports is recreated on every render, so we deliberately run this effect only on mount.)
    useEffect(() => {
        getReports()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    /** Validates a chosen file and stores it in state (used by both the file picker and drag & drop). */
    const selectFile = (file) => {
        if (!file) return

        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
        if (!isPdf) {
            setFormError("Only PDF resumes are supported.")
            return
        }
        if (file.size > MAX_FILE_SIZE) {
            setFormError("The file is too large. Maximum size is 3MB.")
            return
        }

        setFormError("")
        setResumeFile(file)
    }

    const handleGenerateReport = async (e) => {
        e.preventDefault()

        if (jobDescription.trim().length < 20) {
            setFormError("Please paste the job description (at least 20 characters).")
            return
        }
        if (!resumeFile && !selfDescription.trim()) {
            setFormError("Please upload your resume or write a short self description.")
            return
        }

        setFormError("")
        const created = await generateReport({ jobDescription, selfDescription, resumeFile })

        // Only navigate when a report was really created. On failure we stay here and the error is shown.
        if (created) {
            navigate(`/interview/${created._id}`)
        }
    }

    const handleDelete = async (id) => {
        if (window.confirm("Delete this interview plan? This cannot be undone.")) {
            await deleteReport(id)
        }
    }

    // The component itself (and all typed text) stays alive during generation; only the view changes.
    if (generating) {
        return <LoadingScreen message="Generating your interview strategy... this takes about 30 seconds." />
    }

    const shownError = formError || error

    return (
        <div className='home-page'>

            {/* Top bar */}
            <div className='topbar'>
                <span className='topbar__user'>Signed in as <strong>{user?.username}</strong></span>
                <button type='button' className='topbar__logout' onClick={handleLogout}>Log out</button>
            </div>

            {/* Page Header */}
            <header className='page-header'>
                <h1>Create Your Custom <span className='highlight'>Interview Plan</span></h1>
                <p>Let our AI analyze the job requirements and your unique profile to build a winning strategy.</p>
            </header>

            {/* Main Card */}
            <form className='interview-card' onSubmit={handleGenerateReport} noValidate>
                <div className='interview-card__body'>

                    {/* Left Panel - Job Description */}
                    <div className='panel panel--left'>
                        <div className='panel__header'>
                            <span className='panel__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                            </span>
                            <h2><label htmlFor='jobDescription'>Target Job Description</label></h2>
                            <span className='badge badge--required'>Required</span>
                        </div>
                        <textarea
                            id='jobDescription'
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            className='panel__textarea'
                            placeholder={`Paste the full job description here...\ne.g. 'Senior Frontend Engineer at Google requires proficiency in React, TypeScript, and large-scale system design...'`}
                            maxLength={MAX_JOB_DESCRIPTION}
                        />
                        <div className='char-counter' aria-live="off">{jobDescription.length} / {MAX_JOB_DESCRIPTION} chars</div>
                    </div>

                    {/* Vertical Divider */}
                    <div className='panel-divider' />

                    {/* Right Panel - Profile */}
                    <div className='panel panel--right'>
                        <div className='panel__header'>
                            <span className='panel__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            </span>
                            <h2>Your Profile</h2>
                        </div>

                        {/* Upload Resume */}
                        <div className='upload-section'>
                            <span className='section-label'>
                                Upload Resume
                                <span className='badge badge--best'>Best Results</span>
                            </span>
                            <label
                                className={`dropzone ${dragging ? 'dropzone--active' : ''}`}
                                htmlFor='resume'
                                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                                onDragLeave={() => setDragging(false)}
                                onDrop={(e) => { e.preventDefault(); setDragging(false); selectFile(e.dataTransfer.files[ 0 ]) }}
                            >
                                <span className='dropzone__icon'>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" /></svg>
                                </span>
                                <p className='dropzone__title'>Click to upload or drag &amp; drop</p>
                                <p className='dropzone__subtitle'>PDF only (max 3MB)</p>
                                <input
                                    className='visually-hidden'
                                    type='file' id='resume' name='resume' accept='.pdf,application/pdf'
                                    onChange={(e) => { selectFile(e.target.files[ 0 ]); e.target.value = '' }}
                                />
                            </label>
                            {resumeFile && (
                                <div className='file-chosen'>
                                    <span className='file-chosen__name'>{resumeFile.name}</span>
                                    <button type='button' className='file-chosen__remove' onClick={() => setResumeFile(null)}>Remove</button>
                                </div>
                            )}
                        </div>

                        {/* OR Divider */}
                        <div className='or-divider'><span>OR</span></div>

                        {/* Quick Self-Description */}
                        <div className='self-description'>
                            <label className='section-label' htmlFor='selfDescription'>Quick Self-Description</label>
                            <textarea
                                value={selfDescription}
                                onChange={(e) => setSelfDescription(e.target.value)}
                                id='selfDescription'
                                name='selfDescription'
                                className='panel__textarea panel__textarea--short'
                                maxLength={3000}
                                placeholder="Briefly describe your experience, key skills, and years of experience if you don't have a resume handy..."
                            />
                        </div>

                        {/* Info Box */}
                        <div className='info-box'>
                            <span className='info-box__icon'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" stroke="#1a1f27" strokeWidth="2" /><line x1="12" y1="16" x2="12.01" y2="16" stroke="#1a1f27" strokeWidth="2" /></svg>
                            </span>
                            <p>Either a <strong>Resume</strong> or a <strong>Self Description</strong> is required to generate a personalized plan.</p>
                        </div>
                    </div>
                </div>

                {/* Error message */}
                {shownError && <p className='alert alert--error interview-card__error' role="alert">{shownError}</p>}

                {/* Card Footer */}
                <div className='interview-card__footer'>
                    <span className='footer-info'>AI-Powered Strategy Generation &bull; Approx 30s</span>
                    <button type='submit' className='generate-btn'>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" /></svg>
                        Generate My Interview Strategy
                    </button>
                </div>
            </form>

            {/* Recent Reports List */}
            <section className='recent-reports'>
                <h2>My Recent Interview Plans</h2>

                {loading && reports.length === 0 && <p className='empty-state'>Loading your plans...</p>}

                {!loading && reports.length === 0 && (
                    <p className='empty-state'>No plans yet. Fill in the form above to generate your first one.</p>
                )}

                {reports.length > 0 && (
                    <ul className='reports-list'>
                        {reports.map(item => (
                            <li key={item._id} className='report-item'>
                                <Link to={`/interview/${item._id}`} className='report-item__link'>
                                    <h3>{item.title || 'Untitled Position'}</h3>
                                    <p className='report-meta'>Generated on {new Date(item.createdAt).toLocaleDateString()}</p>
                                    <p className={`report-item__score ${scoreClass(item.matchScore)}`}>Match Score: {item.matchScore}%</p>
                                </Link>
                                <button
                                    type='button'
                                    className='report-item__delete'
                                    onClick={() => handleDelete(item._id)}
                                    aria-label={`Delete plan: ${item.title || 'Untitled Position'}`}
                                >
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    )
}

export default Home
