import { useState, useEffect } from 'react'

const API_BASE = 'http://localhost:8000'

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function timeAgo(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const AVATAR_PALETTES = [
  'from-amber-400 to-orange-400',
  'from-rose-400 to-pink-500',
  'from-violet-400 to-purple-500',
  'from-sky-400 to-blue-500',
  'from-emerald-400 to-teal-500',
  'from-fuchsia-400 to-pink-400',
]
function avatarGradient(id) { return AVATAR_PALETTES[id % AVATAR_PALETTES.length] }

function Spinner({ sm }) {
  const size = sm ? 'h-4 w-4' : 'h-5 w-5'
  return (
    <svg className={`animate-spin ${size}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

function Alert({ type, message, onDismiss }) {
  const s = type === 'error'
    ? {
        wrap: 'bg-red-50 dark:bg-red-400/10 border-red-200 dark:border-red-400/30 text-red-700 dark:text-red-400',
        btn: 'text-red-400 hover:text-red-600 dark:hover:text-red-300',
      }
    : {
        wrap: 'bg-emerald-50 dark:bg-emerald-400/10 border-emerald-200 dark:border-emerald-400/30 text-emerald-700 dark:text-emerald-400',
        btn: 'text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300',
      }
  return (
    <div role={type === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 p-4 rounded-xl border text-sm ${s.wrap}`}>
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className={`transition-colors ${s.btn}`}>✕</button>
      )}
    </div>
  )
}

function VoteButtons({ answerId, token, initialScore, initialMyVote }) {
  const [myVote, setMyVote] = useState(initialMyVote ?? 0)
  const [score, setScore] = useState(initialScore ?? 0)
  const [loading, setLoading] = useState(false)

  const castVote = async (dir) => {
    if (!token || loading) return

    const nextDir = myVote === dir ? 0 : dir
    const prevVote = myVote
    const prevScore = score

    setMyVote(nextDir)
    setScore(score + nextDir - myVote)
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/vote/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answer_id: answerId, dir: nextDir }),
      })
      if (!res.ok) {
        setMyVote(prevVote)
        setScore(prevScore)
      }
    } catch {
      setMyVote(prevVote)
      setScore(prevScore)
    } finally {
      setLoading(false)
    }
  }

  const baseBtn = `inline-flex items-center justify-center w-7 h-7 rounded-full border
                   transition-all duration-200 focus:outline-none focus-visible:ring-2
                   focus-visible:ring-orange-400 disabled:cursor-not-allowed select-none active:scale-95`

  const upActive   = `bg-orange-400 border-orange-400 text-white hover:bg-orange-300 hover:border-orange-300
                       dark:bg-orange-500 dark:border-orange-500 dark:hover:bg-orange-400`
  const upInactive = `bg-white border-stone-200 text-stone-400 hover:border-orange-400 hover:text-orange-500
                       dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400
                       dark:hover:border-orange-500 dark:hover:text-orange-400`
  const downActive   = `bg-orange-400 border-orange-400 text-white hover:bg-orange-300 hover:border-orange-300
                         dark:bg-orange-500 dark:border-orange-500 dark:hover:bg-orange-400`
  const downInactive = `bg-white border-stone-200 text-stone-400 hover:border-orange-400 hover:text-orange-500
                         dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400
                         dark:hover:border-orange-500 dark:hover:text-orange-400`

  return (
    <div className="inline-flex items-center gap-1.5">
      <button
        id={`upvote-answer-${answerId}`}
        onClick={() => castVote(1)}
        disabled={loading || !token}
        title={!token ? 'Log in to vote' : myVote === 1 ? 'Remove upvote' : 'Upvote this answer'}
        className={`${baseBtn} ${myVote === 1 ? upActive : upInactive}`}
      >
        {loading ? (
          <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        ) : (
          <svg className={`w-3.5 h-3.5 transition-transform duration-150 ${myVote === 1 ? 'scale-110' : ''}`}
               fill={myVote === 1 ? 'currentColor' : 'none'} viewBox="0 0 24 24"
               stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        )}
      </button>

      <span className={`text-xs font-bold tabular-nums w-5 text-center leading-none
                        ${score > 0 ? 'text-orange-500 dark:text-orange-400'
                                    : score < 0 ? 'text-rose-500 dark:text-rose-400'
                                                : 'text-stone-400 dark:text-neutral-500'}`}>
        {score}
      </span>

      <button
        id={`downvote-answer-${answerId}`}
        onClick={() => castVote(-1)}
        disabled={loading || !token}
        title={!token ? 'Log in to vote' : myVote === -1 ? 'Remove downvote' : 'Downvote this answer'}
        className={`${baseBtn} ${myVote === -1 ? downActive : downInactive}`}
      >
        <svg className={`w-3.5 h-3.5 transition-transform duration-150 ${myVote === -1 ? 'scale-110' : ''}`}
             fill={myVote === -1 ? 'currentColor' : 'none'} viewBox="0 0 24 24"
             stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  )
}

