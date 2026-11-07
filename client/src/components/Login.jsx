import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';
import { useNavigate } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import { useAuth } from '../AuthContext';
function UserLogin() {
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("")
  const [turnstileToken, setTurnstileToken] = useState("");
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target;
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const email = formData.email
    const password = formData.password
    try {
      setLoading(true)
      const res = await login(email, password, turnstileToken)
      if (res.status >= 200 && res.status < 300) {

        navigate('/')
        alert(res.data.message)
      } else {
        alert(res.data.message)
      }
    } catch (error) {
      alert(error.response?.data?.message ?? "Login failed")
      console.log(error)
    } finally {
      setLoading(false)
    }
    // try {
    //   setLoading(true)
    //   const res = await fetch('http://localhost:3000/auth/api/login', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ email, password, turnstileToken }),
    //   })
    //   const data = await res.json()
    //   if (res.ok) {
    //     navigate('/')
    //     alert(data.message)
    //   } else {
    //     alert(data.message)
    //   }
    // } catch (error) {
    //   console.log(error)
    // }

  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-box">
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Sign in to continue</p>

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
              {loading ? "loading..." : "Sign In"}
            </button>

            <div className="forgot-password">
              <Link
                to={"/forgetpass"}
                className="link-text"

              >
                Forgot password?
              </Link>
            </div>
          </form>

          <div className="signup-link">
            <p>
              Don't have an account?{' '}
              <Link
                to={"/signup"}
                className="link-text"

              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserLogin;
