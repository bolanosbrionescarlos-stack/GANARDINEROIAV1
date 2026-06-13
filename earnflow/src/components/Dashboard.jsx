import React, { useState, useEffect, useRef, useCallback } from 'react'
import { DollarSign, Zap, Clock, CheckCircle, X, Play, Pause, Gift, Send, ExternalLink, Download, Smartphone, Star, ChevronRight, Award } from 'lucide-react'
import { API_URL } from '../config'

/* ─── ANIMATED BALANCE COUNTER ──────────────────────────────────────── */
const AnimatedBalance = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(value)
  const prevValueRef = useRef(value)
  const animFrameRef = useRef(null)

  useEffect(() => {
    const from = prevValueRef.current
    const to = value
    if (from === to) return

    const duration = 1200 // ms
    const startTime = performance.now()

    const animate = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // easeOutExpo for a satisfying deceleration
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      const current = from + (to - from) * eased
      setDisplayValue(current)

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate)
      } else {
        prevValueRef.current = to
      }
    }

    animFrameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [value])

  return `$${displayValue.toFixed(2)}`
}

/* ─── TASK MODAL VIEWS ──────────────────────────────────────────────── */

// ── 1. Video Player View ────────────────────────────────────────────
const VideoTaskView = ({ onComplete }) => {
  const [playing, setPlaying] = useState(false)
  const [seconds, setSeconds] = useState(10)
  const [done, setDone] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (done) {
      const timer = setTimeout(() => {
        onComplete()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [done, onComplete])

  useEffect(() => {
    if (playing && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current)
            setDone(true)
            setPlaying(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [playing])

  const progress = ((10 - seconds) / 10) * 100

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Simulated Video Player */}
      <div style={{
        width: '100%',
        aspectRatio: '16/9',
        background: 'linear-gradient(135deg, #0a0e17 0%, #1a1e2e 100%)',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '24px',
        border: '1px solid rgba(255,255,255,0.06)'
      }}>
        {/* Animated background particles */}
        <div style={{
          position: 'absolute', inset: 0,
          background: playing
            ? 'radial-gradient(circle at 30% 40%, rgba(0,255,136,0.08) 0%, transparent 60%), radial-gradient(circle at 70% 60%, rgba(0,200,255,0.06) 0%, transparent 50%)'
            : 'none',
          transition: 'background 0.8s ease'
        }} />

        {/* Countdown Circle */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--primary)" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 52}`}
              strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress / 100)}`}
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dashoffset 0.4s ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: done ? '28px' : '36px', fontWeight: '700',
            color: done ? 'var(--primary)' : '#fff'
          }}>
            {done ? <CheckCircle size={36} /> : seconds}
          </div>
        </div>

        <p style={{
          color: done ? 'var(--primary)' : 'var(--text-muted)',
          fontSize: '14px', fontWeight: '500',
          transition: 'color 0.3s'
        }}>
          {done ? '¡Video completado!' : playing ? 'Reproduciendo anuncio...' : 'Haz clic en reproducir'}
        </p>
      </div>

      {/* Progress bar */}
      <div style={{
        width: '100%', height: '4px',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: '2px', marginBottom: '20px', overflow: 'hidden'
      }}>
        <div style={{
          width: `${progress}%`, height: '100%',
          background: 'linear-gradient(90deg, var(--primary), #00ccff)',
          borderRadius: '2px',
          transition: 'width 0.4s ease'
        }} />
      </div>

      {/* Controls */}
      {!done ? (
        <button
          onClick={() => setPlaying(!playing)}
          style={{
            padding: '12px 32px', borderRadius: '14px', border: 'none',
            background: playing
              ? 'rgba(255,255,255,0.08)'
              : 'linear-gradient(135deg, var(--primary), #00cc66)',
            color: playing ? '#fff' : '#000',
            fontWeight: '700', fontSize: '15px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px',
            margin: '0 auto',
            transition: 'all 0.3s ease',
            boxShadow: playing ? 'none' : '0 0 20px rgba(0,255,136,0.3)'
          }}
        >
          {playing ? <><Pause size={18} /> Pausar</> : <><Play size={18} /> Reproducir</>}
        </button>
      ) : (
        <div style={{
          padding: '14px 40px', borderRadius: '14px', border: 'none',
          background: 'rgba(0,255,136,0.1)',
          color: 'var(--primary)', fontWeight: '700', fontSize: '15px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          margin: '0 auto',
          boxShadow: '0 0 15px rgba(0,255,136,0.1)',
          maxWidth: '300px'
        }}>
          <div className="spinner" style={{
            width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.2)',
            borderTopColor: 'var(--primary)', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          Acreditando saldo automáticamente...
        </div>
      )}
    </div>
  )
}

// ── 2. Survey View ──────────────────────────────────────────────────
const surveyQuestions = [
  {
    question: '¿Con qué frecuencia utilizas aplicaciones para ganar dinero?',
    options: ['Todos los días', 'Varias veces por semana', 'Una vez por semana', 'Casi nunca']
  },
  {
    question: '¿Qué tipo de tarea prefieres realizar?',
    options: ['Ver videos', 'Completar encuestas', 'Probar aplicaciones', 'Seguir redes sociales']
  },
  {
    question: '¿Cuánto tiempo al día dedicas a ganar dinero en línea?',
    options: ['Menos de 30 min', '30 min - 1 hora', '1 - 2 horas', 'Más de 2 horas']
  }
]

const SurveyTaskView = ({ onComplete }) => {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => {
        onComplete()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [submitted, onComplete])

  const handleSelect = (optionIndex) => {
    setAnswers(prev => ({ ...prev, [current]: optionIndex }))
  }

  const handleNext = () => {
    if (current < surveyQuestions.length - 1) {
      setCurrent(prev => prev + 1)
    }
  }

  const handleSubmit = () => {
    setSubmitted(true)
  }

  const isLastQuestion = current === surveyQuestions.length - 1
  const hasAnswer = answers[current] !== undefined
  const allAnswered = Object.keys(answers).length === surveyQuestions.length
  const q = surveyQuestions[current]

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(0,255,136,0.15), rgba(0,200,255,0.1))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px'
        }}>
          <CheckCircle size={40} color="var(--primary)" />
        </div>
        <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>¡Encuesta Completada!</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
          Gracias por compartir tu opinión
        </p>
        <div style={{
          padding: '14px 40px', borderRadius: '14px', border: 'none',
          background: 'rgba(0,255,136,0.1)',
          color: 'var(--primary)', fontWeight: '700', fontSize: '15px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          margin: '0 auto',
          boxShadow: '0 0 15px rgba(0,255,136,0.1)',
          maxWidth: '300px'
        }}>
          <div className="spinner" style={{
            width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.2)',
            borderTopColor: 'var(--primary)', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          Acreditando saldo automáticamente...
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Progress indicators */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {surveyQuestions.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: '4px', borderRadius: '2px',
            background: i <= current
              ? 'linear-gradient(90deg, var(--primary), #00ccff)'
              : 'rgba(255,255,255,0.06)',
            transition: 'background 0.4s ease'
          }} />
        ))}
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>
        Pregunta {current + 1} de {surveyQuestions.length}
      </p>
      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', lineHeight: '1.4' }}>
        {q.question}
      </h3>

      <div style={{ display: 'grid', gap: '10px', marginBottom: '24px' }}>
        {q.options.map((opt, i) => {
          const isSelected = answers[current] === i
          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              style={{
                padding: '14px 18px',
                borderRadius: '12px',
                border: `1px solid ${isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.08)'}`,
                background: isSelected
                  ? 'rgba(0,255,136,0.08)'
                  : 'rgba(255,255,255,0.02)',
                color: isSelected ? 'var(--primary)' : '#fff',
                fontWeight: isSelected ? '600' : '400',
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.25s ease',
                display: 'flex', alignItems: 'center', gap: '12px'
              }}
            >
              <div style={{
                width: '20px', height: '20px', borderRadius: '50%',
                border: `2px solid ${isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.25s ease'
              }}>
                {isSelected && <div style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: 'var(--primary)'
                }} />}
              </div>
              {opt}
            </button>
          )
        })}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        {isLastQuestion && allAnswered ? (
          <button
            onClick={handleSubmit}
            disabled={!hasAnswer}
            style={{
              padding: '12px 28px', borderRadius: '12px', border: 'none',
              background: hasAnswer
                ? 'linear-gradient(135deg, var(--primary), #00cc66)'
                : 'rgba(255,255,255,0.06)',
              color: hasAnswer ? '#000' : 'var(--text-muted)',
              fontWeight: '700', fontSize: '14px',
              cursor: hasAnswer ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', gap: '8px',
              transition: 'all 0.3s'
            }}
          >
            <Send size={16} /> Enviar Encuesta
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={!hasAnswer}
            style={{
              padding: '12px 28px', borderRadius: '12px', border: 'none',
              background: hasAnswer
                ? 'linear-gradient(135deg, var(--primary), #00cc66)'
                : 'rgba(255,255,255,0.06)',
              color: hasAnswer ? '#000' : 'var(--text-muted)',
              fontWeight: '700', fontSize: '14px',
              cursor: hasAnswer ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', gap: '8px',
              transition: 'all 0.3s'
            }}
          >
            Siguiente <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

// ── 3. Social Media View ────────────────────────────────────────────
const socialNetworks = [
  { name: 'Instagram', icon: '📷', color: '#E1306C', url: 'https://instagram.com/earnflow' },
  { name: 'TikTok', icon: '🎵', color: '#00f2ea', url: 'https://tiktok.com/@earnflow' },
  { name: 'Twitter / X', icon: '🐦', color: '#1DA1F2', url: 'https://twitter.com/earnflow' },
]

const SocialTaskView = ({ onComplete }) => {
  const [followed, setFollowed] = useState({})
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    if (verified) {
      const timer = setTimeout(() => {
        onComplete()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [verified, onComplete])

  const handleFollow = (name) => {
    setFollowed(prev => ({ ...prev, [name]: true }))
  }

  const allFollowed = socialNetworks.every(sn => followed[sn.name])

  const handleVerify = () => {
    setVerifying(true)
    setTimeout(() => {
      setVerifying(false)
      setVerified(true)
    }, 2500)
  }

  return (
    <div>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px', lineHeight: '1.5' }}>
        Sigue a EarnFlow en nuestras redes sociales para reclamar tu recompensa.
      </p>

      <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
        {socialNetworks.map((sn) => {
          const isFollowed = followed[sn.name]
          return (
            <div key={sn.name} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 18px', borderRadius: '14px',
              border: `1px solid ${isFollowed ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.08)'}`,
              background: isFollowed ? 'rgba(0,255,136,0.04)' : 'rgba(255,255,255,0.02)',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '24px' }}>{sn.icon}</span>
                <div>
                  <p style={{ fontWeight: '600', fontSize: '15px' }}>{sn.name}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>@earnflow</p>
                </div>
              </div>
              <button
                onClick={() => handleFollow(sn.name)}
                disabled={isFollowed}
                style={{
                  padding: '8px 20px', borderRadius: '10px', border: 'none',
                  background: isFollowed
                    ? 'rgba(0,255,136,0.12)'
                    : `linear-gradient(135deg, ${sn.color}, ${sn.color}cc)`,
                  color: isFollowed ? 'var(--primary)' : '#fff',
                  fontWeight: '600', fontSize: '13px',
                  cursor: isFollowed ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  transition: 'all 0.3s'
                }}
              >
                {isFollowed ? <><CheckCircle size={14} /> Seguido</> : <><ExternalLink size={14} /> Seguir</>}
              </button>
            </div>
          )
        })}
      </div>

      {/* Verify / Claim */}
      {!verified ? (
        <button
          onClick={handleVerify}
          disabled={!allFollowed || verifying}
          style={{
            width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
            background: allFollowed && !verifying
              ? 'linear-gradient(135deg, var(--primary), #00cc66)'
              : 'rgba(255,255,255,0.06)',
            color: allFollowed && !verifying ? '#000' : 'var(--text-muted)',
            fontWeight: '700', fontSize: '15px',
            cursor: allFollowed && !verifying ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            transition: 'all 0.3s'
          }}
        >
          {verifying ? (
            <>
              <div className="spinner" style={{
                width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.2)',
                borderTopColor: 'var(--primary)', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }} />
              Verificando...
            </>
          ) : (
            <>Verificar Seguimiento</>
          )}
        </button>
      ) : (
        <div style={{
          width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
          background: 'rgba(0,255,136,0.1)',
          color: 'var(--primary)', fontWeight: '700', fontSize: '15px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          boxShadow: '0 0 15px rgba(0,255,136,0.1)'
        }}>
          <div className="spinner" style={{
            width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.2)',
            borderTopColor: 'var(--primary)', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          Acreditando saldo automáticamente...
        </div>
      )}
    </div>
  )
}

