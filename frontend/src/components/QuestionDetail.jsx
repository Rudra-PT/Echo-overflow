import { useState, useEffect, useCallback } from 'react'

const API_BASE = 'http://localhost:8000'

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner({ sm }) {
  const size = sm ? 'h-4 w-4' : 'h-5 w-5'
  return (
    <svg className={`animate-spin ${size}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

// ─── Alert banner ─────────────────────────────────────────────────────────────

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

// ─── Upvote button ────────────────────────────────────────────────────────────

function UpvoteButton({ answerId, token }) {
  const [voted, setVoted] = useState(false)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const handleVote = async () => {
    if (!token || loading) return

    const nextDir = voted ? 0 : 1
    setLoading(true)

    // Optimistic update
    setVoted(!voted)
    setCount((c) => c + (nextDir === 1 ? 1 : -1))

    try {
      const res = await fetch(`${API_BASE}/vote/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ answer_id: answerId, dir: nextDir }),
      })

      // 409 = already voted, 404 = no vote — both are soft signals, no revert needed
      if (!res.ok && res.status !== 409 && res.status !== 404) {
        setVoted(voted)
        setCount((c) => c + (nextDir === 1 ? -1 : 1))
      }
    } catch {
      setVoted(voted)
      setCount((c) => c + (nextDir === 1 ? -1 : 1))
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      id={`upvote-answer-${answerId}`}
      onClick={handleVote}
      disabled={loading || !token}
      title={!token ? 'Log in to upvote' : voted ? 'Remove upvote' : 'Upvote this answer'}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold
                  border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400
                  disabled:cursor-not-allowed select-none active:scale-95
                  ${voted
                    ? 'bg-yellow-400 border-yellow-400 text-stone-900 hover:bg-yellow-300 hover:border-yellow-300 dark:bg-yellow-400 dark:border-yellow-400 dark:text-stone-900 dark:hover:bg-yellow-300'
                    : 'bg-white border-stone-200 text-stone-500 hover:border-yellow-400 hover:text-yellow-600 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-yellow-500 dark:hover:text-yellow-400'
                  }`}
    >
      {loading ? (
        <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      ) : (
        <svg
          className={`w-3 h-3 transition-transform duration-150 ${voted ? 'scale-110' : ''}`}
          fill={voted ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        </svg>
      )}
      {count > 0 && <span>{count}</span>}
    </button>
  )
}

// ─── Answer card ──────────────────────────────────────────────────────────────

function AnswerCard({ answer, index, token }) {
  return (
    <div
      id={`answer-${answer.id}`}
      className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-stone-100 dark:border-neutral-800 bg-stone-50/60 dark:bg-neutral-800/40">
        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarGradient(answer.user_id)}
                         flex items-center justify-center text-white text-xs font-bold shrink-0`}>
          U{answer.user_id}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-stone-700 dark:text-neutral-300 leading-none">
            User #{answer.user_id}
          </p>
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

      {/* Body */}
      <div className="px-5 py-4">
        <p className="text-sm text-stone-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
          {answer.content}
        </p>
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 border-t border-stone-100 dark:border-neutral-800 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-[11px] text-stone-400 dark:text-neutral-500">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formatDate(answer.created_at)}
        </span>
        <UpvoteButton answerId={answer.id} token={token} />
      </div>
    </div>
  )
}

// ─── Answer form ──────────────────────────────────────────────────────────────

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
          'Authorization': `Bearer ${token}`,
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
      {/* Form header */}
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QuestionDetail({ questionId, token, onBack }) {
  const [question, setQuestion] = useState(null)
  const [answers, setAnswers] = useState([])
  const [qLoading, setQLoading] = useState(true)
  const [aLoading, setALoading] = useState(true)
  const [qError, setQError] = useState(null)
  const [aError, setAError] = useState(null)

  const fetchQuestion = useCallback(async () => {
    setQLoading(true)
    setQError(null)
    try {
      const res = await fetch(`${API_BASE}/questions/${questionId}`)
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d?.detail || `HTTP ${res.status}`)
      }
      setQuestion(await res.json())
    } catch (err) {
      setQError(err.message)
    } finally {
      setQLoading(false)
    }
  }, [questionId])

  const fetchAnswers = useCallback(async () => {
    setALoading(true)
    setAError(null)
    try {
      const res = await fetch(`${API_BASE}/answers/question/${questionId}`)
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d?.detail || `HTTP ${res.status}`)
      }
      setAnswers(await res.json())
    } catch (err) {
      setAError(err.message)
    } finally {
      setALoading(false)
    }
  }, [questionId])

  useEffect(() => {
    fetchQuestion()
    fetchAnswers()
  }, [fetchQuestion, fetchAnswers])

  const handleAnswerPosted = (newAnswer) => {
    setAnswers((prev) => [...prev, newAnswer])
  }

  return (
    <div className="min-h-screen
                    bg-gradient-to-br from-amber-50 via-orange-50 to-stone-100
                    dark:bg-none dark:bg-black
                    py-10 px-4 transition-colors duration-300">
      <div className="max-w-xl mx-auto">

        {/* ── Back button ── */}
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

        {/* ── Question card ── */}
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
            {/* Question header */}
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

            {/* Question body */}
            <div className="px-5 py-5">
              <h1 className="text-base font-bold text-stone-800 dark:text-neutral-100 leading-snug mb-3">
                {question.title}
              </h1>
              <p className="text-sm text-stone-600 dark:text-neutral-400 leading-relaxed whitespace-pre-wrap">
                {question.content}
              </p>
            </div>

            {/* Question footer */}
            <div className="px-5 py-3 border-t border-stone-100 dark:border-neutral-800 flex items-center gap-2 text-[11px] text-stone-400 dark:text-neutral-500">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              {answers.length} answer{answers.length !== 1 ? 's' : ''}
            </div>
          </article>
        )}

        {/* ── Answers section header ── */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-700 dark:text-neutral-300">
            {aLoading ? 'Loading answers…' : `${answers.length} Answer${answers.length !== 1 ? 's' : ''}`}
          </h2>
          {!aLoading && (
            <button
              id="refresh-answers-btn"
              onClick={fetchAnswers}
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

        {/* ── Answers list ── */}
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

        {/* ── Post answer form ── */}
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
