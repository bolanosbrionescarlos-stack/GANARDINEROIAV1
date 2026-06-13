import React, { useState, useEffect } from 'react'
import { ArrowUpRight, ArrowDownLeft, CreditCard, Landmark, Coins, Copy, Check, X,
         Bitcoin, Wallet2, ChevronDown, AlertCircle, ShieldCheck, Play } from 'lucide-react'
import { API_URL } from '../config'

/* ─────────── helpers ─────────── */
const cryptoNetworks = ['Bitcoin (BTC)', 'Ethereum (ERC-20)', 'USDT (TRC-20)', 'USDT (BEP-20)', 'BNB (BEP-20)', 'Solana (SOL)']
const cardBanks = ['BCP', 'Interbank', 'BBVA', 'Scotiabank', 'Yape (Billetera)', 'Plin (Billetera)', 'Otro']

const modalOverlay = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.85)',
  backdropFilter: 'blur(10px)',
  display: 'flex', justifyContent: 'center', alignItems: 'center',
  zIndex: 1000, padding: '20px',
  animation: 'fadeIn 0.25s ease-out'
}

const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: '10px',
  backgroundColor: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff', fontSize: '14px', outline: 'none',
}

const labelStyle = {
  display: 'block', fontSize: '12px',
  color: 'rgba(255,255,255,0.5)',
  marginBottom: '6px', fontWeight: '500'
}

