import React from 'react'
import { useAuth } from './AuthContext'
const Home = () => {
  const {user} = useAuth()
  return (
      <div>
          Welcome {user?.email} to this Home page
    </div>
  )
}

export default Home
