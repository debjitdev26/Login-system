import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useLocation } from "react-router-dom";
import '../App.css';
export function ResetPass() {
    let location = useLocation() // Access route state passed from the previous page
    const navigate = useNavigate()  //used for navigation between routes
    const [loading, setLoading] = useState(false)
    const [passwordError, setPasswordError] = useState("")
    const [confirmPasswordError, setConfirmPasswordError] = useState("")
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((currentData) => ({ ...currentData, [name]: value }));
        if (name === "password") {
            if (value.length < 4 || value.length > 15) {
                setPasswordError("password length must be between 4 - 15 characters");
            }
            else {
                setPasswordError("");
            }
        }
        if (name === "confirmPassword") {
            if (value.length < 4 || value.length > 15) {
                setConfirmPasswordError("Confirm password length must be between 4 - 15 characters");
            }
            else {
                setConfirmPasswordError("");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const resetToken = location.state?.resetToken
        const password = formData.password
        const confirmPassword = formData.confirmPassword


        if (password !== confirmPassword) {
            alert("wrong confirm password")
            return
        }

        try {
            setLoading(true)
            const res = await fetch("http://localhost:3000/auth/api/reset-pass", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resetToken, password }),
            })
            const data = await res.json()
            if (!res.ok) {
                alert(data.message)
            } else {
                navigate('/login')
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
                    <h1 className="login-title">Enter new Password for your account</h1>

                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                placeholder="Enter password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                            />
                            {passwordError && <p className="text-red-500">{passwordError}</p>}
                            <label htmlFor="email">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                placeholder="Enter confirm Password"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                            {confirmPasswordError && <p className="text-red-500">{confirmPasswordError}</p>}
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

export default ResetPass;
