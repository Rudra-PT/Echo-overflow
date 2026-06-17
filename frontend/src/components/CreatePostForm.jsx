import { useState } from "react";

const API_BASE_URL = "http://localhost:8000";

export default function CreatePostForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = "Title is required.";
    } else if (formData.title.trim().length < 5) {
      errors.title = "Title must be at least 5 characters.";
    }
    if (!formData.content.trim()) {
      errors.content = "Content is required.";
    } else if (formData.content.trim().length < 10) {
      errors.content = "Content must be at least 10 characters.";
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError(null);
    setSuccessMessage(null);

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      setError("You must be logged in to create a post. Please sign in first.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/questions/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          content: formData.content.trim(),
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError("Your session has expired. Please log in again.");
          return;
        }
        if (response.status === 403) {
          setError("You are not authorised to perform this action.");
          return;
        }
        if (response.status === 422) {
          const data = await response.json();
          const detail = data?.detail;
          if (Array.isArray(detail)) {
            const mapped = {};
            detail.forEach(({ loc, msg }) => {
              const field = loc[loc.length - 1];
              mapped[field] = msg;
            });
            setFieldErrors(mapped);
          } else {
            setError(typeof detail === "string" ? detail : "Validation failed.");
          }
          return;
        }

        const data = await response.json().catch(() => ({}));
        setError(data?.detail || `Server error: ${response.status}`);
        return;
      }

      const newQuestion = await response.json();

      setSuccessMessage(`Question "${newQuestion.title}" posted successfully!`);
      setFormData({ title: "", content: "" });

      if (onSuccess) {
        onSuccess(newQuestion);
      }
    } catch (err) {
      setError(
        "Could not reach the server. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismissError = () => setError(null);
  const handleDismissSuccess = () => setSuccessMessage(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-stone-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-amber-50/80 backdrop-blur-xl border border-stone-200 rounded-2xl shadow-xl shadow-stone-200/60 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-stone-800 tracking-tight">
              Ask a Question
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Be specific and clear — good questions get great answers.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm"
            >
              <svg
                className="w-5 h-5 mt-0.5 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="flex-1">{error}</span>
              <button
                onClick={handleDismissError}
                aria-label="Dismiss error"
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                ✕
              </button>
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="flex items-start gap-3 mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm"
            >
              <svg
                className="w-5 h-5 mt-0.5 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="flex-1">{successMessage}</span>
              <button
                onClick={handleDismissSuccess}
                aria-label="Dismiss success message"
                className="text-emerald-500 hover:text-emerald-700 transition-colors"
              >
                ✕
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <div>
              <label
                htmlFor="question-title"
                className="block text-sm font-medium text-stone-600 mb-1.5"
              >
                Title
                <span className="text-amber-600 ml-1">*</span>
              </label>
              <input
                id="question-title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. How do I reverse a string in Python?"
                aria-describedby={fieldErrors.title ? "title-error" : undefined}
                aria-invalid={!!fieldErrors.title}
                disabled={isLoading}
                className={`w-full px-4 py-3 rounded-xl bg-white border text-stone-800 placeholder-stone-400
                  focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400
                  disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                  ${
                    fieldErrors.title
                      ? "border-red-300 bg-red-50"
                      : "border-stone-200 hover:border-stone-300"
                  }`}
              />
              {fieldErrors.title && (
                <p
                  id="title-error"
                  role="alert"
                  className="mt-1.5 text-xs text-red-600 flex items-center gap-1"
                >
                  <span>⚠</span> {fieldErrors.title}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="question-content"
                className="block text-sm font-medium text-stone-600 mb-1.5"
              >
                Body
                <span className="text-amber-600 ml-1">*</span>
              </label>
              <textarea
                id="question-content"
                name="content"
                rows={8}
                value={formData.content}
                onChange={handleChange}
                placeholder="Describe your problem in detail. Include what you've tried, what you expected, and what actually happened..."
                aria-describedby={fieldErrors.content ? "content-error" : undefined}
                aria-invalid={!!fieldErrors.content}
                disabled={isLoading}
                className={`w-full px-4 py-3 rounded-xl bg-white border text-stone-800 placeholder-stone-400
                  focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400
                  disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 resize-y
                  ${
                    fieldErrors.content
                      ? "border-red-300 bg-red-50"
                      : "border-stone-200 hover:border-stone-300"
                  }`}
              />
              <div className="flex justify-between items-center mt-1.5">
                {fieldErrors.content ? (
                  <p
                    id="content-error"
                    role="alert"
                    className="text-xs text-red-600 flex items-center gap-1"
                  >
                    <span>⚠</span> {fieldErrors.content}
                  </p>
                ) : (
                  <span />
                )}
                <span className="text-xs text-stone-400 tabular-nums">
                  {formData.content.length} chars
                </span>
              </div>
            </div>

            <button
              id="submit-question"
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
                  <svg
                    className="animate-spin h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Posting…
                </span>
              ) : (
                "Post Your Question"
              )}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-stone-400">
          Your JWT token is read automatically from{" "}
          <code className="text-stone-500">localStorage["access_token"]</code>.
        </p>
      </div>
    </div>
  );
}
