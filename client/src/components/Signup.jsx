import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import '../App.css';
export function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmpassword: ''
  });
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("")
  const [confirmpasswordError, setConfirmpasswordError] = useState("")
  const [turnstileToken, setTurnstileToken] = useState("");
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }))
    if (name === "email") {
      if (
        value &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ) {
        setEmailError("Invalid email address");
      } else {
        setEmailError("");
      }
    }

    if (name === "password") {
      if (value.length < 4 || value.length > 15) {
        setPasswordError("password length must be between 4 - 15 characters");
      }
      else {
        setPasswordError("");
      }
    }
    if (name === "confirmpassword") {
      if (value.length < 4 || value.length > 15) {
        setConfirmpasswordError("password length must be between 4 - 15 characters");
      }
      else {
        setConfirmpasswordError("");
      }
    }
  }
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = formData.email
    const password = formData.password
    const confirmpassword = formData.confirmpassword
    if (password !== confirmpassword) {
      alert("wrong confirm password")
      return
    }
    try {
      setLoading(true)

      const res = await fetch('http://localhost:3000/auth/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, turnstileToken }),
      })
      const data = await res.json()

      if (!res.ok) {
        alert(data.message)
      } else {

        navigate('/getotp', { state: { email, purpose: "verify-email" } })
      }

    } catch (error) {
      console.log(error)
      alert("Something went wrong")
    } finally {
      setLoading(false)
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-box">
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Sign Up to continue</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
              />
              {emailError && <p className="text-red-500">{emailError}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
              />
              {passwordError && <p className="text-red-500">{passwordError}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="password">Confirm Password</label>
              <input
                type="password"
                id="confirmpassword"
                name="confirmpassword"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                value={formData.confirmpassword}
                onChange={handleChange}
              />
              {confirmpasswordError && <p className="text-red-500">{confirmpasswordError}</p>}
            </div>

            {/* Cloudflare Turnstile */}

            <Turnstile
              siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
              onSuccess={(token) => {
                setTurnstileToken(token);
              }}
              onExpire={() => {
                setTurnstileToken("");
              }}
              onError={() => {
                setTurnstileToken("");
              }}

            />


            <button
              type="submit"
              disabled={loading || !turnstileToken}
              className="login-button"
            >
              {loading ? "Creating..." : "Sign Up"}
            </button>



          </form>

          <div className="signup-link">
            <p>
              Already have an account?{'  '}
              <Link
                to="/login"
                className="link-text"

              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
