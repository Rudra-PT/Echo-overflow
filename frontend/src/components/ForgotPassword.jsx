import { useState } from "react";
import { Link } from "react-router-dom";

const API_BASE_URL = "http://localhost:8000";

// ─── Shared UI primitives (mirror AuthForm.jsx) ───────────────────────────────

function Alert({ type, message, onDismiss }) {
  const styles =
    type === "error"
      ? {
          wrap: "bg-red-50 border-red-200 text-red-700",
          btn: "text-red-400 hover:text-red-600",
          icon: (
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          ),
        }
      : {
          wrap: "bg-emerald-50 border-emerald-200 text-emerald-700",
          btn: "text-emerald-500 hover:text-emerald-700",
          icon: (
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          ),
        };

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 mb-6 p-4 rounded-xl border text-sm ${styles.wrap}`}
    >
      <svg className="w-5 h-5 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        {styles.icon}
      </svg>
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} aria-label="Dismiss" className={`transition-colors ${styles.btn}`}>
          ✕
        </button>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

// ─── ForgotPassword Page ──────────────────────────────────────────────────────

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) return "Email is required.";
    if (!emailRe.test(email.trim())) return "Please enter a valid email address.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const err = validate();
    if (err) { setEmailError(err); return; }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data?.detail || `Server error: ${response.status}`);
        return;
      }

      // Always show the generic success state regardless of whether the email
      // exists – prevents email enumeration.
      setSubmitted(true);
    } catch {
      setError("Could not reach the server. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-amber-50/80 backdrop-blur-xl border border-stone-200 rounded-2xl shadow-xl shadow-stone-200/60 p-8">

          {/* Icon */}
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 border border-amber-200 mb-6 mx-auto">
            <svg className="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          {/* Header */}
          <div className="mb-7 text-center">
            <h1 className="text-2xl font-bold text-stone-800 tracking-tight">Forgot your password?</h1>
            <p className="mt-1.5 text-sm text-stone-500">
              Enter your account email and we&apos;ll send you a reset link.
            </p>
          </div>

          {submitted ? (
            /* ── Success state ─────────────────────────────────────────────── */
            <div className="text-center space-y-5">
              <Alert
                type="success"
                message="Check your inbox (or the server terminal in dev mode) for the reset link. It expires in 15 minutes."
              />
              <Link
                to="/login"
                id="back-to-login-link"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-500 transition-colors"
              >
                ← Back to Sign In
              </Link>
            </div>
          ) : (
            /* ── Form ──────────────────────────────────────────────────────── */
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}

              {/* Email field */}
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-stone-600 mb-1.5">
                  Email address <span className="text-amber-600 ml-1">*</span>
                </label>
                <input
                  id="forgot-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError("");
                  }}
                  placeholder="you@example.com"
                  aria-describedby={emailError ? "forgot-email-error" : undefined}
                  aria-invalid={!!emailError}
                  disabled={isLoading}
                  className={`w-full px-4 py-3 rounded-xl bg-white border text-stone-800 placeholder-stone-400
                    focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400
                    disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                    ${emailError ? "border-red-300 bg-red-50" : "border-stone-200 hover:border-stone-300"}`}
                />
                {emailError && (
                  <p id="forgot-email-error" role="alert" className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <span>⚠</span> {emailError}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                id="forgot-password-submit"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-6 rounded-xl font-semibold text-white
                  bg-gradient-to-r from-amber-500 to-orange-400
                  hover:from-amber-400 hover:to-orange-300
                  focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-amber-50
                  disabled:opacity-60 disabled:cursor-not-allowed
                  active:scale-[0.98] transition-all duration-200 shadow-lg shadow-amber-200/60"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner /> Sending…
                  </span>
                ) : (
                  "Send Reset Link"
                )}
              </button>

              {/* Back link */}
              <p className="text-center text-sm text-stone-500">
                Remembered it?{" "}
                <Link
                  to="/login"
                  id="back-to-login-inline"
                  className="text-amber-600 font-medium hover:text-amber-500 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
