import { useState } from "react";
import { Link } from "react-router-dom";

const API_BASE_URL = "http://localhost:8000";

// ─── Shared UI helpers ────────────────────────────────────────────────────────

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
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className={`transition-colors ${styles.btn}`}
      >
        ✕
      </button>
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

function InputField({ id, name, type = "text", label, placeholder, value, onChange, disabled, error, required = true }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-stone-600 mb-1.5">
        {label}
        {required && <span className="text-amber-600 ml-1">*</span>}
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

// ─── Login Form ───────────────────────────────────────────────────────────────

function LoginForm({ onSuccess }) {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const errors = {};
    if (!formData.username.trim()) errors.username = "Username or email is required.";
    if (!formData.password) errors.password = "Password is required.";
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const errors = validate();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }

    setIsLoading(true);
    try {
      // OAuth2PasswordRequestForm expects application/x-www-form-urlencoded
      const body = new URLSearchParams();
      body.append("username", formData.username.trim());
      body.append("password", formData.password);

      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 403 || response.status === 401) {
          setError(data?.detail || "Invalid credentials. Please check your username and password.");
        } else if (response.status === 422) {
          const detail = data?.detail;
          if (Array.isArray(detail)) {
            const mapped = {};
            detail.forEach(({ loc, msg }) => { mapped[loc[loc.length - 1]] = msg; });
            setFieldErrors(mapped);
          } else {
            setError(typeof detail === "string" ? detail : "Validation failed.");
          }
        } else {
          setError(data?.detail || `Server error: ${response.status}`);
        }
        return;
      }

      const { access_token } = await response.json();
      localStorage.setItem("access_token", access_token);

      if (onSuccess) onSuccess(access_token);
    } catch {
      setError("Could not reach the server. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}

      <InputField
        id="login-username"
        name="username"
        label="Username or Email"
        placeholder="e.g. johndoe or john@example.com"
        value={formData.username}
        onChange={handleChange}
        disabled={isLoading}
        error={fieldErrors.username}
      />

      <InputField
        id="login-password"
        name="password"
        type="password"
        label="Password"
        placeholder="Your password"
        value={formData.password}
        onChange={handleChange}
        disabled={isLoading}
        error={fieldErrors.password}
      />

      {/* Forgot password link */}
      <div className="flex justify-end -mt-2">
        <Link
          to="/forgot-password"
          id="forgot-password-link"
          className="text-xs text-amber-600 font-medium hover:text-amber-500 transition-colors"
        >
          Forgot password?
        </Link>
      </div>

      <button
        id="login-submit"
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
            <Spinner /> Signing in…
          </span>
        ) : (
          "Sign In"
        )}
      </button>
    </form>
  );
}

// ─── Sign Up Form ─────────────────────────────────────────────────────────────

function SignUpForm({ onSuccess }) {
  const [formData, setFormData] = useState({ email: "", username: "", password: "", confirmPassword: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const errors = {};
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      errors.email = "Email is required.";
    } else if (!emailRe.test(formData.email.trim())) {
      errors.email = "Please enter a valid email address.";
    } else if (formData.email.trim().length > 100) {
      errors.email = "Email must be 100 characters or fewer.";
    }

    if (!formData.username.trim()) {
      errors.username = "Username is required.";
    } else if (formData.username.trim().length > 50) {
      errors.username = "Username must be 50 characters or fewer.";
    }

    if (!formData.password) {
      errors.password = "Password is required.";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const errors = validate();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email.trim(),
          username: formData.username.trim(),
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 400) {
          setError(data?.detail || "Username or email is already registered.");
        } else if (response.status === 422) {
          const detail = data?.detail;
          if (Array.isArray(detail)) {
            const mapped = {};
            detail.forEach(({ loc, msg }) => { mapped[loc[loc.length - 1]] = msg; });
            setFieldErrors(mapped);
          } else {
            setError(typeof detail === "string" ? detail : "Validation failed.");
          }
        } else {
          setError(data?.detail || `Server error: ${response.status}`);
        }
        return;
      }

      const newUser = await response.json();
      setSuccessMessage(`Account created for ${newUser.username}! You can now sign in.`);
      setFormData({ email: "", username: "", password: "", confirmPassword: "" });

      if (onSuccess) onSuccess(newUser);
    } catch {
      setError("Could not reach the server. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}
      {successMessage && <Alert type="success" message={successMessage} onDismiss={() => setSuccessMessage(null)} />}

      <InputField
        id="signup-email"
        name="email"
        type="email"
        label="Email"
        placeholder="you@example.com"
        value={formData.email}
        onChange={handleChange}
        disabled={isLoading}
        error={fieldErrors.email}
      />

      <InputField
        id="signup-username"
        name="username"
        label="Username"
        placeholder="e.g. johndoe"
        value={formData.username}
        onChange={handleChange}
        disabled={isLoading}
        error={fieldErrors.username}
      />

      <InputField
        id="signup-password"
        name="password"
        type="password"
        label="Password"
        placeholder="At least 8 characters"
        value={formData.password}
        onChange={handleChange}
        disabled={isLoading}
        error={fieldErrors.password}
      />

      <InputField
        id="signup-confirm-password"
        name="confirmPassword"
        type="password"
        label="Confirm Password"
        placeholder="Re-enter your password"
        value={formData.confirmPassword}
        onChange={handleChange}
        disabled={isLoading}
        error={fieldErrors.confirmPassword}
      />

      <button
        id="signup-submit"
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
            <Spinner /> Creating account…
          </span>
        ) : (
          "Create Account"
        )}
      </button>
    </form>
  );
}

