import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import styles from './Directorio.module.css'

const ESPECIALIDADES = [
  'Cardiología','Pediatría','Ortopedia','Dermatología','Neurología',
  'Ginecología','Oftalmología','Psiquiatría','Urología','Endocrinología',
  'Gastroenterología','Odontología','Medicina General',
]

const NIVELES = ['Nivel 1','Nivel 2','Nivel 3','Nivel 4','Nivel 5','Piso 1','Piso 2','Piso 3']

const ESP_EMOJI = {
  'Cardiología':'❤️','Pediatría':'👶','Ortopedia':'🦴','Dermatología':'✨',
  'Neurología':'🧠','Ginecología':'🌸','Oftalmología':'👁️','Psiquiatría':'💭',
  'Urología':'🔬','Endocrinología':'⚗️','Gastroenterología':'🫀',
  'Odontología':'🦷','Medicina General':'🩺',
}

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(w => /^[A-ZÁÉÍÓÚ]/i.test(w))
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

function getWaLink(numero, nombre) {
  const clean = (numero || '').replace(/\D/g, '')
  const msg   = encodeURIComponent(`Hola, me comunico del Directorio Médico con ${nombre}. Quisiera información sobre sus servicios.`)
  return `https://wa.me/${clean}?text=${msg}`
}

// Skeleton loader de una card
function SkeletonCard() {
  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <div className={`skeleton ${styles.avatarSk}`} />
        <div className={styles.cardInfo} style={{ gap: 8, display:'flex', flexDirection:'column' }}>
          <div className="skeleton" style={{ height: 14, width: '80%', borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 12, width: '55%', borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 10, width: '65%', borderRadius: 6 }} />
        </div>
      </div>
      <div className={styles.cardMeta}>
        <div className="skeleton" style={{ height: 11, width: '60%', borderRadius: 5 }} />
        <div className="skeleton" style={{ height: 11, width: '50%', borderRadius: 5 }} />
      </div>
      <div className={styles.cardActions}>
        <div className={`skeleton ${styles.actionBtnSk}`} />
        <div className={`skeleton ${styles.actionBtnSk}`} />
      </div>
    </div>
  )
}

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
    const { data, error } = await supabase
      .from('clinicas')
      .select('*')
      .order('nombre_doctor')
    if (error) { console.error(error); setLoading(false); return }
    const rows = data || []
    setClincias(rows)
    setStats({
      total:          rows.length,
      especialidades: new Set(rows.map(c => c.especialidad)).size,
      pisos:          new Set(rows.map(c => c.piso_nivel)).size,
      activos:        rows.filter(c => c.activo).length,
    })
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const filtradas = clinicas.filter(c => {
    const q = busqueda.toLowerCase()
    const matchQ = !q ||
      c.nombre_doctor?.toLowerCase().includes(q) ||
      c.especialidad?.toLowerCase().includes(q)  ||
      c.nombre_clinica?.toLowerCase().includes(q)||
      c.numero_consultorio?.toLowerCase().includes(q)
    const matchE = !filtroEsp || c.especialidad === filtroEsp
    const matchN = !filtroNiv || c.piso_nivel   === filtroNiv
    return matchQ && matchE && matchN
  })

  return (
    <div className={styles.page}>

      {/* ══ NAV ══ */}
      <nav className={styles.nav}>
        <div className={styles.navLogo}>
          <div className={styles.navIcon}>🏥</div>
          <div>
            <div className={styles.navTitle}>Directorio Médico</div>
            <div className={styles.navSub}>Torre Médica · Encuentra tu especialista</div>
          </div>
        </div>
        <button className={styles.adminLink} onClick={() => navigate('/login')}>
          ⚙ Admin
        </button>
      </nav>

      {/* ══ HERO SEARCH ══ */}
      <header className={styles.hero}>
        <div className={styles.heroBadge}>🔴 Actualizado en tiempo real</div>
        <h1 className={styles.heroTitle}>Encuentra tu<br />especialista ideal</h1>
        <p className={styles.heroSub}>Directorio completo de clínicas y médicos</p>

        {/* Search card flotante */}
        <div className={styles.searchCard}>
          <div className={styles.searchRow}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Buscar clínica o doctor..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
          <div className={styles.selectRow}>
            <div className={styles.selectWrap}>
              <select
                className={styles.select}
                value={filtroEsp}
                onChange={e => setFiltroEsp(e.target.value)}
              >
                <option value="">🩺 Especialidad</option>
                {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div className={styles.selectWrap}>
              <select
                className={styles.select}
                value={filtroNiv}
                onChange={e => setFiltroNiv(e.target.value)}
              >
                <option value="">🏢 Nivel / Piso</option>
                {NIVELES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          {(busqueda || filtroEsp || filtroNiv) && (
            <button
              className={styles.clearFilters}
              onClick={() => { setBusqueda(''); setFiltroEsp(''); setFiltroNiv('') }}
            >
              ✕ Limpiar filtros
            </button>
          )}
        </div>
      </header>

      {/* ══ STATS ══ */}
      <div className={styles.statsBar}>
        <div className={styles.statItem}><span className={styles.statN}>{stats.total}</span><span className={styles.statL}>Médicos</span></div>
        <div className={styles.statItem}><span className={styles.statN}>{stats.especialidades}</span><span className={styles.statL}>Especialidades</span></div>
        <div className={styles.statItem}><span className={styles.statN}>{stats.pisos}</span><span className={styles.statL}>Niveles</span></div>
        <div className={styles.statItem}><span className={styles.statN}>{stats.activos}</span><span className={styles.statL}>Activos hoy</span></div>
      </div>

      {/* ══ RESULTADO COUNT ══ */}
      <div className={styles.resultInfo}>
        {filtradas.length} clínica{filtradas.length !== 1 ? 's' : ''} encontrada{filtradas.length !== 1 ? 's' : ''}
      </div>

      {/* ══ CARDS ══ */}
      <div className={styles.cardsList}>
        {loading
          ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
          : filtradas.length === 0
            ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>🔍</div>
                <p className={styles.emptyTitle}>Sin resultados</p>
                <p className={styles.emptySub}>Intenta con otra búsqueda o filtro</p>
              </div>
            )
            : filtradas.map((c, idx) => (
              <ClinicCard
                key={c.id}
                clinica={c}
                delay={idx * 55}
                onVerDetalle={() => navigate(`/clinica/${c.id}`)}
              />
            ))
        }
      </div>

      {/* ══ BOTTOM NAV (móvil) ══ */}
      <nav className={styles.bottomNav}>
        <button className={`${styles.bItem} ${styles.bActive}`}>
          <span>🏠</span>Inicio
        </button>
        <button
          className={styles.bItem}
          onClick={() => document.querySelector(`.${styles.searchInput}`)?.focus()}
        >
          <span>🔍</span>Buscar
        </button>
        <button className={styles.bItem} onClick={() => navigate('/login')}>
          <span>⚙️</span>Admin
        </button>
      </nav>
    </div>
  )
}

