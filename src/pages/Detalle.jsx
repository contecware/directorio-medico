import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import { parseHorario, estaAbierto, horarioPorDia, DIAS_LABELS } from '../horario'

// ── helpers ──────────────────────────────────────────────────────
function initials(name = '') {
  return name.split(' ').filter(w => /^[A-ZÁÉÍÓÚ]/i.test(w)).slice(0, 2).map(w => w[0].toUpperCase()).join('')
}
function waLink(num, doctor) {
  const n = (num || '').replace(/\D/g, '')
  const m = encodeURIComponent(`Hola, me comunico del Directorio Médico con ${doctor}. Quisiera información sobre sus servicios.`)
  return `https://wa.me/${n}?text=${m}`
}

function InfoRow({ icon, label, value }) {
  if (!value) return null
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'9px 0', borderBottom:'1px solid #f3f4f6' }}>
      <div style={{ width:34, height:34, background:'#f3f4f6', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>{icon}</div>
      <div>
        <div style={{ fontSize:10, color:'#9ca3af', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</div>
        <div style={{ fontSize:14, color:'#374151', fontWeight:600 }}>{value}</div>
      </div>
    </div>
  )
}

// ── Grid de horarios DINÁMICO ────────────────────────────────────
function HorarioGrid({ texto }) {
  const bloques   = parseHorario(texto)
  const horarios  = horarioPorDia(bloques)   // { 0: "8:00am–2:00pm" | null, ... }
  const hoyIdx    = new Date().getDay()       // 0=Dom…6=Sáb

  // Reordenamos: Lun(1)…Dom(0) para mostrar de lunes a domingo
  const orden = [1, 2, 3, 4, 5, 6, 0]

  if (!texto) {
    return <p style={{ fontSize:13, color:'#9ca3af', fontStyle:'italic' }}>Horario no especificado. Contacta directamente al consultorio.</p>
  }

  if (bloques.length === 0) {
    // No se pudo parsear — mostrar texto tal cual sin grid
    return (
      <div style={{ background:'#eff6ff', borderLeft:'3px solid #2563eb', padding:'10px 14px', borderRadius:8, fontSize:14, color:'#1e40af', fontWeight:600 }}>
        {texto}
      </div>
    )
  }

  return (
    <div>
      {/* Resumen textual */}
      <div style={{ background:'#eff6ff', borderLeft:'3px solid #2563eb', padding:'10px 14px', borderRadius:8, fontSize:14, color:'#1e40af', fontWeight:700, marginBottom:14 }}>
        {texto}
      </div>

      {/* Grid de días */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:5 }}>
        {orden.map(dIdx => {
          const esHoy    = dIdx === hoyIdx
          const horaStr  = horarios[dIdx]   // null = cerrado
          const cerrado  = !horaStr

          return (
            <div key={dIdx} style={{
              background: esHoy ? (cerrado ? '#fee2e2' : '#dbeafe') : (cerrado ? '#f9fafb' : '#f0fdf4'),
              border: esHoy ? `2px solid ${cerrado ? '#fca5a5' : '#2563eb'}` : '2px solid transparent',
              borderRadius: 10,
              padding: '8px 3px',
              textAlign: 'center',
              opacity: cerrado && !esHoy ? 0.6 : 1,
            }}>
              <div style={{
                fontSize: 9,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
                color: esHoy ? (cerrado ? '#dc2626' : '#1d4ed8') : (cerrado ? '#9ca3af' : '#166534'),
                marginBottom: 4,
              }}>
                {DIAS_LABELS[dIdx]}
                {esHoy && <div style={{ fontSize: 7, marginTop: 1 }}>HOY</div>}
              </div>
              <div style={{
                fontSize: 8,
                fontWeight: 600,
                color: cerrado ? '#9ca3af' : '#374151',
                lineHeight: 1.3,
              }}>
                {cerrado ? 'Cerrado' : horaStr}
              </div>
            </div>
          )
        })}
      </div>

      {/* Indicador de estado actual */}
      <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:8 }}>
        {estaAbierto(bloques)
          ? <span style={{ background:'#d1fae5', color:'#065f46', padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700 }}>● Abierto ahora</span>
          : <span style={{ background:'#fee2e2', color:'#991b1b', padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700 }}>● Cerrado ahora</span>
        }
        <span style={{ fontSize:12, color:'#9ca3af' }}>
          {new Date().toLocaleTimeString('es-GT', { hour:'2-digit', minute:'2-digit' })}
        </span>
      </div>
    </div>
  )
}

