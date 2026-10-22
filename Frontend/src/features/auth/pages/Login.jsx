import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff, Loader2, LockKeyhole, Mail } from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import AuthShell from "../../../components/AuthShell.jsx";
import Toast from "../../../components/Toast.jsx";
import useToast from "../../../hooks/useToast.js";

function Login() {
  const navigate = useNavigate();
  const { handleLogin } = useAuth();
  const { toast, showToast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) return;

    const isEmpty = Object.values(formData).some(
      (value) => value.trim() === "",
    );

    if (isEmpty) {
      showToast("Please fill in all fields.", "error");
      return;
    }

    try {
      setSubmitting(true);

      await handleLogin({
        email: formData.email.trim(),
        password: formData.password,
      });

      localStorage.setItem("isLoggedIn", "true");

      setFormData({
        email: "",
        password: "",
      });

      showToast("Signed in successfully.");
      navigate("/app");
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Login failed. Please try again.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to create and review your interview readiness reports."
      footer={
        <>
          New to GEN+AI?{" "}
          <Link to="/register" className="link">
            Create an account
          </Link>
        </>
      }
    >
      <Toast toast={toast} />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="field">
          <label htmlFor="email" className="label">
            Email address
          </label>

          <div className="input-wrap">
            <Mail size={17} className="input-icon" aria-hidden="true" />

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              className="input input-with-icon"
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="password" className="label">
            Password
          </label>

          <div className="input-wrap">
            <LockKeyhole
              size={17}
              className="input-icon"
              aria-hidden="true"
            />

            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              className="input input-with-icon input-with-action"
            />

            <button
              type="button"
              onClick={() => setShowPassword((previous) => !previous)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="input-action"
            >
              {showPassword ? (
                <EyeOff size={17} aria-hidden="true" />
              ) : (
                <Eye size={17} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() =>
              showToast("Password recovery is not configured yet.", "error")
            }
            className="text-[15px] font-medium text-secondary underline decoration-1 underline-offset-4 transition-colors hover:text-ink"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary btn-block btn-lg"
        >
          {submitting ? (
            <>
              <Loader2 size={17} className="animate-spin" aria-hidden="true" />
              Signing in
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>
    </AuthShell>
  );
}

export default Login;

