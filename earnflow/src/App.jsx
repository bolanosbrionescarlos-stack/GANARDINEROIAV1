import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Wallet from './components/Wallet'
import Investments from './components/Investments'
import Referrals from './components/Referrals'
import Auth from './components/Auth'
import Admin from './components/Admin'
import './index.css'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [user, setUser] = useState(null)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) setUser(JSON.parse(savedUser))
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