// ── PAGE ─────────────────────────────────────────────────────────
export default function Detalle() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const [c, setC] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr]         = useState(null)

  useEffect(() => {
    supabase.from('clinicas').select('*').eq('id', id).single()
      .then(({ data, error }) => {
        if (error) { setErr('No se encontró el consultorio.'); setLoading(false); return }
        setC(data); setLoading(false)
      })
  }, [id])

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#f3f4f6' }}>
      <nav style={S.nav}><button style={S.backBtn} onClick={() => navigate(-1)}>← Volver</button></nav>
      <div style={{ padding:20, display:'flex', flexDirection:'column', gap:12 }}>
        <div className="sk" style={{ height:200, borderRadius:0 }} />
        {[...Array(3)].map((_, i) => <div key={i} className="sk" style={{ height:120, borderRadius:16 }} />)}
      </div>
    </div>
  )

  if (err) return (
    <div style={{ minHeight:'100vh', background:'#f3f4f6' }}>
      <nav style={S.nav}><button style={S.backBtn} onClick={() => navigate('/')}>← Volver</button></nav>
      <div style={{ textAlign:'center', padding:80 }}><div style={{ fontSize:48 }}>⚠️</div><p style={{ marginTop:12 }}>{err}</p></div>
    </div>
  )

  // Calcular estado abierto/cerrado real
  const bloques   = parseHorario(c.horario_texto)
  const abierto   = c.activo && estaAbierto(bloques)
  const servicios = (c.servicios || '').split(',').map(s => s.trim()).filter(Boolean)

  return (
    <div style={{ minHeight:'100vh', background:'#f3f4f6', paddingBottom:40 }}>

      {/* NAV */}
      <nav style={S.nav}>
        <button style={S.backBtn} onClick={() => navigate('/')}>← Directorio</button>
        <span style={{ ...S.badge, ...(abierto ? S.badgeOpen : S.badgeClosed) }}>
          {abierto ? '● ABIERTO AHORA' : '● CERRADO'}
        </span>
      </nav>

      {/* HEADER */}
      <header style={S.header}>
        <div style={{ marginBottom:16 }}>
          {c.foto_url
            ? <img src={c.foto_url} alt={c.nombre_doctor}
                style={{ width:90, height:90, borderRadius:'50%', objectFit:'cover', border:'4px solid rgba(255,255,255,0.3)' }} />
            : <div style={{ width:90, height:90, borderRadius:'50%', background:'linear-gradient(135deg,#10b981,#059669)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-disp)', fontSize:32, fontWeight:700, color:'#fff', boxShadow:'0 6px 24px rgba(16,185,129,0.4)' }}>
                {initials(c.nombre_doctor)}
              </div>
          }
        </div>
        <h1 style={{ fontFamily:'var(--font-disp)', fontSize:'clamp(20px,5vw,26px)', color:'#fff', marginBottom:8 }}>{c.nombre_doctor}</h1>
        <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', color:'#fff', padding:'5px 14px', borderRadius:20, fontSize:13, fontWeight:600, marginBottom:6 }}>
          🩺 {c.especialidad}
        </div>
        {c.nombre_clinica && <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)', marginTop:4 }}>{c.nombre_clinica}</div>}
      </header>

      {/* CONTENT */}
      <div style={{ padding:'20px 16px', display:'flex', flexDirection:'column', gap:12, maxWidth:640, margin:'0 auto' }}>

        {/* Ubicación */}
        <div style={S.card}>
          <div style={S.cardTitle}>🏥 Consultorio</div>
          <InfoRow icon="🏢" label="Piso / Nivel"           value={c.piso_nivel} />
          <InfoRow icon="🚪" label="Número de Consultorio"  value={c.numero_consultorio} />
          <InfoRow icon="🏷️" label="Nombre de la Clínica"   value={c.nombre_clinica} />
        </div>

        {/* Contacto */}
        <div style={S.card}>
          <div style={S.cardTitle}>📞 Contacto</div>
          <InfoRow icon="📞" label="Teléfono"   value={c.telefono} />
          <InfoRow icon="🔢" label="Extensión"  value={c.extension} />
          <InfoRow icon="💬" label="WhatsApp"   value={c.whatsapp} />
          <InfoRow icon="✉️" label="Email"       value={c.email} />
        </div>

        {/* ── HORARIOS DINÁMICO ── */}
        <div style={S.card}>
          <div style={S.cardTitle}>⏰ Horarios de Atención</div>
          <HorarioGrid texto={c.horario_texto} />
        </div>

        {/* Servicios */}
        {servicios.length > 0 && (
          <div style={S.card}>
            <div style={S.cardTitle}>✅ Servicios ofrecidos</div>
            {servicios.map((sv, i) => (
              <div key={i} style={{ padding:'7px 0', borderBottom: i < servicios.length - 1 ? '1px solid #f3f4f6' : 'none', fontSize:13, color:'#374151', display:'flex', gap:8 }}>
                <span style={{ color:'#10b981', fontWeight:700, flexShrink:0 }}>●</span>{sv}
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div style={{ display:'grid', gridTemplateColumns: c.whatsapp ? '1fr 1fr' : '1fr', gap:10 }}>
          <a href={`tel:${c.telefono}`} style={S.btnCall}>📞 Llamar al consultorio</a>
          {c.whatsapp && (
            <a href={waLink(c.whatsapp, c.nombre_doctor)} target="_blank" rel="noopener noreferrer" style={S.btnWa}>
              💬 WhatsApp
            </a>
          )}
        </div>

        <button onClick={() => navigate('/')} style={S.btnBack}>← Volver al directorio</button>
      </div>
    </div>
  )
}

const S = {
  nav:{ background:'linear-gradient(135deg,#2563eb,#1d4ed8)', height:56, padding:'0 20px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50 },
  backBtn:{ background:'none', border:'none', color:'rgba(255,255,255,0.8)', fontSize:14, fontWeight:500, cursor:'pointer' },
  badge:{ fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:20 },
  badgeOpen:{ background:'#d1fae5', color:'#065f46' },
  badgeClosed:{ background:'#fee2e2', color:'#991b1b' },
  header:{ background:'linear-gradient(155deg,#1e40af,#2563eb 60%,#3b82f6)', padding:'28px 24px 36px', textAlign:'center' },
  card:{ background:'#fff', borderRadius:16, padding:'16px 18px', boxShadow:'0 2px 8px rgba(0,0,0,0.07)' },
  cardTitle:{ fontSize:11, textTransform:'uppercase', letterSpacing:1, color:'#9ca3af', fontWeight:700, marginBottom:10 },
  btnCall:{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'#2563eb', color:'#fff', padding:16, borderRadius:12, fontSize:15, fontWeight:700, boxShadow:'0 4px 18px rgba(37,99,235,0.32)', textDecoration:'none' },
  btnWa:{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'#10b981', color:'#fff', padding:16, borderRadius:12, fontSize:15, fontWeight:700, boxShadow:'0 4px 18px rgba(16,185,129,0.32)', textDecoration:'none' },
  btnBack:{ background:'none', border:'1.5px solid #e5e7eb', color:'#6b7280', padding:'12px', borderRadius:10, fontSize:14, fontWeight:600, width:'100%', cursor:'pointer' },
}
