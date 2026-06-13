import React, { useState, useEffect } from 'react'
import { DollarSign, Zap, Clock, CheckCircle } from 'lucide-react'
import { API_URL } from '../config'

const Dashboard = ({ user }) => {
  const [statsData, setStatsData] = useState(null);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/stats/${user.id}`)
      .then(res => res.json())
      .then(data => setStatsData(data));

    fetch(`${API_URL}/api/tasks`)
      .then(res => res.json())
      .then(data => setTasks(data));
  }, [user.id]);

  const completeTask = (reward) => {
    fetch(`${API_URL}/api/complete-task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, reward })
    })
    .then(res => res.json())
    .then(() => {
      // Recargar stats
      fetch(`${API_URL}/api/stats/${user.id}`)
        .then(res => res.json())
        .then(data => setStatsData(data));
    });
  };

  const stats = [
    { label: 'Saldo Total', value: `$${statsData?.balance?.toFixed(2) || '0.00'}`, icon: DollarSign, color: 'var(--primary)' },
    { label: 'Tareas Hoy', value: statsData?.tasks_today || '0', icon: Zap, color: '#ffcc00' },
    { label: 'En Revisión', value: `$${statsData?.pending_approval?.toFixed(2) || '0.00'}`, icon: Clock, color: '#00ccff' },
    { label: 'Completadas', value: statsData?.total_completed || '0', icon: CheckCircle, color: '#ff66cc' },
  ]

  return (
    <div className="fade-in">
      <header style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>Hola, {user.full_name || user.username} 👋</h2>
        <p style={{ color: 'var(--text-muted)' }}>¡Tienes {tasks.length} tareas nuevas disponibles para hoy!</p>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {stats.map((stat, i) => (
          <div key={i} className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                padding: '10px',
                borderRadius: '12px',
                color: stat.color
              }}>
                <stat.icon size={24} />
              </div>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '5px' }}>{stat.label}</p>
            <h3 style={{ fontSize: '28px', fontWeight: '700' }}>{stat.value}</h3>
          </div>
        ))}
      </section>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '600' }}>Tareas Recomendadas</h3>
          <button style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}>Ver todas</button>
        </div>

        <div style={{ display: 'grid', gap: '16px' }}>
          {tasks.map((task) => (
            <div key={task.id} className="glass-card" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Zap size={20} color="var(--primary)" />
                </div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>{task.title}</h4>
                  <div style={{ display: 'flex', gap: '15px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <span>⏱ {task.time}</span>
                    <span>📊 {task.difficulty}</span>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '18px', fontWeight: '700', color: 'var(--primary)', marginBottom: '8px' }}>{task.reward}</p>
                <button 
                  onClick={() => completeTask(task.reward)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: 'var(--primary)',
                    color: '#000',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'var(--transition)'
                  }}
                  onMouseEnter={(e) => e.target.style.boxShadow = '0 0 15px var(--primary-glow)'}
                  onMouseLeave={(e) => e.target.style.boxShadow = 'none'}
                >
                  Iniciar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Dashboard
