import React, { useState, useEffect } from 'react'
import { TrendingUp, Coins, Briefcase, Clock, ShieldCheck, AlertCircle, Play, Sparkles } from 'lucide-react'
import { API_URL } from '../config'

const Investments = ({ user, setActiveTab }) => {
  const [balance, setBalance] = useState(0);
  const [investments, setInvestments] = useState([]);
  const [amounts, setAmounts] = useState({ Bronce: '', Plata: '', Oro: '' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // State for real-time second ticking ticker
  const [secondsTick, setSecondsTick] = useState(0);

  const plans = [
    {
      name: 'Bronce',
      dailyReturn: 1.5,
      durationDays: 10,
      minInvest: 10,
      maxInvest: 100,
      color: '#ff9900',
      description: 'Ideal para principiantes. Retorno de bajo riesgo a corto plazo.'
    },
    {
      name: 'Plata',
      dailyReturn: 2.2,
      durationDays: 20,
      minInvest: 100,
      maxInvest: 500,
      color: '#c0c0c0',
      description: 'Crecimiento equilibrado. Mayor rentabilidad con riesgo moderado.'
    },
    {
      name: 'Oro',
      dailyReturn: 3.5,
      durationDays: 30,
      minInvest: 500,
      maxInvest: 5000,
      color: '#ffd700',
      description: 'Rendimiento máximo para inversores serios de alto crecimiento.'
    }
  ];

  const fetchBalanceAndInvestments = () => {
    fetch(`${API_URL}/api/stats/${user.id}`)
      .then(res => res.json())
      .then(data => setBalance(data.balance || 0));

    fetch(`${API_URL}/api/investments/${user.id}`)
      .then(res => res.json())
      .then(data => setInvestments(data));
  };

  useEffect(() => {
    fetchBalanceAndInvestments();
  }, [user.id]);

  // Live ticking counter effect
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsTick(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAmountChange = (planName, val) => {
    setAmounts(prev => ({ ...prev, [planName]: val }));
  };

  const handleInvest = (plan) => {
    const amount = parseFloat(amounts[plan.name]);
    if (isNaN(amount) || amount < plan.minInvest || amount > plan.maxInvest) {
      setErrorMsg(`Para el Plan ${plan.name}, la inversión debe estar entre $${plan.minInvest} y $${plan.maxInvest}.`);
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    if (balance < amount) {
      setErrorMsg('Saldo insuficiente. Por favor recarga fondos en tu billetera.');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    setLoading(true);
    fetch(`${API_URL}/api/investments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        planName: plan.name,
        amount: amount,
        dailyReturn: plan.dailyReturn,
        durationDays: plan.durationDays
      })
    })
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        if (data.success) {
          setSuccessMsg(`¡Inversión de $${amount.toFixed(2)} en Plan ${plan.name} iniciada correctamente!`);
          setAmounts(prev => ({ ...prev, [plan.name]: '' }));
          fetchBalanceAndInvestments();
          setTimeout(() => setSuccessMsg(''), 4000);
        } else {
          setErrorMsg(data.error || 'Ocurrió un error al procesar la inversión.');
          setTimeout(() => setErrorMsg(''), 4000);
        }
      })
      .catch(err => {
        setLoading(false);
        console.error(err);
      });
  };

  const handleClaimDay = (investmentId) => {
    setLoading(true);
    fetch(`${API_URL}/api/investments/claim-day`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ investmentId })
    })
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        if (data.success) {
          if (data.finished) {
            setSuccessMsg(`¡Plan completado! Se ha reembolsado tu capital más ganancias de hoy (Total: +$${data.profit.toFixed(2)} USD al saldo).`);
          } else {
            setSuccessMsg(`¡Rendimiento diario reclamado con éxito! Se han sumado +$${data.profit.toFixed(2)} USD a tu saldo.`);
          }
          fetchBalanceAndInvestments();
          setTimeout(() => setSuccessMsg(''), 4500);
        } else {
          setErrorMsg(data.error || 'Ocurrió un error al reclamar.');
          setTimeout(() => setErrorMsg(''), 4000);
        }
      })
      .catch(err => {
        setLoading(false);
        console.error(err);
      });
  };

  return (
    <div className="fade-in">
      <header style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>Planes de Inversión</h2>
        <p style={{ color: 'var(--text-muted)' }}>Pon a trabajar tus ingresos y genera rendimientos en tiempo real.</p>
      </header>

      {/* Dynamic Alerts */}
      {errorMsg && (
        <div className="glass" style={{
          padding: '16px 20px',
          borderRadius: '16px',
          backgroundColor: 'rgba(255, 77, 77, 0.1)',
          borderColor: 'rgba(255, 77, 77, 0.2)',
          color: '#ff4d4d',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '30px'
        }}>
          <AlertCircle size={20} />
          <span style={{ fontSize: '14px', fontWeight: '500' }}>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="glass" style={{
          padding: '16px 20px',
          borderRadius: '16px',
          backgroundColor: 'rgba(0, 255, 136, 0.1)',
          borderColor: 'rgba(0, 255, 136, 0.2)',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '30px'
        }}>
          <ShieldCheck size={20} />
          <span style={{ fontSize: '14px', fontWeight: '500' }}>{successMsg}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', alignItems: 'start' }}>
        
        {/* Left Side: Investment Plans Cards */}
        <div>
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            {plans.map((plan, i) => {
              const amount = parseFloat(amounts[plan.name]) || 0;
              const dailyProfit = (amount * plan.dailyReturn) / 100;
              const totalProfit = dailyProfit * plan.durationDays;
              const totalPayout = amount + totalProfit;
              
              // Per-minute and per-second calculations
              const profitPerMinute = dailyProfit / 1440;
              const profitPerSecond = dailyProfit / 86400;
              
              return (
                <div key={i} className="glass-card" style={{
                  borderTop: `4px solid ${plan.color}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '100%',
                  padding: '24px'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#fff' }}>Plan {plan.name}</h3>
                      <div style={{
                        backgroundColor: `${plan.color}20`,
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '700',
                        color: plan.color
                      }}>
                        +{plan.dailyReturn}% Diario
                      </div>
                    </div>
                    
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.5', marginBottom: '20px' }}>
                      {plan.description}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                      <div>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Duración</p>
                        <p style={{ fontSize: '15px', fontWeight: '600', color: '#fff' }}>{plan.durationDays} Días</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Límites</p>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>${plan.minInvest} - ${plan.maxInvest}</p>
                      </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Monto a invertir (USD)</label>
                      <input 
                        type="number"
                        placeholder={`$${plan.minInvest}.00`}
                        value={amounts[plan.name]}
                        onChange={(e) => handleAmountChange(plan.name, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(255,255,255,0.03)',
                          border: '1px solid var(--border)',
                          color: '#fff',
                          fontSize: '15px',
                          outline: 'none'
                        }}
                      />
                    </div>

                    {amount >= plan.minInvest && amount <= plan.maxInvest && (
                      <div style={{
                        backgroundColor: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        padding: '12px',
                        marginBottom: '20px',
                        fontSize: '12px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Ganancia Diaria:</span>
                          <span style={{ color: 'var(--primary)', fontWeight: '600' }}>+${dailyProfit.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', backgroundColor: 'rgba(0, 255, 136, 0.05)', padding: '4px 6px', borderRadius: '6px' }}>
                          <span style={{ color: 'var(--primary)', fontWeight: '500' }}>Ganancia/Minuto:</span>
                          <span style={{ color: 'var(--primary)', fontWeight: '700' }}>+${profitPerMinute.toFixed(5)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11px', padding: '0 6px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Ganancia/Segundo:</span>
                          <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>+${profitPerSecond.toFixed(7)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Retorno Neto:</span>
                          <span style={{ color: 'var(--primary)', fontWeight: '600' }}>+${totalProfit.toFixed(2)} (+{(plan.dailyReturn * plan.durationDays).toFixed(0)}%)</span>
                        </div>
                        <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '6px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}>
                          <span style={{ color: '#fff' }}>Retorno Total:</span>
                          <span style={{ color: plan.color }}>${totalPayout.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => handleInvest(plan)}
                    disabled={loading || balance < plan.minInvest}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: balance >= plan.minInvest ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                      color: balance >= plan.minInvest ? '#000' : 'var(--text-muted)',
                      fontWeight: '700',
                      cursor: balance >= plan.minInvest ? 'pointer' : 'not-allowed',
                      transition: 'all 0.3s'
                    }}
                  >
                    {balance >= plan.minInvest ? 'Iniciar Inversión' : `Mínimo $${plan.minInvest} USD`}
                  </button>
                </div>
              );
            })}
          </section>

          {/* Active Investments Grid */}
          <section>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>Inversiones Activas</h3>
            {investments.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <Briefcase size={40} style={{ color: 'var(--text-muted)', marginBottom: '15px' }} />
                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px' }}>No tienes inversiones activas</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '360px', margin: '0 auto' }}>
                  Elige uno de nuestros planes premium de arriba e ingresa un monto para comenzar a acumular intereses en tiempo real.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {investments.map((inv) => {
                  const percent = Math.min((inv.days_passed / inv.duration_days) * 100, 100);
                  const isFinished = inv.status === 'Finalizado';
                  
                  // Mathematically exact return values
                  const baseClaimedProfit = (inv.amount * inv.daily_return * inv.days_passed) / 100;
                  
                  // Continuous real-time ticking simulation
                  const dailyYield = (inv.amount * inv.daily_return) / 100;
                  const profitPerSecond = dailyYield / 86400;
                  const currentLiveAccumulated = isFinished ? 0 : profitPerSecond * (secondsTick % 86400);
                  const totalRealTimeEarnings = baseClaimedProfit + currentLiveAccumulated;
                  
                  return (
                    <div key={inv.id} className="glass" style={{
                      padding: '20px 24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '15px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: inv.plan_name === 'Bronce' ? '#ff9900' : inv.plan_name === 'Plata' ? '#c0c0c0' : '#ffd700'
                          }}>
                            <Coins size={20} />
                          </div>
                          <div>
                            <h4 style={{ fontSize: '15px', fontWeight: '600' }}>Plan {inv.plan_name} - ${inv.amount.toFixed(2)}</h4>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Iniciado el {inv.created_at}</p>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: '700',
                            backgroundColor: isFinished ? 'rgba(255,255,255,0.05)' : 'rgba(0, 255, 136, 0.1)',
                            color: isFinished ? 'var(--text-muted)' : 'var(--primary)',
                            padding: '4px 10px',
                            borderRadius: '20px'
                          }}>
                            {inv.status}
                          </span>
                          
                          {/* Live Ticking Stream Output */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', marginTop: '6px' }}>
                            {!isFinished && <Sparkles size={13} className="text-primary" style={{ color: 'var(--primary)', animation: 'pulse 1.5s infinite' }} />}
                            <p style={{ 
                              fontSize: '16px', 
                              fontWeight: '800', 
                              fontFamily: 'monospace',
                              color: 'var(--primary)',
                              letterSpacing: '0.2px'
                            }}>
                              ${totalRealTimeEarnings.toFixed(6)}
                            </p>
                          </div>
                          <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {isFinished ? 'Retorno final acreditado' : 'Generando en tiempo real'}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                          <span>Progreso de Contrato: {inv.days_passed}/{inv.duration_days} Días</span>
                          <span>{percent.toFixed(0)}%</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${percent}%`,
                            height: '100%',
                            backgroundColor: inv.plan_name === 'Bronce' ? '#ff9900' : inv.plan_name === 'Plata' ? '#c0c0c0' : '#ffd700',
                            borderRadius: '10px',
                            transition: 'width 0.4s'
                          }} />
                        </div>
                      </div>

                      {/* claim button */}
                      {!isFinished && (
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          borderTop: '1px solid var(--border)', 
                          paddingTop: '12px' 
                        }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Flujo: <strong style={{ color: '#fff' }}>+${(dailyYield / 1440).toFixed(5)}/min</strong>
                          </div>
                          
                          <button
                            onClick={() => handleClaimDay(inv.id)}
                            disabled={loading}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px 16px',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: 'rgba(0, 255, 136, 0.1)',
                              color: 'var(--primary)',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.3s'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = 'var(--primary)';
                              e.target.style.color = '#000';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = 'rgba(0, 255, 136, 0.1)';
                              e.target.style.color = 'var(--primary)';
                            }}
                          >
                            <Play size={14} fill="currentColor" />
                            Cobrar Ganancia del Día
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right Side: Quick Stats & Balance */}
        <div>
          <section className="glass-card" style={{ height: 'fit-content', marginBottom: '30px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Tu Cuenta</h3>
            
            <div style={{ marginBottom: '25px' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '6px' }}>Saldo Disponible</p>
              <h4 style={{ fontSize: '32px', fontWeight: '800', color: '#fff' }}>${balance.toFixed(2)}</h4>
            </div>

            {balance < 10 && (
              <div style={{
                backgroundColor: 'rgba(255, 204, 0, 0.05)',
                border: '1px solid rgba(255, 204, 0, 0.1)',
                padding: '16px',
                borderRadius: '12px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', gap: '10px', color: '#ffcc00', marginBottom: '8px' }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', fontWeight: '700' }}>Falta de Fondos</span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '12px' }}>
                  Necesitas al menos $10.00 USD para participar en nuestros planes de inversión. Carga tu billetera de forma instantánea.
                </p>
                <button
                  onClick={() => setActiveTab('wallet')}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'rgba(255, 204, 0, 0.1)',
                    color: '#ffcc00',
                    fontWeight: '700',
                    fontSize: '11px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.target.style.backgroundColor = '#ffcc00'; e.target.style.color = '#000'; }}
                  onMouseLeave={(e) => { e.target.style.backgroundColor = 'rgba(255, 204, 0, 0.1)'; e.target.style.color = '#ffcc00'; }}
                >
                  Depositar vía Yape / Plin
                </button>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
                <ShieldCheck size={16} style={{ color: 'var(--primary)' }} />
                <span>Garantía de capital protegido</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
                <Clock size={16} style={{ color: 'var(--primary)' }} />
                <span>Rendimientos acreditados cada 24h</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
                <TrendingUp size={16} style={{ color: 'var(--primary)' }} />
                <span>Retornos de hasta +205% neto</span>
              </div>
            </div>
          </section>
        </div>

      </div>
    </div>
  )
}

export default Investments
