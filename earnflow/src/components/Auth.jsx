import React, { useState } from 'react'
import { User, Lock, Mail, Gift } from 'lucide-react'
import { API_URL } from '../config'

const Auth = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')

  // Parse referrer from URL query param ?ref=username
  const urlParams = new URLSearchParams(window.location.search)
  const referrerFromUrl = urlParams.get('ref') || ''
  const [referrer] = useState(referrerFromUrl)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    const endpoint = isLogin ? '/api/login' : '/api/register'
    const body = isLogin
      ? { username, password }
      : { username, password, full_name: fullName, referrer: referrer || undefined }

    fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) setError(data.error)
      else if (data.success) {
        const userData = isLogin ? data.user : { id: data.userId, username, full_name: fullName }
        localStorage.setItem('user', JSON.stringify(userData))
        onLogin(userData)
      }
    })
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100%',
      background: 'var(--bg-dark)'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '10px' }}>EarnFlow</h1>
          <p style={{ color: 'var(--text-muted)' }}>{isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta gratuita'}</p>
        </div>

        {/* Referral Banner */}
        {!isLogin && referrer && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'rgba(0, 255, 136, 0.07)',
            border: '1px solid rgba(0, 255, 136, 0.2)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '20px'
          }}>
            <Gift size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)', marginBottom: '2px' }}>¡Invitado por {referrer}!</p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tu referidor recibirá un bono de $1.00 USD al registrarte.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
          {!isLogin && (
            <div className="glass" style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', gap: '12px' }}>
              <User size={18} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Nombre Completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={{ background: 'none', border: 'none', color: '#fff', outline: 'none', width: '100%' }}
              />
            </div>
          )}
          <div className="glass" style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', gap: '12px' }}>
            <Mail size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Nombre de Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ background: 'none', border: 'none', color: '#fff', outline: 'none', width: '100%' }}
            />
          </div>
          <div className="glass" style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', gap: '12px' }}>
            <Lock size={18} color="var(--text-muted)" />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ background: 'none', border: 'none', color: '#fff', outline: 'none', width: '100%' }}
            />
          </div>

          {error && <p style={{ color: '#ff4d4d', fontSize: '13px', textAlign: 'center' }}>{error}</p>}

          <button type="submit" style={{
            padding: '14px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: 'var(--primary)',
            color: '#000',
            fontWeight: '700',
            cursor: 'pointer',
            marginTop: '10px'
          }}>
            {isLogin ? 'Entrar' : 'Registrarse'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-muted)', fontSize: '14px' }}>
          {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
          <button
            onClick={() => setIsLogin(!isLogin)}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer', marginLeft: '5px' }}
          >
            {isLogin ? 'Regístrate' : 'Inicia Sesión'}
          </button>
        </p>
      </div>
    </div>
  )
}

export default Auth
