import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import styles from './Detalle.module.css'

const DIAS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']

function getInitials(name = '') {
  return name.split(' ').filter(w => /^[A-ZÁÉÍÓÚ]/i.test(w)).slice(0, 2).map(w => w[0].toUpperCase()).join('')
}

export default function Detalle() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const [clinica, setClinicia] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    async function cargar() {
      const { data, error } = await supabase
        .from('clinicas')
        .select('*')
        .eq('id', id)
        .single()

      if (error) { setError('No se encontró el consultorio.'); setLoading(false); return }
      setClinicia(data)
      setLoading(false)
    }
    cargar()
  }, [id])

  if (loading) return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>← Volver</button>
      </nav>
      <div className={styles.loadingWrap}>
        <div className={`skeleton ${styles.skHero}`} />
        {[...Array(3)].map((_, i) => <div key={i} className={`skeleton ${styles.skCard}`} />)}
      </div>
    </div>
  )

  if (error) return (
    <div className={styles.page}>
      <nav className={styles.nav}><button className={styles.backBtn} onClick={() => navigate('/')}>← Volver</button></nav>
      <div className={styles.errorWrap}><div className={styles.errorIcon}>⚠️</div><p>{error}</p></div>
    </div>
  )

  const servicios = clinica.servicios
    ? clinica.servicios.split(',').map(s => s.trim()).filter(Boolean)
    : []

  return (
    <div className={styles.page}>
      {/* NAV */}
      <nav className={styles.nav}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>← Directorio</button>
        <span className={clinica.activo ? styles.openBadge : styles.closedBadge}>
          {clinica.activo ? '● ABIERTO' : '● CERRADO'}
        </span>
      </nav>

      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.avatar}>{getInitials(clinica.nombre_doctor)}</div>
        <h1 className={styles.name}>{clinica.nombre_doctor}</h1>
        <div className={styles.specialty}>🩺 {clinica.especialidad}</div>
        <div className={styles.clinicSub}>{clinica.nombre_clinica}</div>
      </header>

      {/* CARDS */}
      <div className={styles.cards}>

        {/* Ubicación */}
        <section className={styles.infoCard}>
          <h2 className={styles.cardTitle}>🏥 Consultorio</h2>
          <div className={styles.infoRows}>
            <InfoRow icon="🏢" label="Piso / Nivel"        value={clinica.piso_nivel} />
            <InfoRow icon="🚪" label="Número de Consultorio" value={clinica.numero_consultorio} />
            <InfoRow icon="🏷️" label="Nombre de la Clínica" value={clinica.nombre_clinica} />
          </div>
        </section>

        {/* Contacto */}
        <section className={styles.infoCard}>
          <h2 className={styles.cardTitle}>📞 Contacto</h2>
          <div className={styles.infoRows}>
            <InfoRow icon="📞" label="Teléfono"  value={clinica.telefono} />
            <InfoRow icon="🔢" label="Extensión" value={clinica.extension} />
            {clinica.email && <InfoRow icon="✉️" label="Email" value={clinica.email} />}
          </div>
        </section>

        {/* Horarios */}
        <section className={styles.infoCard}>
          <h2 className={styles.cardTitle}>⏰ Horarios</h2>
          <p className={styles.horariosText}>{clinica.horario_texto}</p>
          <div className={styles.scheduleGrid}>
            {DIAS.map((d, i) => (
              <div key={d} className={`${styles.schedDay} ${i === new Date().getDay() - 1 ? styles.schedToday : ''}`}>
                <div className={styles.schedDayName}>{d}</div>
                <div className={styles.schedHours}>{clinica.horario_texto?.includes('Sáb') || i < 5 ? '8:00–14:00' : 'Cerrado'}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Servicios */}
        {servicios.length > 0 && (
          <section className={styles.infoCard}>
            <h2 className={styles.cardTitle}>✅ Servicios ofrecidos</h2>
            <ul className={styles.serviceList}>
              {servicios.map((s, i) => (
                <li key={i} className={styles.serviceItem}>
                  <span className={styles.serviceDot}>●</span>{s}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* CTA */}
        <div style={{ display:'grid', gridTemplateColumns: clinica.whatsapp ? '1fr 1fr' : '1fr', gap: 10 }}>
          <a href={`tel:${clinica.telefono}`} className={styles.callBtn}>
            📞 Llamar al consultorio
          </a>
          {clinica.whatsapp && (
            <a
              href={`https://wa.me/${clinica.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent(`Hola, me comunico con ${clinica.nombre_doctor}. Quisiera información sobre sus servicios.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.waBtn}
            >
              💬 WhatsApp
            </a>
          )}
        </div>

        <button className={styles.backBtnBottom} onClick={() => navigate('/')}>
          ← Volver al directorio
        </button>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'9px 0', borderBottom:'1px solid var(--g100)' }}>
      <div style={{ width:34, height:34, background:'var(--g100)', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize:10, color:'var(--g500)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</div>
        <div style={{ fontSize:14, color:'var(--g700)', fontWeight:600 }}>{value || '—'}</div>
      </div>
    </div>
  )
}
