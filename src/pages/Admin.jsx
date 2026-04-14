import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import styles from './Admin.module.css'  

const ESPECIALIDADES = [
  'Cardiología','Pediatría','Ortopedia','Dermatología','Neurología',
  'Ginecología','Oftalmología','Psiquiatría','Urología','Endocrinología',
  'Gastroenterología','Odontología','Oncología','Reumatología','Medicina General',
]
const EMPTY = {
  nombre_doctor:'',especialidad:'',nombre_clinica:'',piso_nivel:'',
  numero_consultorio:'',telefono:'',extension:'',whatsapp:'',
  email:'',horario_texto:'',servicios:'',foto_url:'',activo:true
}

function initials(name=''){
  return name.split(' ').filter(w=>/^[A-ZÁÉÍÓÚ]/i.test(w)).slice(0,2).map(w=>w[0].toUpperCase()).join('')
}

export default function Admin(){
  const navigate = useNavigate()
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [q,       setQ]       = useState('')
  const [modal,   setModal]   = useState(false)
  const [form,    setForm]    = useState(EMPTY)
  const [editId,  setEditId]  = useState(null)
  const [saving,  setSaving]  = useState(false)
  const [delId,   setDelId]   = useState(null)
  const [toast,   setToast]   = useState(null)

  const toast$ = (msg,type='ok') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000) }

  const load = useCallback(async()=>{
    setLoading(true)
    const {data} = await supabase.from('clinicas').select('*').order('nombre_doctor')
    setRows(data||[])
    setLoading(false)
  },[])

  useEffect(()=>{load()},[load])

  function logout(){ sessionStorage.removeItem('dm_admin'); navigate('/login') }

  function openAdd(){ setForm(EMPTY); setEditId(null); setModal('add') }
  function openEdit(r){
    setForm({
      nombre_doctor:r.nombre_doctor||'', especialidad:r.especialidad||'',
      nombre_clinica:r.nombre_clinica||'', piso_nivel:r.piso_nivel||'',
      numero_consultorio:r.numero_consultorio||'', telefono:r.telefono||'',
      extension:r.extension||'', whatsapp:r.whatsapp||'',
      email:r.email||'', horario_texto:r.horario_texto||'',
      servicios:r.servicios||'', foto_url:r.foto_url||'', activo:r.activo??true
    })
    setEditId(r.id); setModal('edit')
  }
  function closeModal(){ setModal(false); setEditId(null) }
  function hc(e){ const{name,value,type,checked}=e.target; setForm(f=>({...f,[name]:type==='checkbox'?checked:value})) }

  async function save(e){
    e.preventDefault()
    if(!form.nombre_doctor.trim()){toast$('El nombre del doctor es requerido','err');return}
    setSaving(true)
    const {error} = modal==='edit'
      ? await supabase.from('clinicas').update(form).eq('id',editId)
      : await supabase.from('clinicas').insert([form])
    if(error) toast$(error.message,'err')
    else { toast$(modal==='edit'?'Registro actualizado ✓':'Médico agregado ✓'); closeModal(); load() }
    setSaving(false)
  }

  async function del(id){
    const {error} = await supabase.from('clinicas').delete().eq('id',id)
    setDelId(null)
    if(error) toast$(error.message,'err')
    else { toast$('Registro eliminado'); load() }
  }

  async function toggleActivo(r){
    await supabase.from('clinicas').update({activo:!r.activo}).eq('id',r.id)
    load()
  }

  const filtered = rows.filter(r=>!q||[r.nombre_doctor,r.especialidad,r.nombre_clinica,r.numero_consultorio].some(v=>v?.toLowerCase().includes(q.toLowerCase())))

  return (
    <div className={styles.page}>
      <div className={styles.adminContainer}>
        
        {/* SIDEBAR */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <div className={styles.sidebarIcon}>🏥</div>
            <div className={styles.sidebarBrand}>
              <h1>MediAdmin</h1>
              <span>Panel de Control</span>
            </div>
          </div>

          <nav className={styles.sidebarNav}>
            <div className={styles.navSection}>Principal</div>
            
            <button className={`${styles.navBtn} ${styles.active}`}>
              <span>👨‍⚕️</span> Directorio Médico
            </button>
            
            <button className={styles.navBtn} onClick={()=>navigate('/')}>
              <span>🌐</span> Ver Sitio Público
            </button>

            <div className={styles.navSection}>Acciones Rápidas</div>
            
            <button className={`${styles.navBtn} ${styles.primary}`} onClick={openAdd}>
              <span>➕</span> Nuevo Médico
            </button>
          </nav>

          <div className={styles.sidebarFooter}>
            <div className={styles.userInfo}>
              <div className={styles.userAvatar}>👤</div>
              <div className={styles.userDetails}>
                <h4>Administrador</h4>
                <span>Admin</span>
              </div>
            </div>
            <button className={styles.logoutBtn} onClick={logout}>
              Cerrar Sesión
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className={styles.mainContent}>
          
          {/* HEADER */}
          <div className={styles.contentHeader}>
            <div>
              <h1 className={styles.title}>Directorio Médico</h1>
              <p className={styles.subtitle}>Gestiona los médicos, consultorios y especialidades del directorio</p>
            </div>
            <div className={styles.headerStats}>
              <div className={styles.statPill}>{rows.length} médicos registrados</div>
              <div className={`${styles.statPill} ${styles.active}`}>{rows.filter(r=>r.activo).length} activos</div>
            </div>
          </div>

          {/* TOOLBAR */}
          <div className={styles.toolbar}>
            <div className={styles.searchContainer}>
              <span className={styles.searchIcon}>🔍</span>
              <input 
                className={styles.searchInput}
                placeholder="Buscar por nombre, especialidad, consultorio..." 
                value={q} 
                onChange={e=>setQ(e.target.value)}
              />
              {q && (
                <button className={styles.searchClear} onClick={()=>setQ('')}>✕</button>
              )}
            </div>
            
            <button className={styles.addBtn} onClick={openAdd}>
              <span>+</span> Agregar Médico
            </button>
          </div>

          {/* STATS CARDS */}
          <div className={styles.statsGrid}>
            {ESPECIALIDADES.slice(0,4).map((esp,idx)=>{
              const count = rows.filter(r=>r.especialidad===esp).length
              return (
                <div key={esp} className={styles.statCard}>
                  <div className={styles.statLabel}>{esp}</div>
                  <div className={styles.statValue}>{count}</div>
                </div>
              )
            })}
          </div>

          {/* TABLE */}
          <div className={styles.tableContainer}>
            {loading ? (
              <div style={{padding: '40px'}}>
                {[...Array(6)].map((_,i)=><div key={i} className={styles.skeleton}/>)}
              </div>
            ) : filtered.length===0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📋</div>
                <h3>{q?'No se encontraron resultados':'No hay médicos registrados'}</h3>
                <p>{q?'Intenta con otra búsqueda':'Comienza agregando el primer médico al directorio'}</p>
                {!q && <button className={styles.addBtn} onClick={openAdd}>+ Agregar Médico</button>}
              </div>
            ) : (
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Doctor</th>
                      <th>Especialidad</th>
                      <th>Ubicación</th>
                      <th>Contacto</th>
                      <th>Horario</th>
                      <th className={styles.textCenter}>Estado</th>
                      <th className={styles.textCenter}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r,idx)=>(
                      <tr key={r.id}>
                        <td>
                          <div className={styles.doctorCell}>
                            <div className={styles.doctorAvatar}>{initials(r.nombre_doctor)}</div>
                            <div className={styles.doctorInfo}>
                              <h4>{r.nombre_doctor}</h4>
                              <span>{r.nombre_clinica}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={styles.espTag}>{r.especialidad}</span>
                        </td>
                        <td>
                          <div className={styles.locationCell}>
                            Consultorio {r.numero_consultorio}
                            <span>{r.piso_nivel}</span>
                          </div>
                        </td>
                        <td>
                          <div className={styles.contactCell}>
                            {r.telefono && <div>📞 {r.telefono}{r.extension && ` ext. ${r.extension}`}</div>}
                            {r.whatsapp && <div className={styles.whatsapp}>💬 {r.whatsapp}</div>}
                            {r.email && <div className={styles.email}>✉ {r.email}</div>}
                          </div>
                        </td>
                        <td>
                          <div className={styles.scheduleCell}>{r.horario_texto || '—'}</div>
                        </td>
                        <td className={styles.textCenter}>
                          <button 
                            onClick={()=>toggleActivo(r)}
                            className={`${styles.statusPill} ${r.activo ? styles.active : styles.inactive}`}
                          >
                            <span className={styles.statusDot}></span>
                            {r.activo?'Activo':'Inactivo'}
                          </button>
                        </td>
                        <td>
                          <div className={styles.actionBtns}>
                            <button className={styles.editBtn} onClick={()=>openEdit(r)}>✏ Editar</button>
                            <button className={styles.delBtn} onClick={()=>setDelId(r.id)}>🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

        {/* MODAL */}
        {modal && (
          <div className={styles.modalOverlay} onClick={e=>e.target===e.currentTarget&&closeModal()}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <div className={styles.modalTitle}>
                  <h2>{modal==='edit'?'✏ Editar médico':'+ Agregar nuevo médico'}</h2>
                  <p>Completa la información del profesional de la salud</p>
                </div>
                <button className={styles.modalClose} onClick={closeModal}>✕</button>
              </div>
              
              <form onSubmit={save} className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <FormField label="Nombre del Doctor *" name="nombre_doctor" val={form.nombre_doctor} hc={hc} ph="Dr. Juan Pérez García" />
                  <FormField label="Especialidad *" name="especialidad" val={form.especialidad} hc={hc} type="select" opts={ESPECIALIDADES} />
                  <FormField label="Nombre de la Clínica" name="nombre_clinica" val={form.nombre_clinica} hc={hc} ph="Centro Médico del Valle" />
                  
                  <FormField label="Piso / Nivel" name="piso_nivel" val={form.piso_nivel} hc={hc} ph="Nivel 2 - Torre A" />
                  <FormField label="N° Consultorio" name="numero_consultorio" val={form.numero_consultorio} hc={hc} ph="205-B" />
                  <FormField label="Teléfono" name="telefono" val={form.telefono} hc={hc} ph="2456-1234" />
                  
                  <FormField label="Extensión" name="extension" val={form.extension} hc={hc} ph="102" />
                  <FormField label="WhatsApp" name="whatsapp" val={form.whatsapp} hc={hc} ph="+502 2456-1234" />
                  <FormField label="Email" name="email" val={form.email} hc={hc} type="email" ph="doctor@clinica.com" />
                </div>
                
                <div className={`${styles.formField} ${styles.fullWidth}`} style={{marginTop: '20px'}}>
                  <label className={styles.fieldLabel}>Horario de Atención</label>
                  <input 
                    className={styles.fieldInput}
                    name="horario_texto" 
                    value={form.horario_texto} 
                    onChange={hc} 
                    placeholder="Lunes a Viernes: 8:00 AM - 2:00 PM"
                  />
                </div>
                
                <div className={`${styles.formField} ${styles.fullWidth}`} style={{marginTop: '20px'}}>
                  <label className={styles.fieldLabel}>Servicios (separados por coma)</label>
                  <input 
                    className={styles.fieldInput}
                    name="servicios" 
                    value={form.servicios} 
                    onChange={hc} 
                    placeholder="Consulta general, Ecocardiograma, Electrocardiograma"
                  />
                </div>

                <div className={`${styles.formField} ${styles.fullWidth}`} style={{marginTop: '20px'}}>
                  <label className={styles.fieldLabel}>URL Foto del Doctor</label>
                  <input 
                    className={styles.fieldInput}
                    name="foto_url" 
                    value={form.foto_url} 
                    onChange={hc} 
                    placeholder="https://ejemplo.com/foto.jpg"
                  />
                </div>

                <div className={styles.checkboxContainer}>
                  <label className={styles.checkboxField}>
                    <input 
                      type="checkbox" 
                      name="activo" 
                      checked={form.activo} 
                      onChange={hc}
                    />
                    <div className={styles.checkboxLabel}>
                      <strong>Consultorio activo</strong>
                      <span>El médico será visible en el directorio público</span>
                    </div>
                  </label>
                </div>

                <div className={styles.modalFooter}>
                  <button type="button" className={styles.btnCancel} onClick={closeModal}>Cancelar</button>
                  <button type="submit" className={styles.btnSave} disabled={saving}>
                    {saving?'⏳ Guardando...':'💾 Guardar Registro'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CONFIRM DELETE */}
        {delId && (
          <div className={styles.modalOverlay}>
            <div className={styles.confirmBox}>
              <div className={styles.confirmIcon}>⚠️</div>
              <h3>¿Eliminar registro?</h3>
              <p>Esta acción eliminará permanentemente al médico del directorio. No se puede deshacer.</p>
              <div className={styles.confirmActions}>
                <button className={styles.btnCancel} onClick={()=>setDelId(null)}>Cancelar</button>
                <button className={styles.btnDelete} onClick={()=>del(delId)}>Sí, eliminar</button>
              </div>
            </div>
          </div>
        )}

        {/* TOAST */}
        {toast && (
          <div className={`${styles.toast} ${toast.type==='err' ? styles.error : styles.success}`}>
            <span>{toast.type==='err'?'❌':'✅'}</span>
            {toast.msg}
          </div>
        )}
      </div>
    </div>
  )
}

function FormField({label,name,val,hc,ph,type='text',opts}){
  const styles = {
    formField: 'formField',
    fieldLabel: 'fieldLabel',
    fieldInput: 'fieldInput',
    fieldSelect: 'fieldSelect'
  }
  
  // Obtener estilos del módulo padre mediante una pequeña trampa
  // o pasarlos como prop. Por simplicidad, usaré estilos inline aquí
  // o podemos definirlo dentro del componente principal
  
  return (
    <div className="formField" style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
      <label style={{fontSize: '12px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
        {label}
      </label>
      {type==='select'
        ? <select 
            name={name} 
            value={val} 
            onChange={hc}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '10px',
              fontSize: '15px',
              outline: 'none',
              background: '#ffffff',
              color: '#111827',
              cursor: 'pointer'
            }}
          >
            <option value="">Seleccionar...</option>
            {opts.map(o=><option key={o} value={o}>{o}</option>)}
          </select>
        : <input 
            name={name} 
            type={type} 
            value={val} 
            onChange={hc} 
            placeholder={ph}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '10px',
              fontSize: '15px',
              outline: 'none',
              background: '#ffffff',
              color: '#111827'
            }}
          />
      }
    </div>
  )
}