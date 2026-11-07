import React from 'react';
import Login from './components/Login';
import Signup from './components/Signup';
import ForgetPass from './components/ForgetPass';
import { Routes, Route } from "react-router-dom";
import Home from './Home';
import GetOtp from './components/GetOtp';
import Navbar from './components/Navbar';
import Aboutus from './components/Aboutus';
import Contact from './components/Contact';
import { AuthProvider } from './AuthContext';
import ResetPass from './components/ResetPass';
export default function App() {


  return (
    <AuthProvider>

      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path='/' element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgetpass" element={<ForgetPass />} />
         <Route path="/resetpass" element={<ResetPass />} />
        <Route path="/getotp" element={<GetOtp />} />
        <Route path="/about" element={<Aboutus />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </AuthProvider>
  );
}
