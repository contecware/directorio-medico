import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { parseHorario, estaAbierto, normalizar } from '../horario'

/* ─── constantes ─────────────────────────────────────────────── */
const ESP_EMOJI = {
  'Cardiología':'❤️','Pediatría':'👶','Ortopedia':'🦴','Dermatología':'✨',
  'Neurología':'🧠','Ginecología':'🌸','Oftalmología':'👁️','Psiquiatría':'💭',
  'Urología':'🔬','Endocrinología':'⚗️','Gastroenterología':'🫀',
  'Odontología':'🦷','Medicina General':'🩺','Oncología':'🎗️','Reumatología':'💊',
}
const ESPECIALIDADES = Object.keys(ESP_EMOJI)
const NIVELES = ['Nivel 1','Nivel 2','Nivel 3','Nivel 4','Nivel 5','Nivel 6','Nivel 7','Nivel 8','Nivel 9']

function initials(name = '') {
  return name.split(' ').filter(w => /^[A-ZÁÉÍÓÚ]/i.test(w)).slice(0, 2).map(w => w[0].toUpperCase()).join('')
}
function waLink(num, doctor) {
  const n = (num || '').replace(/\D/g, '')
  const m = encodeURIComponent(`Hola, me comunico del Directorio Médico con ${doctor}. Quisiera información sobre sus servicios.`)
  return `https://wa.me/${n}?text=${m}`
}

/* ─── Búsqueda NORMALIZADA: quita tildes + minúsculas ─────────── */
function buscar(clinica, query) {
  if (!query) return true
  const q   = normalizar(query)   // quita tildes, minúsculas
  const campos = [
    clinica.nombre_doctor,
    clinica.especialidad,
    clinica.nombre_clinica,
    clinica.numero_consultorio,
    clinica.piso_nivel,
  ]
  return campos.some(c => normalizar(c || '').includes(q))
}

/* ─── Skeleton ────────────────────────────────────────────────── */
function CardSk() {
  return (
    <div style={C.card}>
      <div style={{ height:4, background:'#e5e7eb' }} />
      <div style={{ display:'flex', gap:12, padding:'16px 16px 0', alignItems:'flex-start' }}>
        <div className="sk" style={{ width:66, height:66, borderRadius:'50%', flexShrink:0 }} />
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
          <div className="sk" style={{ height:15, width:'75%' }} />
          <div className="sk" style={{ height:12, width:'50%' }} />
          <div style={{ display:'flex', gap:6 }}>
            <div className="sk" style={{ height:20, width:90, borderRadius:20 }} />
            <div className="sk" style={{ height:20, width:70, borderRadius:20 }} />
          </div>
        </div>
      </div>
      <div style={{ padding:'10px 16px 12px', borderTop:'1px solid #f3f4f6', marginTop:12, display:'flex', flexDirection:'column', gap:7 }}>
        <div className="sk" style={{ height:12, width:'65%' }} />
        <div className="sk" style={{ height:12, width:'80%' }} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, padding:'12px 16px 16px' }}>
        <div className="sk" style={{ height:44, borderRadius:12 }} />
        <div className="sk" style={{ height:44, borderRadius:12 }} />
      </div>
    </div>
  )
}

