import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useLocation } from "react-router-dom";
import '../App.css';
export function ForgetPass() {
    const navigate = useNavigate()
    let location = useLocation()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        email: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((currentData) => ({ ...currentData, [name]: value }));
        if (name === "email") {
            if (
                value &&
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)    //email format
            ) {
                setEmailError("Invalid email address");
            } else {
                setEmailError("");
            }
        }
    };

    const handleSubmit = async (e) => {
        const email = formData.email
        e.preventDefault();


        try {
            setLoading(true)
            const res = await fetch("http://localhost:3000/auth/api/verify-for-resetpass", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })
            const data = await res.json()
            if (!res.ok) {
                alert(data.message)
            } else {
                navigate('/getotp', { state: { email, purpose: "reset-password" } })   // Redirect to getotp page with the email and purpose
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
                    <h1 className="login-title">Enter Email and verify account</h1>

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
                            {error && <p className="text-red-500">{error}</p>}
                        </div>

                        <button disabled={loading} type="submit" className="login-button">
                            {loading ? "Sending..." : "Send"}
                        </button>


                    </form>


                </div>
            </div>
        </div>
    );
}

export default ForgetPass;
