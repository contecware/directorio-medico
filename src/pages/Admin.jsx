import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import styles from './Admin.module.css'

const ESPECIALIDADES = [
  'Cardiología','Pediatría','Ortopedia','Dermatología','Neurología',
  'Ginecología','Oftalmología','Psiquiatría','Urología','Endocrinología',
  'Gastroenterología','Reumatología','Neumología','Oncología','Medicina General',
]

const EMPTY_FORM = {
  nombre_doctor: '', especialidad: '', nombre_clinica: '',
  piso_nivel: '', numero_consultorio: '', telefono: '',
  extension: '', whatsapp: '', email: '', horario_texto: '',
  servicios: '', foto_url: '', activo: true,
}

export default function Admin() {
  const navigate = useNavigate()
  const [clinicas,  setClincias]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [busqueda,  setBusqueda]  = useState('')
  const [modal,     setModal]     = useState(false)   // 'add' | 'edit' | false
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [editId,    setEditId]    = useState(null)
  const [saving,    setSaving]    = useState(false)
  const [toast,     setToast]     = useState(null)
  const [delConfirm, setDelConfirm] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const cargar = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('clinicas').select('*').order('nombre_doctor')
    if (error) { showToast('Error al cargar datos', 'error'); setLoading(false); return }
    setClincias(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  function logout() {
    sessionStorage.removeItem('dm_admin')
    navigate('/login')
  }

  function openAdd() {
    setForm(EMPTY_FORM)
    setEditId(null)
    setModal('add')
  }

  function openEdit(c) {
    setForm({
      nombre_doctor:    c.nombre_doctor    || '',
      especialidad:     c.especialidad     || '',
      nombre_clinica:   c.nombre_clinica   || '',
      piso_nivel:       c.piso_nivel       || '',
      numero_consultorio: c.numero_consultorio || '',
      telefono:         c.telefono         || '',
      extension:        c.extension        || '',
      whatsapp:         c.whatsapp         || '',
      email:            c.email            || '',
      horario_texto:    c.horario_texto    || '',
      servicios:        c.servicios        || '',
      foto_url:         c.foto_url         || '',
      activo:           c.activo ?? true,
    })
    setEditId(c.id)
    setModal('edit')
  }

  function closeModal() { setModal(false); setEditId(null) }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.nombre_doctor.trim()) { showToast('El nombre del doctor es requerido', 'error'); return }
    setSaving(true)
    const payload = { ...form }

    let error
    if (modal === 'edit') {
      ;({ error } = await supabase.from('clinicas').update(payload).eq('id', editId))
    } else {
      ;({ error } = await supabase.from('clinicas').insert([payload]))
    }

    if (error) { showToast('Error al guardar: ' + error.message, 'error') }
    else        { showToast(modal === 'edit' ? 'Registro actualizado ✓' : 'Médico agregado ✓'); closeModal(); cargar() }
    setSaving(false)
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('clinicas').delete().eq('id', id)
    setDelConfirm(null)
    if (error) showToast('Error al eliminar', 'error')
    else { showToast('Registro eliminado'); cargar() }
  }

  async function toggleActivo(c) {
    const { error } = await supabase.from('clinicas').update({ activo: !c.activo }).eq('id', c.id)
    if (error) showToast('Error', 'error')
    else { cargar() }
  }

  const filtradas = clinicas.filter(c =>
    !busqueda ||
    c.nombre_doctor?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.especialidad?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.numero_consultorio?.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div className={styles.page}>
      {/* ── HEADER ── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>🏥</div>
          <div>
            <div className={styles.headerTitle}>Panel de Administración</div>
            <div className={styles.headerSub}>Directorio Médico</div>
          </div>
          <span className={styles.adminBadge}>ADMIN</span>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.viewPublicBtn} onClick={() => navigate('/')}>
            👁 Ver directorio
          </button>
          <button className={styles.logoutBtn} onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* ── TOOLBAR ── */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <div className={styles.searchBox}>
            <span>🔍</span>
            <input
              placeholder="Buscar doctor, especialidad, consultorio..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
            {busqueda && <button onClick={() => setBusqueda('')}>✕</button>}
          </div>
          <span className={styles.totalLabel}>{filtradas.length} registros</span>
        </div>
        <button className={styles.addBtn} onClick={openAdd}>
          + Agregar médico
        </button>
      </div>

      {/* ── TABLE ── */}
      <div className={styles.tableWrap}>
        {loading ? (
          <div className={styles.loadingRows}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`skeleton ${styles.skRow}`} />
            ))}
          </div>
        ) : filtradas.length === 0 ? (
          <div className={styles.emptyTable}>
            <div style={{ fontSize: 48 }}>📋</div>
            <div style={{ fontWeight: 700, color: 'var(--navy)', marginTop: 12 }}>
              {busqueda ? 'Sin resultados para tu búsqueda' : 'No hay registros aún'}
            </div>
            {!busqueda && (
              <button className={styles.addBtn} onClick={openAdd} style={{ marginTop: 16 }}>
                + Agregar primer médico
              </button>
            )}
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Doctor / Clínica</th>
                <th>Especialidad</th>
                <th>Consultorio</th>
                <th>Piso</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className={styles.doctorCell}>
                      <div className={styles.cellAvatar}>{c.nombre_doctor?.split(' ').filter(w => /^[A-Z]/i.test(w)).slice(0,2).map(w=>w[0]).join('').toUpperCase()}</div>
                      <div>
                        <div className={styles.cellName}>{c.nombre_doctor}</div>
                        <div className={styles.cellSub}>{c.nombre_clinica}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={styles.espTag}>{c.especialidad}</span></td>
                  <td><strong>{c.numero_consultorio}</strong></td>
                  <td>{c.piso_nivel}</td>
                  <td>{c.telefono}{c.extension && ` ext.${c.extension}`}</td>
                  <td>
                    <button
                      className={`${styles.statusPill} ${c.activo ? styles.pillOn : styles.pillOff}`}
                      onClick={() => toggleActivo(c)}
                      title="Clic para cambiar estado"
                    >
                      {c.activo ? '● Activo' : '● Inactivo'}
                    </button>
                  </td>
                  <td>
                    <div className={styles.actionBtns}>
                      <button className={styles.editBtn} onClick={() => openEdit(c)}>✏ Editar</button>
                      <button className={styles.delBtn}  onClick={() => setDelConfirm(c.id)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── MODAL FORMULARIO ── */}
      {modal && (
        <div className={styles.overlay} onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {modal === 'edit' ? '✏ Editar médico' : '+ Agregar nuevo médico'}
              </h2>
              <button className={styles.modalClose} onClick={closeModal}>✕</button>
            </div>

            <form onSubmit={handleSave} className={styles.modalBody}>
              <div className={styles.formRow}>
                <Field label="Nombre del Doctor *" name="nombre_doctor" value={form.nombre_doctor} onChange={handleChange} placeholder="Dr. Juan Pérez" />
                <Field label="Especialidad *" name="especialidad" value={form.especialidad} onChange={handleChange} type="select" options={ESPECIALIDADES} />
              </div>
              <Field label="Nombre de la Clínica" name="nombre_clinica" value={form.nombre_clinica} onChange={handleChange} placeholder="Clínica del Corazón" />
              <div className={styles.formRow}>
                <Field label="Piso / Nivel" name="piso_nivel" value={form.piso_nivel} onChange={handleChange} placeholder="Piso 2" />
                <Field label="N° Consultorio" name="numero_consultorio" value={form.numero_consultorio} onChange={handleChange} placeholder="201" />
              </div>
              <div className={styles.formRow}>
                <Field label="Teléfono" name="telefono" value={form.telefono} onChange={handleChange} placeholder="24561234" />
                <Field label="Extensión" name="extension" value={form.extension} onChange={handleChange} placeholder="201" />
              </div>
              <div className={styles.formRow}>
                <Field label="WhatsApp (con código país)" name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder="50224561234" />
                <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="doctor@clinica.com" />
              </div>
              <Field label="URL Foto del Doctor (opcional)" name="foto_url" value={form.foto_url} onChange={handleChange} placeholder="https://..." />
              <Field label="Horario (texto libre)" name="horario_texto" value={form.horario_texto} onChange={handleChange} placeholder="Lun-Vie 8:00am - 2:00pm" />
              <Field label="Servicios (separados por coma)" name="servicios" value={form.servicios} onChange={handleChange} placeholder="Ecocardiograma, Holter, Consulta general" />

              <label className={styles.checkRow}>
                <input type="checkbox" name="activo" checked={form.activo} onChange={handleChange} />
                <span>Consultorio activo (visible en el directorio)</span>
              </label>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={closeModal}>Cancelar</button>
                <button type="submit" className={styles.saveBtn} disabled={saving}>
                  {saving ? 'Guardando...' : '💾 Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CONFIRM DELETE ── */}
      {delConfirm && (
        <div className={styles.overlay}>
          <div className={styles.confirmBox}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ color: 'var(--navy)', marginBottom: 8 }}>¿Eliminar registro?</h3>
            <p style={{ color: 'var(--g500)', fontSize: 14, marginBottom: 24 }}>
              Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className={styles.cancelBtn} onClick={() => setDelConfirm(null)}>Cancelar</button>
              <button className={styles.confirmDelBtn} onClick={() => handleDelete(delConfirm)}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

/* Componente reutilizable de campo */
function Field({ label, name, value, onChange, placeholder, type = 'text', options }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      {type === 'select' ? (
        <select className={styles.fieldInput} name={name} value={value} onChange={onChange}>
          <option value="">Seleccionar...</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          className={styles.fieldInput}
          type={type} name={name} value={value}
          onChange={onChange} placeholder={placeholder}
        />
      )}
    </div>
  )
}
