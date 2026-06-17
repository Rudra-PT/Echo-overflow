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

function getPreview(content, max = 200) {
  if (!content) return ''
  const t = content.trim()
  return t.length <= max ? t : t.slice(0, max).trimEnd() + '…'
}

const AVATAR_PALETTES = [
  'from-amber-400 to-orange-400',
  'from-rose-400 to-pink-500',
  'from-violet-400 to-purple-500',
  'from-sky-400 to-blue-500',
  'from-emerald-400 to-teal-500',
  'from-fuchsia-400 to-pink-400',
]
function avatarGradient(userId) { return AVATAR_PALETTES[userId % AVATAR_PALETTES.length] }

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

// ─── Skeleton post ────────────────────────────────────────────────────────────

function SkeletonPost() {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 rounded-2xl overflow-hidden animate-pulse">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-100 dark:border-neutral-800">
        <div className="w-9 h-9 rounded-full bg-stone-200 dark:bg-neutral-700" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3 bg-stone-200 dark:bg-neutral-700 rounded-full w-28" />
          <div className="h-2.5 bg-stone-100 dark:bg-neutral-800 rounded-full w-20" />
        </div>
      </div>
      <div className="px-5 py-4 space-y-2">
        <div className="h-4 bg-stone-200 dark:bg-neutral-700 rounded-full w-3/4" />
        <div className="h-3 bg-stone-100 dark:bg-neutral-800 rounded-full w-full" />
        <div className="h-3 bg-stone-100 dark:bg-neutral-800 rounded-full w-5/6" />
      </div>
      <div className="px-5 py-3 border-t border-stone-100 dark:border-neutral-800 flex gap-4">
        <div className="h-3 bg-stone-100 dark:bg-neutral-800 rounded-full w-16" />
        <div className="h-3 bg-stone-100 dark:bg-neutral-800 rounded-full w-16" />
      </div>
    </div>
  )
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({ question, onClick }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = question.content.trim().length > 200

  return (
    <article
      id={`question-post-${question.id}`}
      className="bg-white dark:bg-neutral-900
                 border border-stone-200 dark:border-neutral-800 rounded-2xl overflow-hidden
                 hover:border-amber-300 dark:hover:border-neutral-600
                 hover:shadow-md hover:shadow-amber-100/50 dark:hover:shadow-black/30
                 transition-all duration-200 group"
    >
      {/* ── Header ─── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGradient(question.user_id)}
                           flex items-center justify-center text-white text-xs font-bold shrink-0`}>
            U{question.user_id}
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-800 dark:text-neutral-100 leading-none">
              User #{question.user_id}
            </p>
            <p className="text-[11px] text-stone-400 dark:text-neutral-500 mt-0.5">
              {timeAgo(question.created_at)}
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

      {/* ── Body ─── */}
      <div className="px-5 py-4">
        <button
          onClick={() => onClick(question)}
          className="w-full text-left mb-2 focus:outline-none focus-visible:underline"
        >
          <h2 className="text-sm font-semibold text-stone-800 dark:text-neutral-100 leading-snug
                         group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors duration-200">
            {question.title}
          </h2>
        </button>
        <p className="text-xs text-stone-500 dark:text-neutral-400 leading-relaxed">
          {isLong && !expanded ? getPreview(question.content) : question.content.trim()}
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-500 font-medium transition-colors"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* ── Footer ─── */}
      <div className="px-5 py-3 border-t border-stone-100 dark:border-neutral-800 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-[11px] text-stone-400 dark:text-neutral-500">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formatDate(question.created_at)}
        </span>
        <button
          onClick={() => onClick(question)}
          className="inline-flex items-center gap-1 text-[11px] font-medium
                     text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300
                     transition-colors duration-150"
        >
          View question
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </article>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-400/10
                      border border-amber-200 dark:border-amber-400/30
                      flex items-center justify-center mb-4">
        <svg className="w-7 h-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-stone-700 dark:text-neutral-300 font-semibold mb-1">No questions yet</h3>
      <p className="text-stone-400 dark:text-neutral-500 text-sm max-w-xs">
        Questions from the community will appear here.
      </p>
    </div>
  )
}

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-400/10
                      border border-red-200 dark:border-red-400/30
                      flex items-center justify-center mb-4">
        <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <h3 className="text-stone-700 dark:text-neutral-300 font-semibold mb-1">Failed to load questions</h3>
      <p className="text-stone-400 dark:text-neutral-500 text-sm mb-5 max-w-xs">{message}</p>
      <button
        id="retry-fetch-btn"
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-sm
                   bg-gradient-to-r from-amber-500 to-orange-400
                   hover:from-amber-400 hover:to-orange-300
                   focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2
                   active:scale-[0.98] transition-all duration-200 shadow-lg shadow-amber-200/60"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Retry
      </button>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QuestionList({ onSelectQuestion, token }) {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchQuestions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${API_BASE}/questions/`, { headers })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d?.detail || `HTTP ${res.status}`)
      }
      setQuestions(await res.json())
    } catch (err) {
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchQuestions() }, [fetchQuestions])

  const handleSelect = (q) => {
    if (typeof onSelectQuestion === 'function') onSelectQuestion(q)
    else console.log('Selected question:', q)
  }

  const filtered = questions.filter((q) =>
    q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen
                    bg-gradient-to-br from-amber-50 via-orange-50 to-stone-100
                    dark:bg-none dark:bg-black
                    py-10 px-4 transition-colors duration-300">
      <div className="max-w-xl mx-auto">

        {/* ── Feed header ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-stone-800 dark:text-neutral-100 tracking-tight">
              Questions
            </h1>
            <p className="text-xs text-stone-400 dark:text-neutral-500 mt-0.5">
              EchoOverflow community feed
            </p>
          </div>
          <button
            id="refresh-questions-btn"
            onClick={fetchQuestions}
            disabled={loading}
            title="Refresh feed"
            className="p-2.5 rounded-xl bg-white dark:bg-neutral-900
                       border border-stone-200 dark:border-neutral-800
                       text-stone-500 dark:text-neutral-400
                       hover:border-stone-300 dark:hover:border-neutral-700
                       hover:text-stone-700 dark:hover:text-neutral-200
                       disabled:opacity-40 disabled:cursor-not-allowed
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400
                       transition-all duration-200"
          >
            {loading ? <Spinner /> : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </button>
        </div>

        {/* ── Search ── */}
        <div className="relative mb-6">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-neutral-500"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            id="question-search-input"
            type="text"
            placeholder="Search questions…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm
                       bg-white dark:bg-neutral-900
                       border border-stone-200 dark:border-neutral-800
                       text-stone-800 dark:text-neutral-100
                       placeholder-stone-400 dark:placeholder-neutral-600
                       hover:border-stone-300 dark:hover:border-neutral-700
                       focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400
                       transition-all duration-200"
          />
        </div>

        {/* Count / clear */}
        {!loading && !error && questions.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-stone-400 dark:text-neutral-500">
              {filtered.length === questions.length
                ? `${questions.length} post${questions.length !== 1 ? 's' : ''}`
                : `${filtered.length} of ${questions.length} posts`}
            </span>
            {searchTerm && filtered.length !== questions.length && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-500 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* ── Feed ── */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <SkeletonPost key={i} />)}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchQuestions} />
        ) : questions.length === 0 ? (
          <EmptyState />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-stone-400 dark:text-neutral-500 text-sm">
            No posts match{' '}
            <span className="text-stone-600 dark:text-neutral-300 font-medium">"{searchTerm}"</span>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((q) => (
              <PostCard key={q.id} question={q} onClick={handleSelect} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
