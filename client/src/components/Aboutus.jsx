import React from 'react'
import { useAuth } from '../AuthContext'
const Aboutus = () => {
  const {user}= useAuth()
  return (
    <div>
      welcome {user?.email} to About Us page
    </div>
  )
}

export default Aboutus