/* ─── Card individual ─────────────────────────────────────────── */
function ClinicCard({ c, onDetalle }) {
  const emoji   = ESP_EMOJI[c.especialidad] || '🩺'

  // ── Estado abierto/cerrado REAL basado en horario ──
  const bloques  = parseHorario(c.horario_texto)
  const abierto  = c.activo && (bloques.length > 0 ? estaAbierto(bloques) : c.activo)

  return (
    <div style={C.card}>
      {/* Franja top */}
      <div style={{ height:4, background:'linear-gradient(90deg,#2563eb,#60a5fa)' }} />

      {/* Avatar + info */}
      <div style={{ display:'flex', gap:12, padding:'16px 16px 0', alignItems:'flex-start', cursor:'pointer', position:'relative' }} onClick={onDetalle}>
        {c.foto_url
          ? <img src={c.foto_url} alt={c.nombre_doctor}
              style={{ width:66, height:66, borderRadius:'50%', objectFit:'cover', border:'3px solid #e5e7eb', flexShrink:0 }} />
          : <div style={{ width:66, height:66, borderRadius:'50%', background:'linear-gradient(135deg,#1e40af,#2563eb)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-disp)', fontSize:22, fontWeight:700, flexShrink:0 }}>
              {initials(c.nombre_doctor)}
            </div>
        }

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:16, fontWeight:800, color:'#111827', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {c.nombre_clinica || c.nombre_doctor}
          </div>
          <div style={{ fontSize:14, fontWeight:600, color:'#2563eb', marginBottom:8 }}>
            {c.nombre_clinica ? c.nombre_doctor : ''}
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
            <span style={C.badgeBlue}>{emoji} {c.especialidad}</span>
            <span style={C.badgeGreen}>📍 {c.piso_nivel}</span>
          </div>
        </div>

        {/* Estado abierto/cerrado REAL */}
        <div style={{ position:'absolute', top:0, right:0, fontSize:10, fontWeight:700,
          color: abierto ? '#059669' : '#dc2626' }}>
          {abierto ? '● Abierto' : '● Cerrado'}
        </div>
      </div>

      {/* Meta */}
      <div style={{ padding:'12px 16px', borderTop:'1px solid #f3f4f6', marginTop:12, display:'flex', flexDirection:'column', gap:6, cursor:'pointer' }} onClick={onDetalle}>
        <div style={C.metaRow}><span>📍</span><span>Consultorio {c.numero_consultorio}{c.extension ? `, ext. ${c.extension}` : ''}</span></div>
        <div style={C.metaRow}><span>🕐</span><span>{c.horario_texto || 'Consultar horario'}</span></div>
        {c.email && <div style={C.metaRow}><span>✉️</span><span>{c.email}</span></div>}
      </div>

      {/* Botones */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, padding:'12px 16px 16px' }}>
        <a href={`tel:${c.telefono}`} style={C.btnCall}>📞 Llamar</a>
        {c.whatsapp
          ? <a href={waLink(c.whatsapp, c.nombre_doctor)} target="_blank" rel="noopener noreferrer" style={C.btnWa}>💬 WhatsApp</a>
          : <button onClick={onDetalle} style={C.btnGray}>Ver detalle →</button>
        }
      </div>
    </div>
  )
}