function RepBadge({ rep }) {
  const color = rep >= 100
    ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-400/10 border-amber-200 dark:border-amber-400/30'
    : rep >= 10
    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-400/10 border-emerald-200 dark:border-emerald-400/30'
    : 'text-stone-500 dark:text-neutral-400 bg-stone-100 dark:bg-neutral-800 border-stone-200 dark:border-neutral-700'

  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold border rounded-full px-1.5 py-0.5 ${color}`}
          title="Reputation score">
      ★ {rep}
    </span>
  )
}

function AnswerCard({ answer, index, token }) {
  return (
    <div
      id={`answer-${answer.id}`}
      className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl overflow-hidden"
    >
      <div className="flex items-center gap-3 px-5 py-3 border-b border-stone-100 dark:border-neutral-800 bg-stone-50/60 dark:bg-neutral-800/40">
        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarGradient(answer.user_id)}
                         flex items-center justify-center text-white text-xs font-bold shrink-0`}>
          {(answer.author_username?.[0] ?? 'U').toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-xs font-semibold text-stone-700 dark:text-neutral-300 leading-none">
              {answer.author_username ?? `User #${answer.user_id}`}
            </p>
            <RepBadge rep={answer.author_reputation ?? 0} />
          </div>
          <p className="text-[11px] text-stone-400 dark:text-neutral-500 mt-0.5">
            {timeAgo(answer.created_at)}
          </p>
        </div>
        <span className="text-[11px] text-stone-400 dark:text-neutral-500 font-medium">
          Answer #{index + 1}
        </span>
        {answer.is_ai_generated && (
          <span className="text-[11px] font-medium text-violet-600 dark:text-violet-400
                           bg-violet-50 dark:bg-violet-400/10
                           border border-violet-200 dark:border-violet-400/30
                           rounded-full px-2 py-0.5">
            ✦ AI
          </span>
        )}
      </div>

      <div className="px-5 py-4">
        <p className="text-sm text-stone-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
          {answer.content}
        </p>
      </div>

      <div className="px-5 py-2.5 border-t border-stone-100 dark:border-neutral-800 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-[11px] text-stone-400 dark:text-neutral-500">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formatDate(answer.created_at)}
        </span>
        <VoteButtons
          answerId={answer.id}
          token={token}
          initialScore={answer.vote_score ?? 0}
          initialMyVote={answer.my_vote ?? 0}
        />
      </div>
    </div>
  )
}

