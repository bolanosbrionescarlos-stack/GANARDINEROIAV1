import React from 'react'
import { LayoutDashboard, Wallet, TrendingUp, Users, Settings, LogOut, ShieldCheck } from 'lucide-react'

const Sidebar = ({ activeTab, setActiveTab, onLogout, user }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'wallet', label: 'Billetera', icon: Wallet },
    { id: 'investments', label: 'Inversiones', icon: TrendingUp },
    { id: 'referrals', label: 'Referidos', icon: Users },
  ]

  if (user && user.is_admin === 1) {
    menuItems.push({ id: 'admin', label: 'Administración', icon: ShieldCheck })
  }

  return (
    <aside style={{
      width: '280px',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border)',
      padding: '30px 20px',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', padding: '0 10px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          backgroundColor: 'var(--primary)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px var(--primary-glow)'
        }}>
          <span style={{ color: '#000', fontWeight: 'bold', fontSize: '20px' }}>{user.username[0].toUpperCase()}</span>
        </div>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.5px' }}>EarnFlow</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user.full_name || user.username}</p>
        </div>
      </div>

      <nav style={{ flex: 1 }}>
        <ul style={{ listStyle: 'none' }}>
          {menuItems.map((item) => (
            <li key={item.id} style={{ marginBottom: '8px' }}>
              <button
                onClick={() => setActiveTab(item.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: activeTab === item.id ? 'rgba(0, 255, 136, 0.1)' : 'transparent',
                  color: activeTab === item.id ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  textAlign: 'left',
                  fontSize: '15px',
                  fontWeight: activeTab === item.id ? '600' : '400'
                }}
              >
                <item.icon size={20} />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
        <button style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          borderRadius: '12px',
          border: 'none',
          backgroundColor: 'transparent',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          transition: 'var(--transition)'
        }}>
          <Settings size={20} />
          Configuración
        </button>
        <button 
          onClick={onLogout}
          style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          borderRadius: '12px',
          border: 'none',
          backgroundColor: 'transparent',
          color: '#ff4d4d',
          cursor: 'pointer',
          transition: 'var(--transition)',
          marginTop: '8px'
        }}>
          <LogOut size={20} />
          Cerrar Sesión
        </button>

        <div style={{ 
          marginTop: '20px', 
          padding: '10px', 
          fontSize: '11px', 
          color: 'var(--text-muted)', 
          textAlign: 'center',
          borderTop: '1px solid var(--border)',
          opacity: 0.6
        }}>
          Desarrollado por<br />
          <strong style={{ color: 'var(--primary)' }}>Carlos BOLAÑOS Briones</strong>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
