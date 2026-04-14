import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

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
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#f1f5f9',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      margin: 0,
      padding: 0,
      boxSizing: 'border-box'
    }}>
      
      {/* SIDEBAR */}
      <aside style={{
        width: '280px',
        minWidth: '280px',
        backgroundColor: '#1e293b',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        left: 0,
        top: 0,
        overflowY: 'auto',
        zIndex: 50,
        boxShadow: '4px 0 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <div style={{
              width: '44px', 
              height: '44px', 
              background: 'linear-gradient(135deg,#0ea5e9,#2563eb)', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '24px'
            }}>🏥</div>
            <div>
              <div style={{fontSize: '18px', fontWeight: 800, color: '#ffffff'}}>MediAdmin</div>
              <div style={{fontSize: '12px', color: '#94a3b8'}}>Panel de Control</div>
            </div>
          </div>
        </div>

        <nav style={{flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '8px'}}>
          <div style={{fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', padding: '0 12px', marginBottom: '8px'}}>Principal</div>
          
          <button style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: 'rgba(255,255,255,0.1)',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textAlign: 'left'
          }}>
            <span>👨‍⚕️</span> Directorio Médico
          </button>
          
          <button onClick={()=>navigate('/')} style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: 'transparent',
            color: '#94a3b8',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textAlign: 'left',
            transition: 'all 0.2s'
          }}>
            <span>🌐</span> Ver Sitio Público
          </button>

          <div style={{fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', padding: '20px 12px 8px'}}>Acciones Rápidas</div>
          
          <button onClick={openAdd} style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: '#0ea5e9',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textAlign: 'left',
            boxShadow: '0 4px 6px -1px rgba(14,165,233,0.3)'
          }}>
            <span>➕</span> Nuevo Médico
          </button>
        </nav>

        <div style={{padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px'}}>
            <div style={{width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'}}>👤</div>
            <div style={{flex: 1}}>
              <div style={{fontSize: '13px', fontWeight: 600, color: '#ffffff'}}>Administrador</div>
              <div style={{fontSize: '11px', color: '#94a3b8'}}>Admin</div>
            </div>
          </div>
          <button onClick={logout} style={{
            width: '100%',
            padding: '10px',
            backgroundColor: 'rgba(239,68,68,0.2)',
            color: '#fca5a5',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{
        flex: 1,
        marginLeft: '280px',
        padding: '32px',
        minWidth: 0,
        width: 'calc(100% - 280px)'
      }}>
        
        {/* HEADER */}
        <div style={{marginBottom: '32px'}}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px'}}>
            <h1 style={{fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px'}}>Directorio Médico</h1>
            <div style={{display: 'flex', gap: '12px'}}>
              <div style={{backgroundColor: '#ffffff', padding: '8px 16px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', fontSize: '14px', fontWeight: 600, color: '#475569'}}>
                {rows.length} médicos registrados
              </div>
              <div style={{backgroundColor: '#ffffff', padding: '8px 16px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', fontSize: '14px', fontWeight: 600, color: '#059669'}}>
                {rows.filter(r=>r.activo).length} activos
              </div>
            </div>
          </div>
          <p style={{color: '#64748b', fontSize: '16px', margin: 0}}>Gestiona los médicos, consultorios y especialidades del directorio</p>
        </div>

        {/* TOOLBAR */}
        <div style={{
          backgroundColor: '#ffffff',
          padding: '20px',
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{flex: 1, position: 'relative', maxWidth: '600px'}}>
            <span style={{position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: '#94a3b8'}}>🔍</span>
            <input 
              placeholder="Buscar por nombre, especialidad, consultorio..." 
              value={q} 
              onChange={e=>setQ(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 48px',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '15px',
                outline: 'none',
                backgroundColor: '#ffffff',
                color: '#1e293b',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
            />
            {q && (
              <button onClick={()=>setQ('')} style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '18px'
              }}>✕</button>
            )}
          </div>
          
          <button onClick={openAdd} style={{
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(37,99,235,0.3)',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}>
            <span style={{fontSize: '20px'}}>+</span> Agregar Médico
          </button>
        </div>

        {/* STATS CARDS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {ESPECIALIDADES.slice(0,4).map((esp,idx)=>{
            const count = rows.filter(r=>r.especialidad===esp).length
            const colors = ['#3b82f6','#8b5cf6','#10b981','#f59e0b']
            return (
              <div key={esp} style={{
                backgroundColor: '#ffffff',
                padding: '24px',
                borderRadius: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                borderLeft: `4px solid ${colors[idx]}`
              }}>
                <div style={{fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px'}}>{esp}</div>
                <div style={{fontSize: '32px', fontWeight: 800, color: '#0f172a', marginTop: '8px'}}>{count}</div>
              </div>
            )
          })}
        </div>

        {/* TABLE CONTAINER */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          {loading ? (
            <div style={{padding: '40px'}}>
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                {[...Array(6)].map((_,i)=><div key={i} style={{
                  height: '64px', 
                  backgroundColor: '#f1f5f9', 
                  borderRadius: '8px',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}/>)}
              </div>
            </div>
          ) : filtered.length===0 ? (
            <div style={{padding: '80px 20px', textAlign: 'center'}}>
              <div style={{fontSize: '64px', marginBottom: '16px'}}>📋</div>
              <h3 style={{fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px'}}>{q?'No se encontraron resultados':'No hay médicos registrados'}</h3>
              <p style={{color: '#64748b', marginBottom: '24px'}}>{q?'Intenta con otra búsqueda':'Comienza agregando el primer médico al directorio'}</p>
              {!q && <button onClick={openAdd} style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer'
              }}>+ Agregar Médico</button>}
            </div>
          ) : (
            <div style={{overflowX: 'auto', width: '100%'}}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '14px',
                minWidth: '1200px'
              }}>
                <thead>
                  <tr style={{backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0'}}>
                    <th style={{padding: '16px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', width: '25%'}}>Doctor</th>
                    <th style={{padding: '16px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', width: '15%'}}>Especialidad</th>
                    <th style={{padding: '16px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', width: '15%'}}>Ubicación</th>
                    <th style={{padding: '16px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', width: '20%'}}>Contacto</th>
                    <th style={{padding: '16px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', width: '15%'}}>Horario</th>
                    <th style={{padding: '16px 20px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', width: '10%'}}>Estado</th>
                    <th style={{padding: '16px 20px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', width: '10%'}}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r,idx)=>(
                    <tr key={r.id} style={{
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: idx%2===0 ? '#ffffff' : '#fafafa',
                      transition: 'background-color 0.15s'
                    }}>
                      <td style={{padding: '20px'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                          <div style={{
                            width: '48px', 
                            height: '48px', 
                            borderRadius: '12px', 
                            background: 'linear-gradient(135deg,#1e40af,#3b82f6)', 
                            color: '#ffffff', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontSize: '16px', 
                            fontWeight: 700, 
                            flexShrink: 0
                          }}>
                            {initials(r.nombre_doctor)}
                          </div>
                          <div>
                            <div style={{fontWeight: 700, color: '#0f172a', fontSize: '15px', marginBottom: '2px'}}>{r.nombre_doctor}</div>
                            <div style={{fontSize: '13px', color: '#64748b'}}>{r.nombre_clinica}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{padding: '20px'}}>
                        <span style={{
                          backgroundColor: '#dbeafe', 
                          color: '#1e40af', 
                          padding: '6px 14px', 
                          borderRadius: '20px', 
                          fontSize: '12px', 
                          fontWeight: 700,
                          display: 'inline-block'
                        }}>
                          {r.especialidad}
                        </span>
                      </td>
                      <td style={{padding: '20px'}}>
                        <div style={{fontWeight: 600, color: '#374151'}}>Consultorio {r.numero_consultorio}</div>
                        <div style={{fontSize: '13px', color: '#6b7280'}}>{r.piso_nivel}</div>
                      </td>
                      <td style={{padding: '20px'}}>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                          {r.telefono && <div style={{fontSize: '13px', color: '#374151'}}>📞 {r.telefono}{r.extension && ` ext. ${r.extension}`}</div>}
                          {r.whatsapp && <div style={{fontSize: '13px', color: '#059669'}}>💬 {r.whatsapp}</div>}
                          {r.email && <div style={{fontSize: '12px', color: '#6b7280'}}>✉ {r.email}</div>}
                        </div>
                      </td>
                      <td style={{padding: '20px'}}>
                        <div style={{fontSize: '13px', color: '#374151', lineHeight: 1.4, maxWidth: '200px'}}>{r.horario_texto || '—'}</div>
                      </td>
                      <td style={{padding: '20px', textAlign: 'center'}}>
                        <button 
                          onClick={()=>toggleActivo(r)}
                          style={{
                            backgroundColor: r.activo ? '#d1fae5' : '#fee2e2',
                            color: r.activo ? '#065f46' : '#991b1b',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s'
                          }}
                        >
                          <span style={{
                            width: '6px', 
                            height: '6px', 
                            borderRadius: '50%', 
                            backgroundColor: r.activo ? '#059669' : '#dc2626'
                          }}></span>
                          {r.activo ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td style={{padding: '20px', textAlign: 'center'}}>
                        <div style={{display: 'flex', gap: '8px', justifyContent: 'center'}}>
                          <button onClick={()=>openEdit(r)} style={{
                            backgroundColor: '#eff6ff',
                            color: '#2563eb',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}>✏ Editar</button>
                          <button onClick={()=>setDelId(r.id)} style={{
                            backgroundColor: '#fef2f2',
                            color: '#dc2626',
                            border: 'none',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}>🗑</button>
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
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15,23,42,0.6)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          backdropFilter: 'blur(4px)'
        }} onClick={e=>e.target===e.currentTarget&&closeModal()}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '1000px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{
              padding: '24px 32px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'sticky',
              top: 0,
              backgroundColor: '#ffffff',
              zIndex: 1
            }}>
              <div>
                <h2 style={{fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0}}>{modal==='edit'?'✏ Editar médico':'+ Agregar nuevo médico'}</h2>
                <p style={{color: '#64748b', fontSize: '14px', margin: '4px 0 0 0'}}>Completa la información del profesional de la salud</p>
              </div>
              <button onClick={closeModal} style={{
                backgroundColor: '#f1f5f9',
                border: 'none',
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                transition: 'all 0.2s'
              }}>✕</button>
            </div>
            
            <form onSubmit={save} style={{padding: '32px'}}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px'
              }}>
                <Field label="Nombre del Doctor *" name="nombre_doctor" val={form.nombre_doctor} hc={hc} ph="Dr. Juan Pérez García" />
                <Field label="Especialidad *" name="especialidad" val={form.especialidad} hc={hc} type="select" opts={ESPECIALIDADES} />
                <Field label="Nombre de la Clínica" name="nombre_clinica" val={form.nombre_clinica} hc={hc} ph="Centro Médico del Valle" />
                
                <Field label="Piso / Nivel" name="piso_nivel" val={form.piso_nivel} hc={hc} ph="Nivel 2 - Torre A" />
                <Field label="N° Consultorio" name="numero_consultorio" val={form.numero_consultorio} hc={hc} ph="205-B" />
                <Field label="Teléfono" name="telefono" val={form.telefono} hc={hc} ph="2456-1234" />
                
                <Field label="Extensión" name="extension" val={form.extension} hc={hc} ph="102" />
                <Field label="WhatsApp" name="whatsapp" val={form.whatsapp} hc={hc} ph="+502 2456-1234" />
                <Field label="Email" name="email" val={form.email} hc={hc} type="email" ph="doctor@clinica.com" />
              </div>
              
              <div style={{marginTop: '20px'}}>
                <Field label="Horario de Atención" name="horario_texto" val={form.horario_texto} hc={hc} ph="Lunes a Viernes: 8:00 AM - 2:00 PM" />
              </div>
              
              <div style={{marginTop: '20px'}}>
                <Field label="Servicios (separados por coma)" name="servicios" val={form.servicios} hc={hc} ph="Consulta general, Ecocardiograma, Electrocardiograma" />
              </div>

              <div style={{marginTop: '20px'}}>
                <Field label="URL Foto del Doctor" name="foto_url" val={form.foto_url} hc={hc} ph="https://ejemplo.com/foto.jpg" />
              </div>

              <div style={{
                marginTop: '24px',
                padding: '20px',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <label style={{display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer'}}>
                  <input 
                    type="checkbox" 
                    name="activo" 
                    checked={form.activo} 
                    onChange={hc} 
                    style={{width: '20px', height: '20px', accentColor: '#2563eb'}}
                  />
                  <div>
                    <div style={{fontSize: '15px', fontWeight: 700, color: '#0f172a'}}>Consultorio activo</div>
                    <div style={{fontSize: '13px', color: '#64748b'}}>El médico será visible en el directorio público</div>
                  </div>
                </label>
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                marginTop: '24px',
                paddingTop: '24px',
                borderTop: '1px solid #e2e8f0'
              }}>
                <button type="button" onClick={closeModal} style={{
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 32px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1,
                  boxShadow: '0 4px 6px -1px rgba(37,99,235,0.3)',
                  transition: 'all 0.2s'
                }}>
                  {saving?'⏳ Guardando...':'💾 Guardar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE */}
      {delId && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15,23,42,0.6)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '48px',
            textAlign: 'center',
            maxWidth: '420px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#fef2f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '40px'
            }}>⚠️</div>
            <h3 style={{fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '12px'}}>¿Eliminar registro?</h3>
            <p style={{color: '#64748b', fontSize: '16px', lineHeight: 1.5, marginBottom: '32px'}}>Esta acción eliminará permanentemente al médico del directorio. No se puede deshacer.</p>
            <div style={{display: 'flex', gap: '12px', justifyContent: 'center'}}>
              <button onClick={()=>setDelId(null)} style={{
                backgroundColor: '#f1f5f9',
                color: '#475569',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer'
              }}>Cancelar</button>
              <button onClick={()=>del(delId)} style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(220,38,38,0.3)'
              }}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          padding: '16px 24px',
          borderRadius: '12px',
          fontSize: '15px',
          fontWeight: 600,
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
          zIndex: 200,
          backgroundColor: toast.type==='err' ? '#fef2f2' : '#f0fdf4',
          color: toast.type==='err' ? '#991b1b' : '#166534',
          border: `1px solid ${toast.type==='err' ? '#fecaca' : '#bbf7d0'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{fontSize: '20px'}}>{toast.type==='err'?'❌':'✅'}</span>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

function Field({label,name,val,hc,ph,type='text',opts}){
  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '15px',
    outline: 'none',
    backgroundColor: '#ffffff',
    color: '#111827',
    transition: 'all 0.2s',
    boxSizing: 'border-box'
  }

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
      <label style={{fontSize: '12px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px'}}>{label}</label>
      {type==='select'
        ? <select name={name} value={val} onChange={hc} style={{...inputStyle, cursor: 'pointer'}}>
            <option value="">Seleccionar...</option>
            {opts.map(o=><option key={o} value={o}>{o}</option>)}
          </select>
        : <input 
            name={name} 
            type={type} 
            value={val} 
            onChange={hc} 
            placeholder={ph} 
            style={inputStyle}
          />
      }
    </div>
  )
}