// ── 4. App Install View ─────────────────────────────────────────────
const AppInstallTaskView = ({ onComplete }) => {
  const [phase, setPhase] = useState('idle') // idle | downloading | installing | done
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (phase === 'done') {
      const timer = setTimeout(() => {
        onComplete()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [phase, onComplete])

  const startInstall = () => {
    setPhase('downloading')
    setProgress(0)
    let prog = 0
    intervalRef.current = setInterval(() => {
      prog += Math.random() * 4 + 1
      if (prog >= 100) {
        prog = 100
        clearInterval(intervalRef.current)
        setProgress(100)
        setTimeout(() => {
          setPhase('installing')
          setProgress(0)
          let installProg = 0
          intervalRef.current = setInterval(() => {
            installProg += Math.random() * 6 + 2
            if (installProg >= 100) {
              installProg = 100
              clearInterval(intervalRef.current)
              setProgress(100)
              setTimeout(() => setPhase('done'), 600)
            }
            setProgress(installProg)
          }, 120)
        }, 800)
      }
      setProgress(prog)
    }, 100)
  }

  useEffect(() => () => clearInterval(intervalRef.current), [])

  const phaseLabel = {
    idle: 'Listo para descargar',
    downloading: 'Descargando...',
    installing: 'Instalando...',
    done: '¡Instalación completa!'
  }

  return (
    <div style={{ textAlign: 'center' }}>
      {/* App Card */}
      <div style={{
        padding: '28px', borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(0,255,136,0.04), rgba(0,200,255,0.03))',
        border: '1px solid rgba(255,255,255,0.06)',
        marginBottom: '24px'
      }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '18px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 8px 24px rgba(99,102,241,0.3)'
        }}>
          <Smartphone size={32} color="#fff" />
        </div>
        <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>TaskMaster Pro</h4>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '12px' }}>
          Productividad · 4.8 ★ · 12 MB
        </p>

        {/* Stars */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '16px' }}>
          {[1, 2, 3, 4, 5].map(s => (
            <Star key={s} size={16} fill={s <= 4 ? '#ffcc00' : 'none'} color={s <= 4 ? '#ffcc00' : 'rgba(255,255,255,0.2)'} />
          ))}
        </div>

        {/* Progress */}
        {(phase === 'downloading' || phase === 'installing') && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{
              width: '100%', height: '6px',
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderRadius: '3px', overflow: 'hidden'
            }}>
              <div style={{
                width: `${Math.min(progress, 100)}%`, height: '100%',
                background: phase === 'downloading'
                  ? 'linear-gradient(90deg, #6366f1, #a855f7)'
                  : 'linear-gradient(90deg, var(--primary), #00ccff)',
                borderRadius: '3px',
                transition: 'width 0.15s ease'
              }} />
            </div>
            <p style={{
              color: 'var(--text-muted)', fontSize: '12px', marginTop: '8px'
            }}>
              {Math.min(Math.round(progress), 100)}% — {phaseLabel[phase]}
            </p>
          </div>
        )}

        {phase === 'done' && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '8px', color: 'var(--primary)', fontSize: '14px', fontWeight: '600'
          }}>
            <CheckCircle size={18} /> {phaseLabel.done}
          </div>
        )}
      </div>

      {/* Action button */}
      {phase === 'idle' && (
        <button
          onClick={startInstall}
          style={{
            padding: '14px 40px', borderRadius: '14px', border: 'none',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            color: '#fff', fontWeight: '700', fontSize: '15px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
            margin: '0 auto',
            boxShadow: '0 0 20px rgba(99,102,241,0.3)',
            transition: 'all 0.3s'
          }}
        >
          <Download size={18} /> Descargar e Instalar
        </button>
      )}

      {phase === 'done' && (
        <div style={{
          padding: '14px 40px', borderRadius: '14px', border: 'none',
          background: 'rgba(0,255,136,0.1)',
          color: 'var(--primary)', fontWeight: '700', fontSize: '15px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          margin: '0 auto',
          boxShadow: '0 0 15px rgba(0,255,136,0.1)',
          maxWidth: '300px'
        }}>
          <div className="spinner" style={{
            width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.2)',
            borderTopColor: 'var(--primary)', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          Acreditando saldo automáticamente...
        </div>
      )}
    </div>
  )
}