/* ─────────── MAIN COMPONENT ─────────── */
const Wallet = ({ user }) => {
  const [statsData, setStatsData] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [activeTab, setActiveTab] = useState('withdraw')

  /* Deposit modal */
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [depositMethod, setDepositMethod] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [referenceCode, setReferenceCode] = useState('')
  const [voucherFile, setVoucherFile] = useState(null)
  const [copiedPhone, setCopiedPhone] = useState(false)
  const [copiedName, setCopiedName] = useState(false)
  const [depositSuccess, setDepositSuccess] = useState(false)
  const [depositSubmitting, setDepositSubmitting] = useState(false)

  /* Withdraw modal */
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawMethod, setWithdrawMethod] = useState(null)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawSuccess, setWithdrawSuccess] = useState(false)
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false)
  const [withdrawError, setWithdrawError] = useState('')
  // PayPal fields
  const [paypalEmail, setPaypalEmail] = useState('')
  const [paypalName, setPaypalName] = useState('')
  // Crypto fields
  const [cryptoAddress, setCryptoAddress] = useState('')
  const [cryptoNetwork, setCryptoNetwork] = useState(cryptoNetworks[0])
  // Card fields
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardBank, setCardBank] = useState(cardBanks[0])
  const [cardDni, setCardDni] = useState('')

  const reloadData = () => {
    fetch(`${API_URL}/api/stats/${user.id}`).then(r => r.json()).then(d => setStatsData(d))
    fetch(`${API_URL}/api/transactions/${user.id}`).then(r => r.json()).then(d => setTransactions(d))
  }

  useEffect(() => { reloadData() }, [user.id])

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text)
    if (type === 'phone') { setCopiedPhone(true); setTimeout(() => setCopiedPhone(false), 2000) }
    else { setCopiedName(true); setTimeout(() => setCopiedName(false), 2000) }
  }

  /* ── Deposit submit ── */
  const handleDepositSubmit = (e) => {
    e.preventDefault()
    setDepositSubmitting(true)
    fetch(`${API_URL}/api/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, method: depositMethod, amount: parseFloat(depositAmount), reference: referenceCode })
    }).then(r => r.json()).then(data => {
      setDepositSubmitting(false)
      if (data.success) {
        setDepositSuccess(true)
        reloadData()
        setTimeout(() => { setShowDepositModal(false); setDepositSuccess(false); setDepositAmount(''); setReferenceCode(''); setVoucherFile(null) }, 3500)
      }
    })
  }

  /* ── Withdraw submit ── */
  const handleWithdrawSubmit = (e) => {
    e.preventDefault()
    setWithdrawError('')
    const amt = parseFloat(withdrawAmount)
    if (!amt || amt < 5) { setWithdrawError('El monto mínimo de retiro es $5.00 USD'); return }
    if (amt > (statsData?.balance || 0)) { setWithdrawError('Saldo insuficiente para realizar este retiro'); return }

    setWithdrawSubmitting(true)
    fetch(`${API_URL}/api/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        method: withdrawMethod?.name,
        amount: amt,
        destination: withdrawMethod?.name === 'PayPal' ? paypalEmail
          : withdrawMethod?.name === 'Crypto' ? cryptoAddress
          : cardNumber
      })
    }).then(r => r.json()).then(data => {
      setWithdrawSubmitting(false)
      if (data.success) {
        setWithdrawSuccess(true)
        reloadData()
        setTimeout(() => {
          setShowWithdrawModal(false); setWithdrawSuccess(false)
          setWithdrawAmount(''); setPaypalEmail(''); setPaypalName('')
          setCryptoAddress(''); setCardNumber(''); setCardName(''); setCardDni('')
        }, 3500)
      } else {
        setWithdrawError(data.error || 'Ocurrió un error al procesar el retiro')
      }
    })
  }

  const withdrawalMethods = [
    {
      name: 'PayPal',
      icon: '🅿️',
      time: '1-3 días',
      color: '#003087',
      accent: '#009cde',
      desc: 'Recibe en tu cuenta PayPal verificada',
      minAmount: 10,
      fee: '2.5% comisión'
    },
    {
      name: 'Crypto',
      icon: '₿',
      time: 'Instantáneo',
      color: '#f7931a',
      accent: '#f7931a',
      desc: 'BTC, ETH, USDT, BNB, SOL y más',
      minAmount: 20,
      fee: 'Red blockchain'
    },
    {
      name: 'Tarjeta / Banco',
      icon: '🏦',
      time: '2-5 días',
      color: '#1a73e8',
      accent: '#4285f4',
      desc: 'Depósito directo a tu cuenta bancaria',
      minAmount: 5,
      fee: 'Sin comisión'
    },
  ]

  const depositMethods = [
    { name: 'Yape', icon: Landmark, time: 'Instantáneo', color: '#8d167f' },
    { name: 'Plin', icon: Landmark, time: 'Instantáneo', color: '#00d1ce' },
    { name: 'Tarjeta', icon: CreditCard, time: 'Instantáneo', color: 'var(--primary)' },
  ]

  return (
    <div className="fade-in">
      <header style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>Tu Billetera</h2>
        <p style={{ color: 'var(--text-muted)' }}>Gestiona tus ingresos y retiros de forma segura.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
        <div>
          {/* Balance card */}
          <div className="glass-card" style={{
            background: 'linear-gradient(135deg, rgba(0,255,136,0.1) 0%, rgba(0,0,0,0) 100%)',
            padding: '40px', marginBottom: '30px'
          }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '10px' }}>Saldo Disponible</p>
            <h3 style={{ fontSize: '48px', fontWeight: '800', marginBottom: '30px' }}>
              ${statsData?.balance?.toFixed(2) || '0.00'}
            </h3>
            <div style={{ display: 'flex', gap: '15px' }}>
              {['deposit','withdraw'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  flex: 1, padding: '15px', borderRadius: '12px',
                  border: activeTab === tab ? '2px solid var(--primary)' : '1px solid var(--border)',
                  backgroundColor: activeTab === tab ? 'rgba(0,255,136,0.1)' : 'transparent',
                  color: '#fff', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s'
                }}>
                  {tab === 'deposit' ? 'Depositar' : 'Retirar Fondos'}
                </button>
              ))}
            </div>
          </div>

          {/* Transactions */}
          <section>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>Transacciones Recientes</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {transactions.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No hay transacciones aún.</p>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="glass" style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: tx.amount?.startsWith('+') ? 'var(--primary)' : '#ff4d4d'
                      }}>
                        {tx.amount?.startsWith('+') ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '15px', fontWeight: '600' }}>{tx.type}</h4>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{tx.date}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '16px', fontWeight: '700', color: tx.amount?.startsWith('+') ? 'var(--primary)' : '#fff' }}>
                        {tx.amount}
                      </p>
                      <p style={{ fontSize: '12px', color: tx.status === 'Completado' ? '#00ccff' : '#ffcc00' }}>{tx.status}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right panel */}
        <div>
          <section className="glass-card" style={{ height: 'fit-content' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
              {activeTab === 'deposit' ? 'Métodos de Depósito' : 'Métodos de Retiro'}
            </h3>

            {activeTab === 'deposit' ? (
              /* ── DEPOSIT METHODS ── */
              <div style={{ display: 'grid', gap: '15px' }}>
                {depositMethods.map((method, i) => (
                  <div key={i}
                    onClick={() => {
                      if (method.name === 'Yape' || method.name === 'Plin') {
                        setDepositMethod(method.name); setShowDepositModal(true)
                      }
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '15px',
                      padding: '12px', borderRadius: '12px',
                      border: '1px solid var(--border)',
                      cursor: method.name !== 'Tarjeta' ? 'pointer' : 'default',
                      transition: 'transform 0.2s'
                    }}
                    onMouseOver={(e) => { if (method.name !== 'Tarjeta') e.currentTarget.style.transform = 'translateX(4px)' }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'translateX(0)' }}
                  >
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '8px',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: method.color
                    }}>
                      <method.icon size={24} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: '600' }}>{method.name}</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{method.time}</p>
                    </div>
                  </div>
                ))}
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px', lineHeight: '1.5' }}>
                  * Los depósitos por Yape y Plin se validan mediante captura de pantalla del comprobante.
                </p>
              </div>
            ) : (
              /* ── WITHDRAWAL METHODS ── */
              <div style={{ display: 'grid', gap: '14px' }}>
                {withdrawalMethods.map((method, i) => (
                  <div key={i}
                    onClick={() => { setWithdrawMethod(method); setShowWithdrawModal(true); setWithdrawError('') }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      padding: '14px', borderRadius: '14px',
                      border: `1px solid rgba(255,255,255,0.07)`,
                      background: 'rgba(255,255,255,0.02)',
                      cursor: 'pointer', transition: 'all 0.25s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = method.accent + '55'
                      e.currentTarget.style.background = method.accent + '10'
                      e.currentTarget.style.transform = 'translateX(4px)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                      e.currentTarget.style.transform = 'translateX(0)'
                    }}
                  >
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '10px',
                      background: `linear-gradient(135deg, ${method.color}30, ${method.accent}20)`,
                      border: `1px solid ${method.accent}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '20px', flexShrink: 0
                    }}>
                      {method.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '2px' }}>{method.name}</h4>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{method.desc}</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: '11px', fontWeight: '700', color: method.accent }}>{method.time}</p>
                      <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{method.fee}</p>
                    </div>
                  </div>
                ))}
                <div style={{
                  marginTop: '8px', padding: '12px', borderRadius: '10px',
                  background: 'rgba(255,204,0,0.05)', border: '1px solid rgba(255,204,0,0.15)'
                }}>
                  <p style={{ fontSize: '11px', color: '#ffcc00', fontWeight: '600', marginBottom: '4px' }}>ℹ️ Información de Retiros</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                    Mínimo $5.00 USD · Los retiros en proceso pueden tardar según el método elegido.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* ════════════════════════════════════
           DEPOSIT MODAL (Yape / Plin)
          ════════════════════════════════════ */}
      {showDepositModal && (
        <div style={modalOverlay}>
          <div className="glass-card" style={{
            width: '100%', maxWidth: '480px', backgroundColor: '#0a0d14',
            border: '1px solid rgba(255,255,255,0.1)', padding: '30px',
            borderRadius: '24px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <button onClick={() => setShowDepositModal(false)} style={{
              position: 'absolute', top: '18px', right: '18px',
              background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px',
              color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', display: 'flex'
            }}><X size={16} /></button>

            {depositSuccess ? (
              <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                <div style={{
                  width: '70px', height: '70px', borderRadius: '50%',
                  backgroundColor: 'rgba(0,255,136,0.1)', color: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
                }}>
                  <Check size={40} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px' }}>¡Depósito registrado!</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.6' }}>
                  Tu comprobante está siendo verificado. El saldo se acreditará en breve.
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    backgroundColor: depositMethod === 'Yape' ? 'rgba(141,22,127,0.15)' : 'rgba(0,209,206,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: depositMethod === 'Yape' ? '#8d167f' : '#00d1ce'
                  }}>
                    <Landmark size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '19px', fontWeight: '700' }}>Depositar con {depositMethod}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Transfiere al número indicado y sube tu comprobante</p>
                  </div>
                </div>

                {/* Account details */}
                <div style={{
                  background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
                  borderRadius: '14px', padding: '16px', marginBottom: '22px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Número de Teléfono</p>
                      <p style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '1px' }}>+51 957 240 793</p>
                    </div>
                    <button onClick={() => copyToClipboard('+51957240793', 'phone')} style={{
                      padding: '7px 12px', borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      backgroundColor: copiedPhone ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.05)',
                      color: copiedPhone ? 'var(--primary)' : 'var(--text-muted)',
                      fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.2s'
                    }}>
                      {copiedPhone ? <Check size={13} /> : <Copy size={13} />}
                      {copiedPhone ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                  <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '10px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Titular</p>
                      <p style={{ fontSize: '15px', fontWeight: '600' }}>Carlos Bolaños Briones</p>
                    </div>
                    <button onClick={() => copyToClipboard('Carlos Bolaños Briones', 'name')} style={{
                      padding: '7px 12px', borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      backgroundColor: copiedName ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.05)',
                      color: copiedName ? 'var(--primary)' : 'var(--text-muted)',
                      fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.2s'
                    }}>
                      {copiedName ? <Check size={13} /> : <Copy size={13} />}
                      {copiedName ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                </div>

                <form onSubmit={handleDepositSubmit}>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={labelStyle}>Monto enviado (USD)</label>
                    <input type="number" step="0.01" required value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder="0.00" style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={labelStyle}>Código / N° de Operación</label>
                    <input type="text" required value={referenceCode} onChange={e => setReferenceCode(e.target.value)} placeholder="Ej: 1984728" style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={labelStyle}>Comprobante de Pago</label>
                    <div onClick={() => document.getElementById('voucher-input').click()} style={{
                      border: '2px dashed var(--border)', borderRadius: '12px', padding: '18px',
                      textAlign: 'center', cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.01)'
                    }}>
                      <input id="voucher-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setVoucherFile(e.target.files[0])} />
                      <p style={{ fontSize: '12px', color: voucherFile ? 'var(--primary)' : 'var(--text-muted)', fontWeight: '600' }}>
                        {voucherFile ? `✓ ${voucherFile.name}` : '📎 Selecciona la captura de pantalla'}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" onClick={() => setShowDepositModal(false)} style={{
                      flex: 1, padding: '12px', borderRadius: '10px',
                      border: '1px solid var(--border)', background: 'transparent',
                      color: 'var(--text-muted)', fontWeight: '600', cursor: 'pointer'
                    }}>Cancelar</button>
                    <button type="submit" disabled={depositSubmitting} style={{
                      flex: 1, padding: '12px', borderRadius: '10px', border: 'none',
                      backgroundColor: 'var(--primary)', color: '#000', fontWeight: '700', cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0,255,136,0.3)'
                    }}>{depositSubmitting ? 'Registrando...' : 'Confirmar Depósito'}</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════
           WITHDRAWAL MODAL
          ════════════════════════════════════ */}
      {showWithdrawModal && withdrawMethod && (
        <div style={modalOverlay}>
          <div className="glass-card" style={{
            width: '100%', maxWidth: '500px', backgroundColor: '#0a0d14',
            border: '1px solid rgba(255,255,255,0.1)', padding: '30px',
            borderRadius: '24px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <button onClick={() => setShowWithdrawModal(false)} style={{
              position: 'absolute', top: '18px', right: '18px',
              background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px',
              color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', display: 'flex'
            }}><X size={16} /></button>

            {withdrawSuccess ? (
              <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                <div style={{
                  width: '70px', height: '70px', borderRadius: '50%',
                  background: `rgba(0,255,136,0.1)`, color: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
                }}>
                  <Check size={40} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px' }}>¡Retiro Solicitado!</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.6' }}>
                  Tu solicitud de retiro por <strong style={{ color: '#fff' }}>{withdrawMethod.name}</strong> ha sido registrada exitosamente y está en proceso de revisión.
                </p>
              </div>
            ) : (
              <form onSubmit={handleWithdrawSubmit}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '12px', fontSize: '24px',
                    background: `linear-gradient(135deg, ${withdrawMethod.color}30, ${withdrawMethod.accent}20)`,
                    border: `1px solid ${withdrawMethod.accent}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {withdrawMethod.icon}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: '700' }}>Retirar con {withdrawMethod.name}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{withdrawMethod.desc}</p>
                  </div>
                </div>

                {/* Balance available */}
                <div style={{
                  background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.15)',
                  borderRadius: '10px', padding: '12px 16px', marginBottom: '20px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Saldo disponible</span>
                  <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--primary)' }}>
                    ${statsData?.balance?.toFixed(2) || '0.00'}
                  </span>
                </div>

                {/* Amount */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Monto a retirar (USD) · Mínimo ${withdrawMethod.minAmount}</label>
                  <input type="number" step="0.01" required min={withdrawMethod.minAmount}
                    value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                    placeholder={`$${withdrawMethod.minAmount}.00`} style={{ ...inputStyle, fontSize: '18px', fontWeight: '700' }} />
                  {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px' }}>
                      Recibirás ≈ <strong style={{ color: '#fff' }}>${(parseFloat(withdrawAmount) || 0).toFixed(2)} USD</strong> · {withdrawMethod.fee}
                    </p>
                  )}
                </div>

                {/* ── PayPal fields ── */}
                {withdrawMethod.name === 'PayPal' && (
                  <>
                    <div style={{ marginBottom: '14px' }}>
                      <label style={labelStyle}>Correo de tu cuenta PayPal</label>
                      <input type="email" required value={paypalEmail} onChange={e => setPaypalEmail(e.target.value)}
                        placeholder="tunombre@email.com" style={inputStyle} />
                    </div>
                    <div style={{ marginBottom: '14px' }}>
                      <label style={labelStyle}>Nombre en tu cuenta PayPal</label>
                      <input type="text" required value={paypalName} onChange={e => setPaypalName(e.target.value)}
                        placeholder="Nombre Completo" style={inputStyle} />
                    </div>
                    <div style={{
                      background: 'rgba(0,156,222,0.06)', border: '1px solid rgba(0,156,222,0.2)',
                      borderRadius: '10px', padding: '12px', marginBottom: '16px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5'
                    }}>
                      💡 Asegúrate de que tu cuenta PayPal esté <strong style={{ color: '#009cde' }}>verificada</strong> para recibir pagos internacionales. Se aplica una comisión de 2.5%.
                    </div>
                  </>
                )}

                {/* ── Crypto fields ── */}
                {withdrawMethod.name === 'Crypto' && (
                  <>
                    <div style={{ marginBottom: '14px' }}>
                      <label style={labelStyle}>Red / Moneda</label>
                      <div style={{ position: 'relative' }}>
                        <select value={cryptoNetwork} onChange={e => setCryptoNetwork(e.target.value)} style={{
                          ...inputStyle, appearance: 'none', paddingRight: '36px', cursor: 'pointer'
                        }}>
                          {cryptoNetworks.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                        <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                      </div>
                    </div>
                    <div style={{ marginBottom: '14px' }}>
                      <label style={labelStyle}>Dirección de Wallet</label>
                      <input type="text" required value={cryptoAddress} onChange={e => setCryptoAddress(e.target.value)}
                        placeholder="0x... o bc1... o T..." style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '13px' }} />
                    </div>
                    <div style={{
                      background: 'rgba(247,147,26,0.06)', border: '1px solid rgba(247,147,26,0.2)',
                      borderRadius: '10px', padding: '12px', marginBottom: '16px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5'
                    }}>
                      ⚠️ <strong style={{ color: '#f7931a' }}>Verifica bien la red seleccionada.</strong> Enviar a la red incorrecta puede resultar en pérdida permanente de fondos.
                    </div>
                  </>
                )}

                {/* ── Card / Bank fields ── */}
                {withdrawMethod.name === 'Tarjeta / Banco' && (
                  <>
                    <div style={{ marginBottom: '14px' }}>
                      <label style={labelStyle}>Banco / Billetera Digital</label>
                      <div style={{ position: 'relative' }}>
                        <select value={cardBank} onChange={e => setCardBank(e.target.value)} style={{
                          ...inputStyle, appearance: 'none', paddingRight: '36px', cursor: 'pointer'
                        }}>
                          {cardBanks.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                        <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                      </div>
                    </div>
                    <div style={{ marginBottom: '14px' }}>
                      <label style={labelStyle}>Número de Cuenta / CCI / Teléfono</label>
                      <input type="text" required value={cardNumber} onChange={e => setCardNumber(e.target.value)}
                        placeholder="Ej: 19230012345678901234" style={{ ...inputStyle, fontFamily: 'monospace' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                      <div>
                        <label style={labelStyle}>Nombre del Titular</label>
                        <input type="text" required value={cardName} onChange={e => setCardName(e.target.value)}
                          placeholder="Nombre Completo" style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>DNI / Cédula</label>
                        <input type="text" required value={cardDni} onChange={e => setCardDni(e.target.value)}
                          placeholder="12345678" style={inputStyle} />
                      </div>
                    </div>
                    <div style={{
                      background: 'rgba(26,115,232,0.06)', border: '1px solid rgba(26,115,232,0.2)',
                      borderRadius: '10px', padding: '12px', marginBottom: '16px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5'
                    }}>
                      🏦 Los depósitos bancarios se procesan en <strong style={{ color: '#4285f4' }}>2-5 días hábiles</strong>. Sin comisiones adicionales.
                    </div>
                  </>
                )}

                {/* Error */}
                {withdrawError && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.2)',
                    borderRadius: '10px', padding: '12px', marginBottom: '16px',
                    color: '#ff4d4d', fontSize: '13px', fontWeight: '500'
                  }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    {withdrawError}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  <button type="button" onClick={() => setShowWithdrawModal(false)} style={{
                    flex: 1, padding: '12px', borderRadius: '10px',
                    border: '1px solid var(--border)', background: 'transparent',
                    color: 'var(--text-muted)', fontWeight: '600', cursor: 'pointer'
                  }}>Cancelar</button>
                  <button type="submit" disabled={withdrawSubmitting} style={{
                    flex: 2, padding: '12px', borderRadius: '10px', border: 'none',
                    background: `linear-gradient(135deg, ${withdrawMethod.color}, ${withdrawMethod.accent})`,
                    color: '#fff', fontWeight: '700', cursor: 'pointer',
                    boxShadow: `0 4px 14px ${withdrawMethod.accent}40`
                  }}>{withdrawSubmitting ? 'Procesando...' : `Solicitar Retiro por ${withdrawMethod.name}`}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Wallet