function AnswerForm({ questionId, token, onPosted }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!content.trim()) { setError('Answer cannot be empty.'); return }
    if (content.trim().length < 5) { setError('Answer must be at least 5 characters.'); return }
    if (!token) { setError('You must be logged in to post an answer.'); return }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/answers/question/${questionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: content.trim() }),
      })

      if (!res.ok) {
        if (res.status === 401) { setError('Session expired. Please log in again.'); return }
        const d = await res.json().catch(() => ({}))
        throw new Error(d?.detail || `HTTP ${res.status}`)
      }

      const newAnswer = await res.json()
      setContent('')
      setSuccess('Your answer was posted!')
      if (typeof onPosted === 'function') onPosted(newAnswer)
    } catch (err) {
      setError(err.message || 'Could not reach the server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      id="post-answer-form"
      onSubmit={handleSubmit}
      noValidate
      className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-stone-100 dark:border-neutral-800 bg-stone-50/60 dark:bg-neutral-800/40">
        <h3 className="text-sm font-semibold text-stone-700 dark:text-neutral-300">Your Answer</h3>
        <p className="text-xs text-stone-400 dark:text-neutral-500 mt-0.5">Be clear, specific and helpful.</p>
      </div>

      <div className="px-5 py-4 space-y-4">
        {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}
        {success && <Alert type="success" message={success} onDismiss={() => setSuccess(null)} />}

        <div>
          <label htmlFor="answer-content" className="block text-sm font-medium text-stone-600 dark:text-neutral-400 mb-1.5">
            Answer <span className="text-amber-600 dark:text-amber-400">*</span>
          </label>
          <textarea
            id="answer-content"
            name="content"
            rows={5}
            value={content}
            onChange={(e) => { setContent(e.target.value); setError(null) }}
            disabled={loading}
            placeholder="Write your answer here…"
            className="w-full px-4 py-3 rounded-xl text-sm leading-relaxed resize-y
                       bg-white dark:bg-neutral-800
                       border border-stone-200 dark:border-neutral-700
                       text-stone-800 dark:text-neutral-100
                       placeholder-stone-400 dark:placeholder-neutral-600
                       hover:border-stone-300 dark:hover:border-neutral-600
                       focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200"
          />
          <div className="flex justify-end mt-1">
            <span className="text-xs text-stone-400 dark:text-neutral-500 tabular-nums">{content.length} chars</span>
          </div>
        </div>

        <button
          id="submit-answer-btn"
          type="submit"
          disabled={loading || !content.trim()}
          className="w-full py-3 px-6 rounded-xl font-semibold text-white text-sm
                     bg-gradient-to-r from-amber-500 to-orange-400
                     hover:from-amber-400 hover:to-orange-300
                     focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2
                     dark:focus:ring-offset-neutral-900
                     disabled:opacity-60 disabled:cursor-not-allowed
                     active:scale-[0.98] transition-all duration-200 shadow-lg shadow-amber-200/60"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner sm /> Posting…
            </span>
          ) : 'Post Answer'}
        </button>
      </div>
    </form>
  )
}