/* ─── PAGE ────────────────────────────────────────────────────── */
export default function Directorio() {
  const navigate = useNavigate()
  const [clinicas,  setClincias]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [busqueda,  setBusqueda]  = useState('')
  const [filtroEsp, setFiltroEsp] = useState('')
  const [filtroNiv, setFiltroNiv] = useState('')
  const [stats,     setStats]     = useState({ total:0, especialidades:0, pisos:0, activos:0 })

  const cargar = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('clinicas').select('*').order('nombre_doctor')
    const rows = data || []
    setClincias(rows)

    // Calcular "activos ahora" con el horario real
    const ahora = new Date()
    const activosAhora = rows.filter(c => {
      if (!c.activo) return false
      const bloques = parseHorario(c.horario_texto)
      return bloques.length > 0 ? estaAbierto(bloques, ahora) : true
    })

    setStats({
      total:          rows.length,
      especialidades: new Set(rows.map(c => c.especialidad)).size,
      pisos:          new Set(rows.map(c => c.piso_nivel)).size,
      activos:        activosAhora.length,
    })
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  // ── Filtro con búsqueda normalizada ──
  const filtradas = clinicas.filter(c =>
    buscar(c, busqueda) &&
    (!filtroEsp || c.especialidad === filtroEsp) &&
    (!filtroNiv || c.piso_nivel   === filtroNiv)
  )

  return (
    <div style={{ minHeight:'100vh', background:'#f3f4f6', paddingBottom:72 }}>

      {/* NAV */}
      <nav style={C.nav}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={C.navIcon}>🏥</div>
          <div>
            <div style={{ color:'#fff', fontSize:16, fontWeight:700, lineHeight:1.1 }}>Directorio Médico</div>
            <div style={{ color:'rgba(255,255,255,0.7)', fontSize:10 }}>Torre Médica · Encuentra tu especialista</div>
          </div>
        </div>
        <button style={C.navBtn} onClick={() => navigate('/login')}>⚙ Admin</button>
      </nav>

      {/* HERO */}
      <header style={C.hero}>
        <div style={C.heroBadge}>🔴 Actualizado en tiempo real</div>
        <h1 style={C.heroTitle}>Directorio Médico</h1>
        <p style={{ color:'rgba(255,255,255,0.7)', fontSize:14, marginBottom:22 }}>
          Torre Médica · Encuentra tu especialista
        </p>

        {/* Search card */}
        <div style={C.searchCard}>
          <div style={C.searchRow}>
            <span style={{ color:'#9ca3af', fontSize:16 }}>🔍</span>
            <input
              type="search"
              placeholder="Buscar clínica, doctor, especialidad..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={C.searchInput}
            />
            {busqueda && (
              <button onClick={() => setBusqueda('')}
                style={{ background:'none', border:'none', color:'#9ca3af', fontSize:13, cursor:'pointer' }}>✕</button>
            )}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <select style={C.select} value={filtroEsp} onChange={e => setFiltroEsp(e.target.value)}>
              <option value="">🩺 Especialidad</option>
              {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <select style={C.select} value={filtroNiv} onChange={e => setFiltroNiv(e.target.value)}>
              <option value="">🏢 Nivel / Piso</option>
              {NIVELES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          {(busqueda || filtroEsp || filtroNiv) && (
            <button
              onClick={() => { setBusqueda(''); setFiltroEsp(''); setFiltroNiv('') }}
              style={{ marginTop:10, background:'none', border:'1px solid #e5e7eb', color:'#6b7280', padding:'6px 14px', borderRadius:8, fontSize:12, fontWeight:500, width:'100%', cursor:'pointer' }}>
              ✕ Limpiar filtros
            </button>
          )}
        </div>
      </header>

      {/* STATS */}
      <div style={C.statsBar}>
        {[
          { n: stats.total,          l: 'Médicos' },
          { n: stats.especialidades, l: 'Especialidades' },
          { n: stats.pisos,          l: 'Niveles' },
          { n: stats.activos,        l: 'Abiertos ahora' },
        ].map((s, i) => (
          <div key={i} style={C.statItem}>
            <span style={{ fontSize:22, fontWeight:800, color:'#1e40af', fontFamily:'var(--font-disp)' }}>{s.n}</span>
            <span style={{ fontSize:9, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.8px', fontWeight:700 }}>{s.l}</span>
          </div>
        ))}
      </div>

      {/* COUNT */}
      <div style={{ padding:'4px 18px 12px', fontSize:14, fontWeight:500, color:'#6b7280' }}>
        {filtradas.length} clínica{filtradas.length !== 1 ? 's' : ''} encontrada{filtradas.length !== 1 ? 's' : ''}
        {busqueda && <span style={{ color:'#2563eb', fontWeight:700 }}> para "{busqueda}"</span>}
      </div>

      {/* CARDS */}
      <div style={C.grid}>
        {loading
          ? [...Array(4)].map((_, i) => <CardSk key={i} />)
          : filtradas.length === 0
            ? (
              <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'64px 20px' }}>
                <div style={{ fontSize:52, marginBottom:14 }}>🔍</div>
                <div style={{ fontSize:17, fontWeight:700, color:'#111827', marginBottom:6 }}>Sin resultados</div>
                <div style={{ fontSize:14, color:'#6b7280' }}>
                  {busqueda
                    ? `No se encontraron resultados para "${busqueda}"`
                    : 'Intenta con otro filtro'}
                </div>
              </div>
            )
            : filtradas.map((c, i) => (
              <ClinicCard key={c.id} c={c} onDetalle={() => navigate(`/clinica/${c.id}`)} />
            ))
        }
      </div>

      {/* BOTTOM NAV */}
      <nav style={C.bottomNav}>
        <button style={{ ...C.bItem, ...C.bActive }}><span style={{ fontSize:22 }}>🏠</span>Inicio</button>
        <button style={C.bItem} onClick={() => document.querySelector('input[type=search]')?.focus()}>
          <span style={{ fontSize:22 }}>🔍</span>Buscar
        </button>
        <button style={C.bItem} onClick={() => navigate('/login')}>
          <span style={{ fontSize:22 }}>⚙️</span>Admin
        </button>
      </nav>
    </div>
  )
}

/* ─── estilos ─────────────────────────────────────────────────── */
const C = {
  nav:{ background:'linear-gradient(135deg,#2563eb,#1d4ed8)', height:58, padding:'0 18px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:60, boxShadow:'0 2px 12px rgba(37,99,235,0.35)' },
  navIcon:{ width:36, height:36, background:'rgba(255,255,255,0.2)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 },
  navBtn:{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', color:'#fff', padding:'6px 14px', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer' },
  hero:{ background:'linear-gradient(155deg,#1e40af 0%,#2563eb 55%,#3b82f6 100%)', padding:'28px 18px 52px', overflow:'visible' },
  heroBadge:{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.22)', color:'rgba(255,255,255,0.9)', padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:600, letterSpacing:'0.6px', textTransform:'uppercase', marginBottom:14 },
  heroTitle:{ fontFamily:'var(--font-disp)', fontSize:'clamp(24px,6vw,32px)', color:'#fff', lineHeight:1.25, marginBottom:8 },
  searchCard:{ background:'#fff', borderRadius:16, padding:16, boxShadow:'0 8px 30px rgba(0,0,0,0.15)', margin:'0 0 -30px', position:'relative', zIndex:10 },
  searchRow:{ display:'flex', alignItems:'center', gap:8, border:'2px solid #e5e7eb', borderRadius:12, padding:'10px 14px', marginBottom:12, transition:'border-color 0.2s' },
  searchInput:{ flex:1, border:'none', outline:'none', fontSize:15, color:'#111827', background:'transparent', width:'100%' },
  select:{ width:'100%', padding:'10px 12px', border:'2px solid #e5e7eb', borderRadius:10, fontSize:13, fontWeight:500, color:'#374151', background:'#fff', outline:'none', cursor:'pointer' },
  statsBar:{ display:'flex', background:'#fff', margin:'44px 16px 16px', borderRadius:12, boxShadow:'0 1px 4px rgba(0,0,0,0.07)', overflow:'hidden' },
  statItem:{ flex:1, textAlign:'center', padding:'12px 6px', borderRight:'1px solid #f3f4f6', display:'flex', flexDirection:'column', gap:2 },
  grid:{ padding:'0 14px', display:'flex', flexDirection:'column', gap:14 },
  card:{ background:'#fff', borderRadius:18, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.08)', border:'1px solid rgba(0,0,0,0.04)' },
  badgeBlue:{ background:'#dbeafe', color:'#1e40af', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 },
  badgeGreen:{ background:'#d1fae5', color:'#065f46', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 },
  metaRow:{ display:'flex', alignItems:'flex-start', gap:8, fontSize:13, color:'#4b5563', lineHeight:1.4 },
  btnCall:{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, background:'#2563eb', color:'#fff', padding:'13px 10px', borderRadius:12, fontSize:14, fontWeight:700, boxShadow:'0 2px 8px rgba(37,99,235,0.3)', textDecoration:'none' },
  btnWa:{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, background:'#10b981', color:'#fff', padding:'13px 10px', borderRadius:12, fontSize:14, fontWeight:700, boxShadow:'0 2px 8px rgba(16,185,129,0.3)', textDecoration:'none' },
  btnGray:{ display:'flex', alignItems:'center', justifyContent:'center', gap:4, background:'#f3f4f6', color:'#374151', padding:'13px 10px', borderRadius:12, fontSize:14, fontWeight:700, border:'none', cursor:'pointer' },
  bottomNav:{ position:'fixed', bottom:0, left:0, right:0, background:'#fff', borderTop:'1px solid #e5e7eb', display:'flex', height:66, zIndex:59, boxShadow:'0 -4px 20px rgba(0,0,0,0.07)' },
  bItem:{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3, background:'none', border:'none', color:'#9ca3af', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', cursor:'pointer' },
  bActive:{ color:'#2563eb' },
}
