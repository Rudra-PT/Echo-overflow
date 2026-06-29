import { useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom'

import Navbar         from './components/Navbar'
import QuestionList   from './components/QuestionList'
import QuestionDetail from './components/QuestionDetail'
import AuthForm       from './components/AuthForm'
import CreatePostForm from './components/CreatePostForm'
import ForgotPassword from './components/ForgotPassword'
import ResetPassword  from './components/ResetPassword'

// ─── Page wrappers ────────────────────────────────────────────────────────────

/**
 * /  →  QuestionFeed
 * Passes the current token so the list can send an Authorization header,
 * and a callback so clicking a card navigates to /question/:id.
 */
function FeedPage({ token }) {
  const navigate = useNavigate()
  return (
    <QuestionList
      token={token}
      onSelectQuestion={(q) => navigate(`/question/${q.id}`, { state: { question: q } })}
    />
  )
}

/**
 * /question/:id  →  QuestionDetail
 * The component already reads the id from props; we pull it from the URL.
 */
function DetailPage({ token }) {
  const navigate = useNavigate()
  const { id } = useParams()
  return (
    <QuestionDetail
      questionId={Number(id)}
      token={token}
      onBack={() => navigate('/')}
    />
  )
}

/**
 * /login  →  AuthForm
 * On successful login navigate back to the feed.
 * On successful sign-up stay on the page (user can now log in).
 */
function LoginPage({ onLoginSuccess }) {
  return (
    <AuthForm
      onLoginSuccess={onLoginSuccess}
      onSignUpSuccess={() => {/* stay – show success message inside the form */}}
    />
  )
}

/**
 * /forgot-password  →  ForgotPassword
 */
function ForgotPasswordPage() {
  return <ForgotPassword />
}

/**
 * /reset-password  →  ResetPassword
 * The token is read from the query-string inside the component itself.
 */
function ResetPasswordPage() {
  return <ResetPassword />
}

/**
 * /ask  →  CreatePostForm
 * Guard: if there is no token redirect to /login.
 */
function AskPage({ token }) {
  const navigate = useNavigate()
  if (!token) return <Navigate to="/login" replace />
  return (
    <CreatePostForm
      onSuccess={() => navigate('/')}
    />
  )
}

// ─── Layout shell ─────────────────────────────────────────────────────────────

function Layout({ children, token, onLogout }) {
  return (
    <div id="app-root" className="min-h-screen bg-stone-50 dark:bg-neutral-950 transition-colors duration-200">
      <Navbar token={token} onLogout={onLogout} />
      <main id="main-content" className="w-full">
        {children}
      </main>
    </div>
  )
}

// ─── Root App ─────────────────────────────────────────────────────────────────

function AppRoutes() {
  const navigate = useNavigate()

  // Token is the single source of truth; derived from localStorage on mount.
  const [token, setToken] = useState(() => localStorage.getItem('access_token') || null)

  const handleLoginSuccess = useCallback((t) => {
    setToken(t)
    navigate('/', { replace: true })
  }, [navigate])

  const handleLogout = useCallback(() => {
    setToken(null)
  }, [])

  return (
    <Layout token={token} onLogout={handleLogout}>
      <Routes>
        {/* Feed */}
        <Route path="/"            element={<FeedPage token={token} />} />

        {/* Auth */}
        <Route path="/login"          element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />

        {/* Ask a question (protected) */}
        <Route path="/ask"         element={<AskPage token={token} />} />

        {/* Question detail */}
        <Route path="/question/:id" element={<DetailPage token={token} />} />

        {/* Fallback */}
        <Route path="*"            element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