export default function QuestionDetail({ questionId, token, onBack }) {
  const [question, setQuestion] = useState(null)
  const [answers, setAnswers]   = useState([])
  const [qLoading, setQLoading] = useState(true)
  const [aLoading, setALoading] = useState(true)
  const [qError, setQError]     = useState(null)
  const [aError, setAError]     = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    const loadQuestion = async () => {
      setQLoading(true)
      setQError(null)
      try {
        const res = await fetch(`${API_BASE}/questions/${questionId}`, { signal })
        if (signal.aborted) return
        if (!res.ok) {
          const d = await res.json().catch(() => ({}))
          throw new Error(d?.detail || `HTTP ${res.status}`)
        }
        if (!signal.aborted) setQuestion(await res.json())
      } catch (err) {
        if (!signal.aborted) setQError(err.message)
      } finally {
        if (!signal.aborted) setQLoading(false)
      }
    }

    const loadAnswers = async () => {
      setALoading(true)
      setAError(null)
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await fetch(`${API_BASE}/answers/question/${questionId}`, { headers, signal })
        if (signal.aborted) return
        if (!res.ok) {
          const d = await res.json().catch(() => ({}))
          throw new Error(d?.detail || `HTTP ${res.status}`)
        }
        const data = await res.json()
        if (!signal.aborted) {
          setAnswers([...data].sort((a, b) => (b.vote_score ?? 0) - (a.vote_score ?? 0)))
        }
      } catch (err) {
        if (!signal.aborted) setAError(err.message)
      } finally {
        if (!signal.aborted) setALoading(false)
      }
    }

    loadQuestion()
    loadAnswers()

    return () => controller.abort()
  }, [questionId, token, refreshKey])

  const handleRefreshAnswers = () => setRefreshKey((k) => k + 1)

  const handleAnswerPosted = (newAnswer) => {
    const enriched = {
      ...newAnswer,
      vote_score: 0,
      my_vote: 0,
      author_username: newAnswer.author_username ?? `User #${newAnswer.user_id}`,
      author_reputation: newAnswer.author_reputation ?? 0,
    }
    setAnswers((prev) =>
      [...prev, enriched].sort((a, b) => (b.vote_score ?? 0) - (a.vote_score ?? 0))
    )
  }


  return (
    <div className="min-h-screen
                    bg-gradient-to-br from-amber-50 via-orange-50 to-stone-100
                    dark:bg-none dark:bg-black
                    py-10 px-4 transition-colors duration-300">
      <div className="max-w-xl mx-auto">

        <button
          id="back-to-feed-btn"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm mb-6
                     text-stone-500 dark:text-neutral-400
                     hover:text-stone-800 dark:hover:text-neutral-100
                     transition-colors duration-200 focus:outline-none focus-visible:underline"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to feed
        </button>

        {qLoading ? (
          <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl overflow-hidden animate-pulse mb-6">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-100 dark:border-neutral-800">
              <div className="w-10 h-10 rounded-full bg-stone-200 dark:bg-neutral-700" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 bg-stone-200 dark:bg-neutral-700 rounded-full w-28" />
                <div className="h-2.5 bg-stone-100 dark:bg-neutral-800 rounded-full w-20" />
              </div>
            </div>
            <div className="px-5 py-5 space-y-3">
              <div className="h-5 bg-stone-200 dark:bg-neutral-700 rounded-full w-3/4" />
              <div className="h-3 bg-stone-100 dark:bg-neutral-800 rounded-full w-full" />
              <div className="h-3 bg-stone-100 dark:bg-neutral-800 rounded-full w-5/6" />
            </div>
          </div>
        ) : qError ? (
          <div className="mb-6">
            <Alert type="error" message={`Could not load question: ${qError}`} />
          </div>
        ) : question && (
          <article
            id={`question-detail-${question.id}`}
            className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl overflow-hidden mb-6"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-neutral-800 bg-stone-50/60 dark:bg-neutral-800/40">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient(question.user_id)}
                                 flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                  U{question.user_id}
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-800 dark:text-neutral-100 leading-none">
                    User #{question.user_id}
                  </p>
                  <p className="text-[11px] text-stone-400 dark:text-neutral-500 mt-0.5">
                    {timeAgo(question.created_at)} · {formatDate(question.created_at)}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400
                               bg-amber-50 dark:bg-amber-400/10
                               border border-amber-200 dark:border-amber-400/30
                               rounded-full px-2.5 py-0.5">
                #{question.id}
              </span>
            </div>

            <div className="px-5 py-5">
              <h1 className="text-base font-bold text-stone-800 dark:text-neutral-100 leading-snug mb-3">
                {question.title}
              </h1>
              <p className="text-sm text-stone-600 dark:text-neutral-400 leading-relaxed whitespace-pre-wrap">
                {question.content}
              </p>
            </div>

            <div className="px-5 py-3 border-t border-stone-100 dark:border-neutral-800 flex items-center gap-2 text-[11px] text-stone-400 dark:text-neutral-500">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              {answers.length} answer{answers.length !== 1 ? 's' : ''}
            </div>
          </article>
        )}

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-700 dark:text-neutral-300">
            {aLoading ? 'Loading answers…' : `${answers.length} Answer${answers.length !== 1 ? 's' : ''}`}
          </h2>
          {!aLoading && (
            <button
              id="refresh-answers-btn"
              onClick={handleRefreshAnswers}
              className="p-1.5 rounded-lg text-stone-400 dark:text-neutral-500
                         hover:text-stone-600 dark:hover:text-neutral-300
                         hover:bg-stone-100 dark:hover:bg-neutral-800
                         transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
        </div>

        {aLoading ? (
          <div className="space-y-3 mb-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl overflow-hidden animate-pulse">
                <div className="flex items-center gap-3 px-5 py-3 border-b border-stone-100 dark:border-neutral-800">
                  <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-neutral-700" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 bg-stone-200 dark:bg-neutral-700 rounded-full w-24" />
                    <div className="h-2.5 bg-stone-100 dark:bg-neutral-800 rounded-full w-16" />
                  </div>
                </div>
                <div className="px-5 py-4 space-y-2">
                  <div className="h-3 bg-stone-100 dark:bg-neutral-800 rounded-full w-full" />
                  <div className="h-3 bg-stone-100 dark:bg-neutral-800 rounded-full w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : aError ? (
          <div className="mb-6">
            <Alert type="error" message={`Could not load answers: ${aError}`} />
          </div>
        ) : answers.length === 0 ? (
          <div className="text-center py-10 mb-6">
            <p className="text-stone-400 dark:text-neutral-500 text-sm">
              No answers yet — be the first to help!
            </p>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {answers.map((a, i) => (
              <AnswerCard key={a.id} answer={a} index={i} token={token} />
            ))}
          </div>
        )}

        {!qLoading && !qError && (
          <AnswerForm
            questionId={questionId}
            token={token}
            onPosted={handleAnswerPosted}
          />
        )}
      </div>
    </div>
  )
}