/* ─── SUCCESS OVERLAY ───────────────────────────────────────────────── */
const SuccessOverlay = ({ reward, onClose }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 10001,
    background: 'rgba(0,0,0,0.85)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    animation: 'fadeIn 0.3s ease'
  }}
    onClick={onClose}
  >
    <div style={{
      textAlign: 'center',
      animation: 'scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
    }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{
        width: '100px', height: '100px', borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,200,255,0.15))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px',
        boxShadow: '0 0 40px rgba(0,255,136,0.3)'
      }}>
        <Award size={48} color="var(--primary)" />
      </div>
      <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
        ¡Recompensa Ganada!
      </h2>
      <p style={{
        fontSize: '36px', fontWeight: '800',
        background: 'linear-gradient(135deg, var(--primary), #00ccff)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        marginBottom: '16px'
      }}>
        +{reward}
      </p>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
        El saldo se ha acreditado a tu cuenta
      </p>
      <button
        onClick={onClose}
        style={{
          padding: '12px 32px', borderRadius: '12px', border: 'none',
          background: 'rgba(255,255,255,0.08)', color: '#fff',
          fontWeight: '600', fontSize: '14px', cursor: 'pointer',
          transition: 'all 0.3s'
        }}
      >
        Continuar
      </button>
    </div>
  </div>
)


