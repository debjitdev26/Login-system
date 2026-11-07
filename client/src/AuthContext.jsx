import React from "react";
import { useContext, createContext, useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

import api from "./api.js";
import { Turnstile } from '@marsidev/react-turnstile';

const AuthContext = createContext()
export function AuthProvider({ children }) {

    const [user, setUser] = useState(null)
    const [accessToken, setAccessToken] = useState(null)

    // Restore the session when AuthProvider mounts.



    useEffect(() => {
        let cancelled = false;

        const restoreSession = async () => {
            try {
                const res = await api.post("/auth/api/refresh-token");

                const newAccessToken = res.data.accessToken;

                if (!newAccessToken) {
                    throw new Error("Refresh response did not include an access token");
                }

                if (!cancelled) {
                    setAccessToken(newAccessToken);
                }
            } catch (error) {
                if (!cancelled) {
                    setAccessToken(null);
                    setUser(null);

                    // A 401 here usually means there is no valid refresh-token cookie.
                    if (error.response?.status !== 401) {
                        console.error("Session restore failed:", error);
                    }
                }
            }
        };

        restoreSession();

        return () => {
            cancelled = true;
        };
    }, []);


    // Fetch the user after a successful login or session restore.
    useEffect(() => {
        if (!accessToken) return;
        let cancelled = false
        const fetchProfile = async () => {
            try {
                const res = await api.get("/auth/api/getme", {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    }
                })
                if (!cancelled) {

                    setUser(res.data.user)
                }
            } catch (error) {
                if (!cancelled) {

                    console.error("Profile fetch failed: ", error);
                }
            }
        }

        fetchProfile()
        return () => {
            cancelled = true
        }



    }, [accessToken])


    const verifyOtp = async (email, otp, purpose) => {
        const res = await api.post("/auth/api/verifyemail", { email, otp, purpose })
        setAccessToken(res.data.accessToken)
        setUser(res.data.user)
        return res
    }


    const login = async (email, password, turnstileToken) => {
        const res = await api.post("/auth/api/login", { email, password, turnstileToken })

        setAccessToken(res.data.accessToken)
        setUser(res.data.user)
        return res
    }


    const logout = async () => {
        await api.post("/auth/api/logout")
        setAccessToken(null)
        setUser(null)
    }

    // Refresh the access token if a protected request gets a 401.
    useEffect(() => {

        const interceptorId = api.interceptors.response.use(   //interceptor to automatically refresh the access token
            response => response,
            async (error) => {
                const originalRequest = error.config   // Store the failed request so it can be retried after refreshing the access token
                // Skip refresh logic if:
                if (error.response?.status !== 401 || !originalRequest || originalRequest._retry || originalRequest.url.includes("/auth/api/login") || originalRequest.url.includes("/auth/api/refresh-token") || originalRequest.url.includes("/auth/api/verifyemail")) {

                    return Promise.reject(error);
                }
                originalRequest._retry = true   // Mark the request as retried to prevent infinite refresh loops

                try {
                    const res = await api.post("/auth/api/refresh-token");
                    const newAccessToken = res.data.accessToken
                    if (!newAccessToken) {
                        throw new Error("Refresh response did not include an access token");
                    }
                    setAccessToken(newAccessToken)
                    originalRequest.headers = originalRequest.headers ?? {};
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return api.request(originalRequest)  // Retry the failed request with the refreshed access token
                } catch (refreshError) {
                    setAccessToken(null);
                    setUser(null);
                    return Promise.reject(refreshError);
                }
            }
        );
        return () => {
            // Remove the response interceptor when the component unmounts
            // to prevent duplicate interceptors and memory leaks
            api.interceptors.response.eject(interceptorId);
        };

    }, [])


    return (
        <AuthContext.Provider value={{ user, accessToken, login, logout, verifyOtp }}>
            {children}
        </AuthContext.Provider>
    );



}

// Access AuthContext values and methods
export function useAuth() {
    return useContext(AuthContext)
}





