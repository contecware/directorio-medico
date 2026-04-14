import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import './Admin.css'  // Asegúrate de que esta ruta sea correcta

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
    <div className="page">
      <div className="admin-container">
        
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-icon">🏥</div>
            <div className="sidebar-brand">
              <h1>MediAdmin</h1>
              <span>Panel de Control</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            <div className="nav-section">Principal</div>
            
            <button className="nav-btn active">
              <span>👨‍⚕️</span> Directorio Médico
            </button>
            
            <button className="nav-btn" onClick={()=>navigate('/')}>
              <span>🌐</span> Ver Sitio Público
            </button>

            <div className="nav-section">Acciones Rápidas</div>
            
            <button className="nav-btn primary" onClick={openAdd}>
              <span>➕</span> Nuevo Médico
            </button>
          </nav>

          <div className="sidebar-footer">
            <div className="user-info">
              <div className="user-avatar">👤</div>
              <div className="user-details">
                <h4>Administrador</h4>
                <span>Admin</span>
              </div>
            </div>
            <button className="logout-btn" onClick={logout}>
              Cerrar Sesión
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="main-content">
          
          {/* HEADER */}
          <div className="content-header">
            <div>
              <h1>Directorio Médico</h1>
              <p className="subtitle">Gestiona los médicos, consultorios y especialidades del directorio</p>
            </div>
            <div className="header-stats">
              <div className="stat-pill">{rows.length} médicos registrados</div>
              <div className="stat-pill active">{rows.filter(r=>r.activo).length} activos</div>
            </div>
          </div>

          {/* TOOLBAR */}
          <div className="toolbar">
            <div className="search-container">
              <span className="search-icon">🔍</span>
              <input 
                className="search-input"
                placeholder="Buscar por nombre, especialidad, consultorio..." 
                value={q} 
                onChange={e=>setQ(e.target.value)}
              />
              {q && (
                <button className="search-clear" onClick={()=>setQ('')}>✕</button>
              )}
            </div>
            
            <button className="add-btn" onClick={openAdd}>
              <span>+</span> Agregar Médico
            </button>
          </div>

          {/* STATS CARDS */}
          <div className="stats-grid">
            {ESPECIALIDADES.slice(0,4).map((esp,idx)=>{
              const count = rows.filter(r=>r.especialidad===esp).length
              return (
                <div key={esp} className="stat-card">
                  <div className="stat-label">{esp}</div>
                  <div className="stat-value">{count}</div>
                </div>
              )
            })}
          </div>

          {/* TABLE */}
          <div className="table-container">
            {loading ? (
              <div style={{padding: '40px'}}>
                {[...Array(6)].map((_,i)=><div key={i} className="skeleton"/>)}
              </div>
            ) : filtered.length===0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>{q?'No se encontraron resultados':'No hay médicos registrados'}</h3>
                <p>{q?'Intenta con otra búsqueda':'Comienza agregando el primer médico al directorio'}</p>
                {!q && <button className="add-btn" onClick={openAdd}>+ Agregar Médico</button>}
              </div>
            ) : (
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Doctor</th>
                      <th>Especialidad</th>
                      <th>Ubicación</th>
                      <th>Contacto</th>
                      <th>Horario</th>
                      <th className="text-center">Estado</th>
                      <th className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r,idx)=>(
                      <tr key={r.id}>
                        <td>
                          <div className="doctor-cell">
                            <div className="doctor-avatar">{initials(r.nombre_doctor)}</div>
                            <div className="doctor-info">
                              <h4>{r.nombre_doctor}</h4>
                              <span>{r.nombre_clinica}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="esp-tag">{r.especialidad}</span>
                        </td>
                        <td>
                          <div className="location-cell">
                            Consultorio {r.numero_consultorio}
                            <span>{r.piso_nivel}</span>
                          </div>
                        </td>
                        <td>
                          <div className="contact-cell">
                            {r.telefono && <div>📞 {r.telefono}{r.extension && ` ext. ${r.extension}`}</div>}
                            {r.whatsapp && <div className="whatsapp">💬 {r.whatsapp}</div>}
                            {r.email && <div className="email">✉ {r.email}</div>}
                          </div>
                        </td>
                        <td>
                          <div className="schedule-cell">{r.horario_texto || '—'}</div>
                        </td>
                        <td className="text-center">
                          <button 
                            onClick={()=>toggleActivo(r)}
                            className={`status-pill ${r.activo?'active':'inactive'}`}
                          >
                            <span className="status-dot"></span>
                            {r.activo?'Activo':'Inactivo'}
                          </button>
                        </td>
                        <td>
                          <div className="action-btns">
                            <button className="edit-btn" onClick={()=>openEdit(r)}>✏ Editar</button>
                            <button className="del-btn" onClick={()=>setDelId(r.id)}>🗑</button>
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
          <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&closeModal()}>
            <div className="modal">
              <div className="modal-header">
                <div className="modal-title">
                  <h2>{modal==='edit'?'✏ Editar médico':'+ Agregar nuevo médico'}</h2>
                  <p>Completa la información del profesional de la salud</p>
                </div>
                <button className="modal-close" onClick={closeModal}>✕</button>
              </div>
              
              <form onSubmit={save} className="modal-body">
                <div className="form-grid">
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
                
                <div className="form-field full-width" style={{marginTop: '20px'}}>
                  <label className="field-label">Horario de Atención</label>
                  <input 
                    className="field-input"
                    name="horario_texto" 
                    value={form.horario_texto} 
                    onChange={hc} 
                    placeholder="Lunes a Viernes: 8:00 AM - 2:00 PM"
                  />
                </div>
                
                <div className="form-field full-width" style={{marginTop: '20px'}}>
                  <label className="field-label">Servicios (separados por coma)</label>
                  <input 
                    className="field-input"
                    name="servicios" 
                    value={form.servicios} 
                    onChange={hc} 
                    placeholder="Consulta general, Ecocardiograma, Electrocardiograma"
                  />
                </div>

                <div className="form-field full-width" style={{marginTop: '20px'}}>
                  <label className="field-label">URL Foto del Doctor</label>
                  <input 
                    className="field-input"
                    name="foto_url" 
                    value={form.foto_url} 
                    onChange={hc} 
                    placeholder="https://ejemplo.com/foto.jpg"
                  />
                </div>

                <div className="checkbox-container">
                  <label className="checkbox-field">
                    <input 
                      type="checkbox" 
                      name="activo" 
                      checked={form.activo} 
                      onChange={hc}
                    />
                    <div className="checkbox-label">
                      <strong>Consultorio activo</strong>
                      <span>El médico será visible en el directorio público</span>
                    </div>
                  </label>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-cancel" onClick={closeModal}>Cancelar</button>
                  <button type="submit" className="btn-save" disabled={saving}>
                    {saving?'⏳ Guardando...':'💾 Guardar Registro'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CONFIRM DELETE */}
        {delId && (
          <div className="modal-overlay">
            <div className="confirm-box">
              <div className="confirm-icon">⚠️</div>
              <h3>¿Eliminar registro?</h3>
              <p>Esta acción eliminará permanentemente al médico del directorio. No se puede deshacer.</p>
              <div className="confirm-actions">
                <button className="btn-cancel" onClick={()=>setDelId(null)}>Cancelar</button>
                <button className="btn-delete" onClick={()=>del(delId)}>Sí, eliminar</button>
              </div>
            </div>
          </div>
        )}

        {/* TOAST */}
        {toast && (
          <div className={`toast ${toast.type==='err'?'error':'success'}`}>
            <span>{toast.type==='err'?'❌':'✅'}</span>
            {toast.msg}
          </div>
        )}
      </div>
    </div>
  )
}

function FormField({label,name,val,hc,ph,type='text',opts}){
  return (
    <div className="form-field">
      <label className="field-label">{label}</label>
      {type==='select'
        ? <select className="field-select" name={name} value={val} onChange={hc}>
            <option value="">Seleccionar...</option>
            {opts.map(o=><option key={o} value={o}>{o}</option>)}
          </select>
        : <input 
            className="field-input"
            name={name} 
            type={type} 
            value={val} 
            onChange={hc} 
            placeholder={ph}
          />
      }
    </div>
  )
}