// ─── Main AuthForm Component ──────────────────────────────────────────────────

export default function AuthForm({ onLoginSuccess, onSignUpSuccess }) {
  const [activeTab, setActiveTab] = useState("login"); // "login" | "signup"

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-amber-50/80 backdrop-blur-xl border border-stone-200 rounded-2xl shadow-xl shadow-stone-200/60 p-8">

          {/* Header */}
          <div className="mb-7">
            <h1 className="text-3xl font-bold text-stone-800 tracking-tight">
              {activeTab === "login" ? "Welcome back" : "Create an account"}
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              {activeTab === "login"
                ? "Sign in to continue to EchoOverflow."
                : "Join EchoOverflow and start asking questions."}
            </p>
          </div>

          {/* Tab Toggle */}
          <div
            role="tablist"
            aria-label="Authentication mode"
            className="flex bg-stone-100 rounded-xl p-1 mb-7 gap-1"
          >
            <button
              id="tab-login"
              role="tab"
              aria-selected={activeTab === "login"}
              aria-controls="panel-login"
              onClick={() => setActiveTab("login")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200
                ${activeTab === "login"
                  ? "bg-white text-amber-600 shadow-sm shadow-stone-200/70"
                  : "text-stone-500 hover:text-stone-700"
                }`}
            >
              Sign In
            </button>
            <button
              id="tab-signup"
              role="tab"
              aria-selected={activeTab === "signup"}
              aria-controls="panel-signup"
              onClick={() => setActiveTab("signup")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200
                ${activeTab === "signup"
                  ? "bg-white text-amber-600 shadow-sm shadow-stone-200/70"
                  : "text-stone-500 hover:text-stone-700"
                }`}
            >
              Sign Up
            </button>
          </div>

          {/* Panels */}
          <div
            id="panel-login"
            role="tabpanel"
            aria-labelledby="tab-login"
            hidden={activeTab !== "login"}
          >
            <LoginForm onSuccess={onLoginSuccess} />
          </div>

          <div
            id="panel-signup"
            role="tabpanel"
            aria-labelledby="tab-signup"
            hidden={activeTab !== "signup"}
          >
            <SignUpForm onSuccess={onSignUpSuccess} />
          </div>

          {/* Footer toggle link */}
          <p className="mt-6 text-center text-sm text-stone-500">
            {activeTab === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  id="switch-to-signup"
                  onClick={() => setActiveTab("signup")}
                  className="text-amber-600 font-medium hover:text-amber-500 transition-colors"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  id="switch-to-login"
                  onClick={() => setActiveTab("login")}
                  className="text-amber-600 font-medium hover:text-amber-500 transition-colors"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-stone-400">
          On sign-in, your token is saved to{" "}
          <code className="text-stone-500">localStorage["access_token"]</code>.
        </p>
      </div>
    </div>
  );
}
