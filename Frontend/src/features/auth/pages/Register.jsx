import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff, Loader2, Lock, Mail, UserRound } from "lucide-react";

import { useAuth } from "../hooks/useAuth.js";
import AuthShell from "../../../components/AuthShell.jsx";
import Toast from "../../../components/Toast.jsx";
import useToast from "../../../hooks/useToast.js";

function Register() {
  const navigate = useNavigate();
  const { handleRegister } = useAuth();
  const { toast, showToast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
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

    if (formData.password !== formData.confirmPassword) {
      showToast("Passwords do not match.", "error");
      return;
    }

    try {
      setSubmitting(true);

      await handleRegister({
        username: formData.name,
        email: formData.email,
        password: formData.password,
      });

      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      showToast("Account created successfully.");
      navigate("/app");
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Registration failed.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start with your resume and the role you are targeting."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="link">
            Sign in
          </Link>
        </>
      }
    >
      <Toast toast={toast} />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="field">
          <label htmlFor="name" className="label">
            Name
          </label>

          <div className="input-wrap">
            <UserRound size={17} className="input-icon" aria-hidden="true" />

            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              required
              className="input input-with-icon"
            />
          </div>
        </div>

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
            <Lock size={17} className="input-icon" aria-hidden="true" />

            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
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

        <div className="field">
          <label htmlFor="confirmPassword" className="label">
            Confirm password
          </label>

          <div className="input-wrap">
            <Lock size={17} className="input-icon" aria-hidden="true" />

            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
              className="input input-with-icon input-with-action"
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword((previous) => !previous)
              }
              aria-label={
                showConfirmPassword
                  ? "Hide confirmed password"
                  : "Show confirmed password"
              }
              aria-pressed={showConfirmPassword}
              className="input-action"
            >
              {showConfirmPassword ? (
                <EyeOff size={17} aria-hidden="true" />
              ) : (
                <Eye size={17} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary btn-block btn-lg"
        >
          {submitting ? (
            <>
              <Loader2 size={17} className="animate-spin" aria-hidden="true" />
              Creating account
            </>
          ) : (
            "Create account"
          )}
        </button>
      </form>
    </AuthShell>
  );
}

export default Register;