/* ══ CARD INDIVIDUAL ══ */
function ClinicCard({ clinica: c, delay, onVerDetalle }) {
  const emoji = ESP_EMOJI[c.especialidad] || '🩺'

  return (
    <div className={styles.card} style={{ animationDelay: `${delay}ms` }}>

      {/* Franja de color arriba */}
      <div className={styles.cardStripe} />

      {/* Cuerpo superior: avatar + info */}
      <div className={styles.cardTop}>
        {/* Avatar / foto */}
        <div className={styles.avatarWrap} onClick={onVerDetalle}>
          {c.foto_url
            ? <img src={c.foto_url} alt={c.nombre_doctor} className={styles.avatarImg} />
            : <div className={styles.avatarInitials}>{getInitials(c.nombre_doctor)}</div>
          }
        </div>

        {/* Info principal */}
        <div className={styles.cardInfo} onClick={onVerDetalle}>
          <div className={styles.clinicName}>{c.nombre_clinica}</div>
          <div className={styles.doctorName}>{c.nombre_doctor}</div>
          <div className={styles.badges}>
            <span className={styles.badgeBlue}>{emoji} {c.especialidad}</span>
            <span className={styles.badgeGreen}>📍 {c.piso_nivel}</span>
          </div>
        </div>

        {/* Badge abierto/cerrado */}
        <div className={styles.statusCorner}>
          {c.activo
            ? <span className={styles.openDot}>● Abierto</span>
            : <span className={styles.closedDot}>● Cerrado</span>
          }
        </div>
      </div>

      {/* Meta info: ubicación y horario */}
      <div className={styles.cardMeta} onClick={onVerDetalle}>
        <div className={styles.metaRow}>
          <span>📍</span>
          <span>Consultorio {c.numero_consultorio}{c.extension ? `, ext. ${c.extension}` : ''}</span>
        </div>
        <div className={styles.metaRow}>
          <span>🕐</span>
          <span>{c.horario_texto || 'Consultar horario'}</span>
        </div>
        {c.email && (
          <div className={styles.metaRow}>
            <span>✉️</span>
            <span>{c.email}</span>
          </div>
        )}
      </div>

      {/* ══ BOTONES ACCIÓN ══ */}
      <div className={styles.cardActions}>
        {/* Llamar */}
        <a
          href={`tel:${c.telefono}`}
          className={styles.btnCall}
          onClick={e => e.stopPropagation()}
        >
          📞 Llamar
        </a>

        {/* WhatsApp */}
        {c.whatsapp ? (
          <a
            href={getWaLink(c.whatsapp, c.nombre_doctor)}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.btnWhatsapp}
            onClick={e => e.stopPropagation()}
          >
            💬 WhatsApp
          </a>
        ) : (
          <button
            className={styles.btnDetalle}
            onClick={onVerDetalle}
          >
            Ver detalle →
          </button>
        )}
      </div>
    </div>
  )
}
