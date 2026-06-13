import React, { useState, useEffect } from 'react'
import { ShieldAlert, Check, X, ArrowDownLeft, ArrowUpRight, Loader, AlertCircle } from 'lucide-react'
import { API_URL } from '../config'

const Admin = ({ user }) => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [actioningId, setActioningId] = useState(null)
  const [message, setMessage] = useState('')

  const fetchTransactions = () => {
    setLoading(true)
    fetch(`${API_URL}/api/admin/transactions`)
      .then(res => res.json())
      .then(data => {
        setTransactions(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  const handleApprove = (id) => {
    setActioningId(id)
    fetch(`${API_URL}/api/admin/approve-transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId: id })
    })
      .then(res => res.json())
      .then(data => {
        setActioningId(null)
        if (data.success) {
          setMessage('Transacción aprobada con éxito.')
          fetchTransactions()
          setTimeout(() => setMessage(''), 3000)
        } else {
          alert(data.error || 'Error al aprobar la transacción')
        }
      })
      .catch(err => {
        setActioningId(null)
        console.error(err)
      })
  }

  const handleReject = (id) => {
    setActioningId(id)
    fetch(`${API_URL}/api/admin/reject-transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId: id })
    })
      .then(res => res.json())
      .then(data => {
        setActioningId(null)
        if (data.success) {
          setMessage('Transacción rechazada con éxito.')
          fetchTransactions()
          setTimeout(() => setMessage(''), 3000)
        } else {
          alert(data.error || 'Error al rechazar la transacción')
        }
      })
      .catch(err => {
        setActioningId(null)
        console.error(err)
      })
  }

  const deposits = transactions.filter(t => t.type.startsWith('Depósito'))
  const withdrawals = transactions.filter(t => t.type.startsWith('Retiro'))

  const totalPendingDeposits = deposits.reduce((acc, curr) => acc + parseFloat(curr.amount.replace('+', '') || 0), 0)
  const totalPendingWithdrawals = withdrawals.reduce((acc, curr) => acc + Math.abs(parseFloat(curr.amount || 0)), 0)

  return (
    <div className="fade-in">
      <header style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldAlert size={32} style={{ color: 'var(--primary)' }} />
          Panel de Administración
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>Gestiona y aprueba los depósitos y retiros de los usuarios de EarnFlow.</p>
      </header>

      {message && (
        <div style={{
          backgroundColor: 'rgba(0, 255, 136, 0.1)',
          border: '1px solid var(--primary)',
          color: 'var(--primary)',
          padding: '12px 20px',
          borderRadius: '10px',
          marginBottom: '20px',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {message}
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <div className="glass-card" style={{ padding: '24px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>Solicitudes Pendientes</p>
          <h3 style={{ fontSize: '28px', fontWeight: '800' }}>{transactions.length}</h3>
        </div>
        <div className="glass-card" style={{ padding: '24px', borderLeft: '3px solid var(--primary)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>Total Depósitos Pendientes</p>
          <h3 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--primary)' }}>${totalPendingDeposits.toFixed(2)} USD</h3>
        </div>
        <div className="glass-card" style={{ padding: '24px', borderLeft: '3px solid #ff4d4d' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>Total Retiros Pendientes</p>
          <h3 style={{ fontSize: '28px', fontWeight: '800', color: '#ff4d4d' }}>${totalPendingWithdrawals.toFixed(2)} USD</h3>
        </div>
      </div>

      {/* Table section */}
      <section className="glass-card" style={{ padding: '30px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>Solicitudes en Espera</h3>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <Loader size={32} className="spin" style={{ color: 'var(--primary)' }} />
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>No hay solicitudes pendientes.</p>
            <p style={{ fontSize: '13px' }}>Todos los depósitos y retiros están al día.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '14px' }}>Usuario</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '14px' }}>Tipo</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '14px' }}>Monto</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '14px' }}>Fecha</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600', fontSize: '14px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isDeposit = tx.type.startsWith('Depósito')
                  return (
                    <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background-color 0.2s' }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.01)'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: '600' }}>{tx.full_name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>@{tx.username}</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                          <span style={{
                            width: '24px', height: '24px', borderRadius: '6px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backgroundColor: isDeposit ? 'rgba(0,255,136,0.1)' : 'rgba(255,77,77,0.1)',
                            color: isDeposit ? 'var(--primary)' : '#ff4d4d'
                          }}>
                            {isDeposit ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                          </span>
                          {tx.type}
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontWeight: '700', color: isDeposit ? 'var(--primary)' : '#fff', fontSize: '15px' }}>
                        {tx.amount}
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                        {tx.date}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => handleApprove(tx.id)}
                            disabled={actioningId === tx.id}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: 'rgba(0, 255, 136, 0.1)',
                              color: 'var(--primary)',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '13px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.25s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
                            onMouseOverCapture={(e) => e.currentTarget.style.color = '#000'}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(0, 255, 136, 0.1)'
                              e.currentTarget.style.color = 'var(--primary)'
                            }}
                          >
                            <Check size={14} />
                            Aprobar
                          </button>
                          <button
                            onClick={() => handleReject(tx.id)}
                            disabled={actioningId === tx.id}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: 'rgba(255, 77, 77, 0.1)',
                              color: '#ff4d4d',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '13px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.25s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#ff4d4d'}
                            onMouseOverCapture={(e) => e.currentTarget.style.color = '#fff'}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 77, 77, 0.1)'
                              e.currentTarget.style.color = '#ff4d4d'
                            }}
                          >
                            <X size={14} />
                            Rechazar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export default Admin
