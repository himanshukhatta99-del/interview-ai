import { useState, useEffect } from 'react'
import '../style/interview.scss'
import { useInterview } from '../hooks/useInterview.js'
import { Link, useParams } from 'react-router'
import LoadingScreen from '../../../components/LoadingScreen.jsx'



const NAV_ITEMS = [
    { id: 'technical', label: 'Technical Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>) },
    { id: 'behavioral', label: 'Behavioral Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>) },
    { id: 'roadmap', label: 'Road Map', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>) },
]

// Words shown under the score ring. Previously this always said "Strong match", even for a 20% score.
const getScoreInfo = (score) => {
    if (score >= 80) return { className: 'score--high', text: 'Strong match for this role' }
    if (score >= 60) return { className: 'score--mid', text: 'Good match, a few gaps to close' }
    return { className: 'score--low', text: 'Needs work. Focus on the skill gaps' }
}

// ── Sub-components ────────────────────────────────────────────────────────────
const QuestionCard = ({ item, index }) => {
    const [ open, setOpen ] = useState(false)
    return (
        <div className='q-card'>
            {/* A real <button> so keyboard and screen-reader users can open it too */}
            <button type='button' className='q-card__header' onClick={() => setOpen(o => !o)} aria-expanded={open}>
                <span className='q-card__index'>Q{index + 1}</span>
                <span className='q-card__question'>{item.question}</span>
                <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
            </button>
            {open && (
                <div className='q-card__body'>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--intention'>Intention</span>
                        <p>{item.intention}</p>
                    </div>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--answer'>Model Answer</span>
                        <p>{item.answer}</p>
                    </div>
                </div>
            )}
        </div>
    )
}

const RoadMapDay = ({ day }) => (
    <div className='roadmap-day'>
        <div className='roadmap-day__header'>
            <span className='roadmap-day__badge'>Day {day.day}</span>
            <h3 className='roadmap-day__focus'>{day.focus}</h3>
        </div>
        <ul className='roadmap-day__tasks'>
            {(day.tasks ?? []).map((task, i) => (
                <li key={i}>
                    <span className='roadmap-day__bullet' />
                    {task}
                </li>
            ))}
        </ul>
    </div>
)

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

const EmptyMessage = ({ children }) => <p className='empty-state'>{children}</p>

// ── Main Component ────────────────────────────────────────────────────────────
const Interview = () => {
    const [ activeNav, setActiveNav ] = useState('technical')
    const [ pdfLoading, setPdfLoading ] = useState(false)
    const { report, getReportById, loading, error, getResumePdf } = useInterview()
    const { interviewId } = useParams()

    // The report is fetched once here (it used to be fetched twice: once here and once inside the hook).
    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ interviewId ])

    const handleDownloadResume = async () => {
        setPdfLoading(true)
        await getResumePdf(interviewId)
        setPdfLoading(false)
    }

    // Only show the report if it is the one in the URL (avoids flashing a previously viewed report).
    const currentReport = report?._id === interviewId ? report : null

    if (!currentReport) {
        if (error && !loading) {
            return (
                <main className='loading-screen'>
                    <h1>We couldn't open this plan</h1>
                    <p className='alert alert--error' role="alert">{error}</p>
                    <p><Link to='/' className='highlight'>Back to all plans</Link></p>
                </main>
            )
        }
        return <LoadingScreen message="Loading your interview plan..." />
    }

    const technicalQuestions = currentReport.technicalQuestions ?? []
    const behavioralQuestions = currentReport.behavioralQuestions ?? []
    const preparationPlan = currentReport.preparationPlan ?? []
    const skillGaps = currentReport.skillGaps ?? []
    const scoreInfo = getScoreInfo(currentReport.matchScore)


    return (
        <div className='interview-page'>
            <div className='interview-layout'>

                {/* ── Left Nav ── */}
                <nav className='interview-nav' aria-label='Report sections'>
                    <div className="nav-content">
                        <Link to='/' className='interview-nav__back'>&larr; All plans</Link>
                        <p className='interview-nav__label'>Sections</p>
                        {NAV_ITEMS.map(item => (
                            <button
                                key={item.id}
                                type='button'
                                className={`interview-nav__item ${activeNav === item.id ? 'interview-nav__item--active' : ''}`}
                                onClick={() => setActiveNav(item.id)}
                                aria-current={activeNav === item.id ? 'page' : undefined}
                            >
                                <span className='interview-nav__icon'>{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </div>
                    <div className='interview-nav__download'>
                        <button
                            type='button'
                            onClick={handleDownloadResume}
                            disabled={pdfLoading}
                            className='button primary-button' >
                            <svg height={"0.8rem"} style={{ marginRight: "0.8rem" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M10.6144 17.7956 11.492 15.7854C12.2731 13.9966 13.6789 12.5726 15.4325 11.7942L17.8482 10.7219C18.6162 10.381 18.6162 9.26368 17.8482 8.92277L15.5079 7.88394C13.7092 7.08552 12.2782 5.60881 11.5105 3.75894L10.6215 1.61673C10.2916.821765 9.19319.821767 8.8633 1.61673L7.97427 3.75892C7.20657 5.60881 5.77553 7.08552 3.97685 7.88394L1.63658 8.92277C.868537 9.26368.868536 10.381 1.63658 10.7219L4.0523 11.7942C5.80589 12.5726 7.21171 13.9966 7.99275 15.7854L8.8704 17.7956C9.20776 18.5682 10.277 18.5682 10.6144 17.7956ZM19.4014 22.6899 19.6482 22.1242C20.0882 21.1156 20.8807 20.3125 21.8695 19.8732L22.6299 19.5353C23.0412 19.3526 23.0412 18.7549 22.6299 18.5722L21.9121 18.2532C20.8978 17.8026 20.0911 16.9698 19.6586 15.9269L19.4052 15.3156C19.2285 14.8896 18.6395 14.8896 18.4628 15.3156L18.2094 15.9269C17.777 16.9698 16.9703 17.8026 15.956 18.2532L15.2381 18.5722C14.8269 18.7549 14.8269 19.3526 15.2381 19.5353L15.9985 19.8732C16.9874 20.3125 17.7798 21.1156 18.2198 22.1242L18.4667 22.6899C18.6473 23.104 19.2207 23.104 19.4014 22.6899Z"></path></svg>
                            {pdfLoading ? 'Creating PDF...' : 'Download Resume'}
                        </button>
                        <p className='interview-nav__hint'>AI-tailored from your inputs. Review it for accuracy before sending.</p>
                    </div>
                </nav>

                <div className='interview-divider' />

                {/* ── Center Content ── */}
                <main className='interview-content'>
                    {error && <p className='alert alert--error' role="alert">{error}</p>}

                    {activeNav === 'technical' && (
                        <section>
                            <div className='content-header'>
                                <h2>Technical Questions</h2>
                                <span className='content-header__count'>{plural(technicalQuestions.length, 'question')}</span>
                            </div>
                            <div className='q-list'>
                                {technicalQuestions.length === 0 && <EmptyMessage>No technical questions were generated.</EmptyMessage>}
                                {technicalQuestions.map((q, i) => (
                                    <QuestionCard key={i} item={q} index={i} />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === 'behavioral' && (
                        <section>
                            <div className='content-header'>
                                <h2>Behavioral Questions</h2>
                                <span className='content-header__count'>{plural(behavioralQuestions.length, 'question')}</span>
                            </div>
                            <div className='q-list'>
                                {behavioralQuestions.length === 0 && <EmptyMessage>No behavioral questions were generated.</EmptyMessage>}
                                {behavioralQuestions.map((q, i) => (
                                    <QuestionCard key={i} item={q} index={i} />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === 'roadmap' && (
                        <section>
                            <div className='content-header'>
                                <h2>Preparation Road Map</h2>
                                <span className='content-header__count'>{preparationPlan.length}-day plan</span>
                            </div>
                            <div className='roadmap-list'>
                                {preparationPlan.length === 0 && <EmptyMessage>No preparation plan was generated.</EmptyMessage>}
                                {preparationPlan.map((day) => (
                                    <RoadMapDay key={day.day} day={day} />
                                ))}
                            </div>
                        </section>
                    )}
                </main>

                <div className='interview-divider' />

                {/* ── Right Sidebar ── */}
                <aside className='interview-sidebar'>

                    {/* Match Score */}
                    <div className='match-score'>
                        <p className='match-score__label'>Match Score</p>
                        <div className={`match-score__ring ${scoreInfo.className}`}>
                            <span className='match-score__value'>{currentReport.matchScore}</span>
                            <span className='match-score__pct'>%</span>
                        </div>
                        <p className={`match-score__sub match-score__sub--${scoreInfo.className.replace('score--', '')}`}>{scoreInfo.text}</p>
                    </div>

                    <div className='sidebar-divider' />

                    {/* Skill Gaps */}
                    <div className='skill-gaps'>
                        <p className='skill-gaps__label'>Skill Gaps</p>
                        <div className='skill-gaps__list'>
                            {skillGaps.length === 0 && <EmptyMessage>No major skill gaps found.</EmptyMessage>}
                            {skillGaps.map((gap, i) => (
                                <span key={i} className={`skill-tag skill-tag--${gap.severity}`}>
                                    {gap.skill}
                                </span>
                            ))}
                        </div>
                    </div>

                </aside>
            </div>
        </div>
    )
}

export default Interview
