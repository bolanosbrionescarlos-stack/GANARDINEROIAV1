import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Wallet from './components/Wallet'
import Investments from './components/Investments'
import Referrals from './components/Referrals'
import Auth from './components/Auth'
import Admin from './components/Admin'
import { API_URL } from './config'
import './index.css'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [user, setUser] = useState(null)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser)
      setUser(parsedUser)
      
      // Validar si el usuario existe en la base de datos actual (evitar sesiones inactivas o obsoletas)
      fetch(`${API_URL}/api/stats/${parsedUser.id}`)
        .then(res => {
          if (res.status === 404) {
            localStorage.removeItem('user')
            setUser(null)
          }
        })
        .catch(err => console.error('Error al validar la sesión:', err))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user')
    setUser(null)
  }

  if (!user) {
    return <Auth onLogin={(userData) => setUser(userData)} />
  }

  return (
    <div className="app-container" style={{ display: 'flex', width: '100%', minHeight: '100vh' }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} user={user} />
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        {activeTab === 'dashboard' && <Dashboard user={user} />}
        {activeTab === 'wallet' && <Wallet user={user} />}
        {activeTab === 'investments' && <Investments user={user} setActiveTab={setActiveTab} />}
        {activeTab === 'referrals' && <Referrals user={user} />}
        {activeTab === 'admin' && <Admin user={user} />}
      </main>
    </div>
  )
}

export default App