/* ─── MAIN DASHBOARD COMPONENT ──────────────────────────────────────── */
const Dashboard = ({ user }) => {
  const [statsData, setStatsData] = useState(null)
  const [tasks, setTasks] = useState([])
  const [activeTask, setActiveTask] = useState(null)
  const [showSuccess, setShowSuccess] = useState(null)
  const [completedTasks, setCompletedTasks] = useState({})
  const [balanceHighlight, setBalanceHighlight] = useState(false)
  const [floatingReward, setFloatingReward] = useState(null)

  const refreshStats = useCallback(() => {
    fetch(`${API_URL}/api/stats/${user.id}`)
      .then(res => res.json())
      .then(data => setStatsData(data))
  }, [user.id])

  useEffect(() => {
    refreshStats()
    fetch(`${API_URL}/api/tasks`)
      .then(res => res.json())
      .then(data => setTasks(data))
  }, [user.id, refreshStats])

  const handleTaskComplete = (task) => {
    fetch(`${API_URL}/api/complete-task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, reward: task.reward })
    })
      .then(res => res.json())
      .then(() => {
        setActiveTask(null)
        setShowSuccess(task.reward)
        setCompletedTasks(prev => ({ ...prev, [task.id]: true }))
        // Trigger balance highlight + floating reward
        setFloatingReward(task.reward)
        setBalanceHighlight(true)
        setTimeout(() => setBalanceHighlight(false), 2000)
        setTimeout(() => setFloatingReward(null), 2500)
        refreshStats()
      })
  }

  const getTaskView = (task) => {
    const title = task.title?.toLowerCase() || ''
    if (title.includes('video')) return <VideoTaskView onComplete={() => handleTaskComplete(task)} />
    if (title.includes('encuesta')) return <SurveyTaskView onComplete={() => handleTaskComplete(task)} />
    if (title.includes('redes') || title.includes('social')) return <SocialTaskView onComplete={() => handleTaskComplete(task)} />
    if (title.includes('app') || title.includes('probar')) return <AppInstallTaskView onComplete={() => handleTaskComplete(task)} />
    // Fallback: generic view
    return <VideoTaskView onComplete={() => handleTaskComplete(task)} />
  }

  const getTaskIcon = (task) => {
    const title = task.title?.toLowerCase() || ''
    if (title.includes('video')) return '🎬'
    if (title.includes('encuesta')) return '📋'
    if (title.includes('redes') || title.includes('social')) return '📱'
    if (title.includes('app') || title.includes('probar')) return '📲'
    return '⚡'
  }

  const getModalTitle = (task) => {
    const title = task.title?.toLowerCase() || ''
    if (title.includes('video')) return 'Ver Video Publicitario'
    if (title.includes('encuesta')) return 'Completar Encuesta Rápida'
    if (title.includes('redes') || title.includes('social')) return 'Seguir en Redes Sociales'
    if (title.includes('app') || title.includes('probar')) return 'Probar App Nueva'
    return task.title
  }

  const currentBalance = statsData?.balance || 0

  const stats = [
    { label: 'Saldo Total', value: null, isBalance: true, icon: DollarSign, color: 'var(--primary)' },
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
        {stats.map((stat, i) => {
          const isBalanceCard = stat.isBalance
          return (
            <div key={i} className="glass-card" style={{
              position: 'relative',
              overflow: 'hidden',
              ...(isBalanceCard && balanceHighlight ? {
                borderColor: 'rgba(0,255,136,0.5)',
                boxShadow: '0 0 30px rgba(0,255,136,0.2), inset 0 0 30px rgba(0,255,136,0.03)',
                transition: 'all 0.5s ease'
              } : {})
            }}>
              {/* Glow sweep animation on balance update */}
              {isBalanceCard && balanceHighlight && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(90deg, transparent, rgba(0,255,136,0.08), transparent)',
                  animation: 'sweepGlow 1.5s ease',
                  pointerEvents: 'none'
                }} />
              )}
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
              <h3 style={{ fontSize: '28px', fontWeight: '700', position: 'relative' }}>
                {isBalanceCard ? (
                  <AnimatedBalance value={currentBalance} />
                ) : stat.value}
              </h3>
              {/* Floating reward indicator */}
              {isBalanceCard && floatingReward && (
                <span style={{
                  position: 'absolute', top: '12px', right: '16px',
                  color: 'var(--primary)', fontWeight: '700', fontSize: '16px',
                  animation: 'floatUp 2.5s ease forwards',
                  pointerEvents: 'none'
                }}>
                  +{floatingReward}
                </span>
              )}
            </div>
          )
        })}
      </section>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '600' }}>Tareas Recomendadas</h3>
          <button style={{
            background: 'none', border: 'none',
            color: 'var(--primary)', cursor: 'pointer',
            fontSize: '14px', fontWeight: '600'
          }}>Ver todas</button>
        </div>

        <div style={{ display: 'grid', gap: '16px' }}>
          {tasks.map((task) => {
            const isDone = completedTasks[task.id]
            return (
              <div key={task.id} className="glass-card" style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '20px',
                opacity: isDone ? 0.5 : 1,
                transition: 'opacity 0.3s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{
                    width: '48px', height: '48px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '22px'
                  }}>
                    {getTaskIcon(task)}
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
                    onClick={() => !isDone && setActiveTask(task)}
                    disabled={isDone}
                    style={{
                      padding: '8px 20px', borderRadius: '10px', border: 'none',
                      backgroundColor: isDone ? 'rgba(255,255,255,0.06)' : 'var(--primary)',
                      color: isDone ? 'var(--text-muted)' : '#000',
                      fontWeight: '600', fontSize: '14px',
                      cursor: isDone ? 'default' : 'pointer',
                      transition: 'var(--transition)',
                      display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                    onMouseEnter={(e) => !isDone && (e.target.style.boxShadow = '0 0 15px var(--primary-glow)')}
                    onMouseLeave={(e) => (e.target.style.boxShadow = 'none')}
                  >
                    {isDone ? <><CheckCircle size={14} /> Completada</> : 'Iniciar'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Task Modal ────────────────────────────────────────── */}
      {activeTask && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.3s ease'
        }}
          onClick={() => setActiveTask(null)}
        >
          <div style={{
            width: '100%', maxWidth: '520px',
            background: 'linear-gradient(145deg, #0d1117, #161b22)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '24px',
            padding: '32px',
            maxHeight: '90vh',
            overflowY: 'auto',
            animation: 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '24px'
            }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '700' }}>{getModalTitle(activeTask)}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                  Recompensa: <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{activeTask.reward}</span>
                </p>
              </div>
              <button
                onClick={() => setActiveTask(null)}
                style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Task Content */}
            {getTaskView(activeTask)}
          </div>
        </div>
      )}

      {/* ── Success Overlay ──────────────────────────────────── */}
      {showSuccess && (
        <SuccessOverlay
          reward={showSuccess}
          onClose={() => setShowSuccess(null)}
        />
      )}

      {/* ── Inline Styles for Animations ─────────────────────── */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        @keyframes floatUp {
          0% { opacity: 0; transform: translateY(8px); }
          15% { opacity: 1; transform: translateY(0); }
          70% { opacity: 1; transform: translateY(-10px); }
          100% { opacity: 0; transform: translateY(-20px); }
        }
        @keyframes sweepGlow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default Dashboard
