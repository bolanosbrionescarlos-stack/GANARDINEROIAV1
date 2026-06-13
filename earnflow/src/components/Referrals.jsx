import React, { useState, useEffect } from 'react'
import { Users, Copy, Check, Gift, TrendingUp, Link, UserPlus, Star, DollarSign } from 'lucide-react'
import { API_URL } from '../config'

const Referrals = ({ user }) => {
  const [referrals, setReferrals] = useState([])
  const [stats, setStats] = useState(null)
  const [copied, setCopied] = useState(false)

  const referralLink = `${window.location.origin}/?ref=${user.username}`

  const fetchData = () => {
    fetch(`${API_URL}/api/referrals/${user.id}`)
      .then(res => res.json())
      .then(data => setReferrals(data || []))

    fetch(`${API_URL}/api/stats/${user.id}`)
      .then(res => res.json())
      .then(data => setStats(data))
  }

  useEffect(() => {
    fetchData()
  }, [user.id])

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const totalEarned = referrals.length * 1.00

  const steps = [
    {
      icon: Link,
      color: '#00ff88',
      title: 'Comparte tu link',
      desc: 'Copia tu enlace de referido único y compártelo con amigos por WhatsApp, redes sociales o donde quieras.'
    },
    {
      icon: UserPlus,
      color: '#00ccff',
      title: 'Tu amigo se registra',
      desc: 'Cuando tu amigo use tu link y se registre en EarnFlow, quedará vinculado a tu cuenta de referidos.'
    },
    {
      icon: DollarSign,
      color: '#ffd700',
      title: 'Gana $1.00 al instante',
      desc: 'En el momento que tu amigo complete su registro, recibirás automáticamente $1.00 USD en tu billetera.'
    },
    {
      icon: Star,
      color: '#ff66cc',
      title: 'Sin límites',
      desc: 'Puedes referir a tantas personas como quieras. No hay tope de ganancias por referidos.'
    }
  ]

  return (
    <div className="fade-in">
      <header style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>Plan de Referidos</h2>
        <p style={{ color: 'var(--text-muted)' }}>Invita amigos y gana <strong style={{ color: 'var(--primary)' }}>$1.00 USD</strong> por cada registro exitoso.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', alignItems: 'start' }}>

        {/* Left Side */}
        <div>
          {/* Referral Link Box */}
          <div className="glass-card" style={{
            background: 'linear-gradient(135deg, rgba(0,255,136,0.08) 0%, rgba(0,0,0,0) 100%)',
            marginBottom: '30px',
            padding: '30px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>Tu Enlace de Referido</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
              Comparte este link. Cuando alguien se registre usando tu enlace, ganarás $1.00 USD automáticamente.
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '14px 18px',
              marginBottom: '16px'
            }}>
              <Link size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span style={{
                flex: 1,
                fontSize: '13px',
                fontFamily: 'monospace',
                color: '#fff',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {referralLink}
              </span>
              <button
                onClick={copyLink}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: copied ? 'rgba(0,255,136,0.2)' : 'var(--primary)',
                  color: copied ? 'var(--primary)' : '#000',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  whiteSpace: 'nowrap'
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? '¡Copiado!' : 'Copiar'}
              </button>
            </div>

            {/* Share buttons */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <a
                href={`https://wa.me/?text=Únete%20a%20EarnFlow%20y%20gana%20dinero%20desde%20casa!%20Usa%20mi%20enlace%3A%20${encodeURIComponent(referralLink)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(37, 211, 102, 0.3)',
                  backgroundColor: 'rgba(37, 211, 102, 0.07)',
                  color: '#25d366',
                  fontSize: '12px',
                  fontWeight: '700',
                  textDecoration: 'none',
                  transition: 'all 0.2s'
                }}
              >
                📱 Compartir por WhatsApp
              </a>
              <button
                onClick={() => {
                  const text = `¡Únete a EarnFlow y gana dinero desde casa! Usa mi enlace: ${referralLink}`
                  navigator.share ? navigator.share({ title: 'EarnFlow', text, url: referralLink }) : copyLink()
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                🔗 Compartir Enlace
              </button>
            </div>
          </div>

          {/* How it works */}
          <div className="glass-card" style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>¿Cómo Funciona?</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {steps.map((step, i) => (
                <div key={i} style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '16px',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  borderRadius: '12px',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: `${step.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: step.color,
                    flexShrink: 0
                  }}>
                    <step.icon size={18} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '4px', color: '#fff' }}>{step.title}</h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.5' }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Referred Users Table */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Mis Referidos</h3>
              <span style={{
                backgroundColor: 'rgba(0,255,136,0.1)',
                color: 'var(--primary)',
                fontSize: '12px',
                fontWeight: '700',
                padding: '4px 12px',
                borderRadius: '20px'
              }}>
                {referrals.length} total
              </span>
            </div>

            {referrals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <Users size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>Aún no tienes referidos</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '300px', margin: '0 auto' }}>
                  Comparte tu enlace de arriba para comenzar a ganar $1.00 USD por cada persona que se registre.
                </p>
              </div>
            ) : (
              <div>
                {/* Table header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  padding: '10px 16px',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  borderBottom: '1px solid var(--border)',
                  marginBottom: '8px'
                }}>
                  <span>Usuario</span>
                  <span style={{ textAlign: 'center' }}>Estado</span>
                  <span style={{ textAlign: 'right' }}>Comisión</span>
                </div>
                {referrals.map((ref, i) => (
                  <div key={i} style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    padding: '14px 16px',
                    alignItems: 'center',
                    borderRadius: '10px',
                    transition: 'background 0.2s'
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(0,255,136,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: '700',
                        color: 'var(--primary)'
                      }}>
                        {ref.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{ref.username}</p>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{ref.full_name || '-'}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: 'rgba(0,255,136,0.1)',
                        color: 'var(--primary)',
                        padding: '3px 10px',
                        borderRadius: '20px'
                      }}>Activo</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)' }}>+$1.00</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Stats Panel */}
        <div>
          <div className="glass-card" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>Resumen de Referidos</h3>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(0,255,136,0.1), transparent)',
                border: '1px solid rgba(0,255,136,0.15)',
                borderRadius: '14px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Total Ganado</p>
                <h4 style={{ fontSize: '36px', fontWeight: '800', color: 'var(--primary)' }}>
                  ${totalEarned.toFixed(2)}
                </h4>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>en bonos de referido</p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px'
              }}>
                <div className="glass" style={{ padding: '16px', textAlign: 'center', borderRadius: '12px' }}>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Referidos</p>
                  <p style={{ fontSize: '24px', fontWeight: '800', color: '#fff' }}>{referrals.length}</p>
                </div>
                <div className="glass" style={{ padding: '16px', textAlign: 'center', borderRadius: '12px' }}>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Por Referido</p>
                  <p style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary)' }}>$1</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bonus info card */}
          <div className="glass-card" style={{
            background: 'linear-gradient(135deg, rgba(255, 204, 0, 0.06), transparent)',
            border: '1px solid rgba(255,204,0,0.15)'
          }}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <Gift size={20} style={{ color: '#ffcc00', flexShrink: 0 }} />
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#ffcc00' }}>Bono por Nivel</h4>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { range: '1 - 5 referidos', bonus: '$1.00 c/u', color: '#aaa' },
                { range: '6 - 20 referidos', bonus: '$1.00 c/u', color: '#c0c0c0' },
                { range: '21+ referidos', bonus: '$1.00 c/u', color: '#ffd700' }
              ].map((level, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px'
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>{level.range}</span>
                  <span style={{ color: level.color, fontWeight: '700' }}>{level.bonus}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '14px', lineHeight: '1.5' }}>
              * Los bonos se acreditan de forma instantánea al completarse el registro de tu referido.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Referrals
