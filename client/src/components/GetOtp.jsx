import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useLocation } from "react-router-dom";
import { useAuth } from '../AuthContext';
import '../App.css';
export function GetOtp() {
    const { verifyOtp } = useAuth()    // Get auth functions from AuthContext
    const navigate = useNavigate()  //used for navigation between routes
    let location = useLocation()    // Access route state passed from the previous page
    const [formData, setFormData] = useState({
        otp: ""
    });
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("");
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((currentData) => ({ ...currentData, [name]: value }));
        if (name === "otp") {
            if (!/^\d*$/.test(value)) {
                setError("Only numbers are allowed");
            } else if (value.length > 0 && value.length !== 6) {
                setError("OTP must be 6 digits");
            } else if (value.length > 6) {
                return;
            }
            else {
                setError("");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const email = location.state?.email    // Get the email passed from the previous page via route state
        const purpose = location.state?.purpose
        const otp = formData.otp
        try {
            setLoading(true)
            if (purpose === "reset-password") {

                const res = await fetch('http://localhost:3000/auth/api/verifyemail', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, otp, purpose }),
                })
                const data = await res.json()
                const resetToken = data.resetToken  //get resetToken which contains the data which will be use for reset password 
                if (res.ok) {
                    if (purpose === "reset-password") {

                        alert(data.message)
                        navigate('/resetpass', { state: { resetToken } })  // Redirect to resetpassword page with the verified resetToken 

                    }


                } else {
                    alert(data.message)
                }
            }
            if (purpose === "verify-email") {

                const res = await verifyOtp(email, otp, purpose)  // Send OTP verification request and receive user/session data
                if (res.status >= 200 && res.status < 300) {

                    navigate('/')
                    alert(res.data.message)
                } else {
                    alert(res.data.message)
                }
            }
        } catch (error) {
            console.log(error)
            alert(
                error.response?.data?.message ??
                "Invalid OTP"
            );
        }
    };

    const handleResendOtp = async (e) => {
        e.preventDefault()
        const email = location.state?.email
        const purpose = location.state?.purpose

        try {
            setLoading(false)
            const res = await fetch('http://localhost:3000/auth/api/resend-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, purpose }),
            })
            const data = await res.json()
            if (res.ok) {
                alert(data.message)
            } else {
                alert(data.message)
            }
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-box">
                    <h1 className="login-title">Enter OTP and verify account</h1>

                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email">OTP</label>

                            <input
                                type="text"
                                id="otp"
                                name="otp"
                                placeholder="Enter your OTP"
                                required
                                value={formData.otp}
                                onChange={handleChange}
                            />
                            {error && <p className="text-red-500">{error}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="login-button"
                        >
                            {loading ? "loading..." : "Submit"}
                        </button>


                    </form>
                    <button onClick={handleResendOtp} className='text-sm hover:scale-105 cursor-pointer flex justify-end text-violet-300' style={{ padding: "10px" }}>
                        Resend OTP
                    </button>


                </div>
            </div>
        </div>
    );
}

export default GetOtp;
