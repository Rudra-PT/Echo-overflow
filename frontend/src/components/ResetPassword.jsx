import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

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

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
      <span>⚠</span> {message}
    </p>
  );
}

function InputField({ id, name, type = "text", label, placeholder, value, onChange, disabled, error }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-stone-600 mb-1.5">
        {label} <span className="text-amber-600 ml-1">*</span>
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={!!error}
        disabled={disabled}
        className={`w-full px-4 py-3 rounded-xl bg-white border text-stone-800 placeholder-stone-400
          focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400
          disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
          ${error ? "border-red-300 bg-red-50" : "border-stone-200 hover:border-stone-300"}`}
      />
      <FieldError id={`${id}-error`} message={error} />
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

// ─── PasswordStrength indicator ───────────────────────────────────────────────

function PasswordStrength({ password }) {
  if (!password) return null;

  const checks = [
    { label: "8+ characters", pass: password.length >= 8 },
    { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "Lowercase letter", pass: /[a-z]/.test(password) },
    { label: "Number", pass: /\d/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const barColors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-emerald-400", "bg-emerald-500"];

  return (
    <div className="mt-2 space-y-2" aria-label="Password strength">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i < score ? barColors[score] : "bg-stone-200"
            }`}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-0.5">
        {checks.map(({ label, pass }) => (
          <li key={label} className={`text-xs flex items-center gap-1 ${pass ? "text-emerald-600" : "text-stone-400"}`}>
            <span>{pass ? "✓" : "○"}</span> {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── ResetPassword Page ───────────────────────────────────────────────────────

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token") || "";

  const [formData, setFormData] = useState({ newPassword: "", confirmPassword: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // If there is no token in the URL, show an inline error immediately.
  const missingToken = !token;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const errors = {};
    if (!formData.newPassword) {
      errors.newPassword = "New password is required.";
    } else if (formData.newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters.";
    }
    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your new password.";
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const errors = validate();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: formData.newPassword }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data?.detail || `Server error: ${response.status}`);
        return;
      }

      setSuccess(true);
      // Auto-redirect to /login after a short delay so the user can read the message.
      setTimeout(() => navigate("/login", { replace: true }), 3500);
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>

          {/* Header */}
          <div className="mb-7 text-center">
            <h1 className="text-2xl font-bold text-stone-800 tracking-tight">Set a new password</h1>
            <p className="mt-1.5 text-sm text-stone-500">
              Choose a strong password you haven&apos;t used before.
            </p>
          </div>

          {/* ── No token in URL ──────────────────────────────────────────── */}
          {missingToken ? (
            <div className="space-y-4">
              <Alert
                type="error"
                message="This reset link is invalid or has expired. Please request a new one."
              />
              <div className="text-center">
                <Link
                  to="/forgot-password"
                  id="request-new-link"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-500 transition-colors"
                >
                  Request a new reset link →
                </Link>
              </div>
            </div>
          ) : success ? (
            /* ── Success state ─────────────────────────────────────────────── */
            <div className="text-center space-y-4">
              <Alert
                type="success"
                message="Your password has been updated! Redirecting you to Sign In…"
              />
              <Link
                to="/login"
                id="go-to-login"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-500 transition-colors"
              >
                ← Back to Sign In
              </Link>
            </div>
          ) : (
            /* ── Form ──────────────────────────────────────────────────────── */
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}

              <div>
                <InputField
                  id="reset-new-password"
                  name="newPassword"
                  type="password"
                  label="New Password"
                  placeholder="At least 8 characters"
                  value={formData.newPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  error={fieldErrors.newPassword}
                />
                <PasswordStrength password={formData.newPassword} />
              </div>

              <InputField
                id="reset-confirm-password"
                name="confirmPassword"
                type="password"
                label="Confirm New Password"
                placeholder="Re-enter your new password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
                error={fieldErrors.confirmPassword}
              />

              <button
                id="reset-password-submit"
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
                    <Spinner /> Updating password…
                  </span>
                ) : (
                  "Reset Password"
                )}
              </button>

              <p className="text-center text-sm text-stone-500">
                Remembered it?{" "}
                <Link
                  to="/login"
                  id="cancel-reset-link"
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
