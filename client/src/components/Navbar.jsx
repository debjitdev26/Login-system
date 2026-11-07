import React from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../AuthContext'
const Navbar = () => {
    // Get authentication data and functions from AuthContext
    const { user, login, logout } = useAuth();

    const isLoggedIn = Boolean(user)
    return (
        <div className='absolute top-0 flex bg-black text-white justify-between w-full left-0' style={{ padding: 24 }}
        >
            <div className='flex gap-3 bg-black text-white font-medium left-0'>
                <Link to={'/'}>
                    <div>Home</div>
                </Link>
                <Link to={'/about'}>

                    <div>About Us</div>
                </Link>
                <Link to={'/contact'}>
                    <div>Contact Us</div>
                </Link>
            </div>
            <div className='flex gap-3 bg-black text-white font-medium text-lg right-3'>
                {
                    isLoggedIn ? (
                        <div className='flex gap-2'>

                            <button className='text-blue-500'>{user.email}</button>
                            <p className='text-2xl'>|</p>
                            <button onClick={logout} className='text-red-500 cursor-pointer hover:scale-105'>Log out</button>
                        </div>
                    ) : (
                        <Link to={'/login'}>
                            <button className='text-red-600'>Log In</button>
                        </Link>
                    )
                }

            </div>

        </div>
    )
}

export default Navbar


