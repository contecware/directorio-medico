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
  const [modal,   setModal]   = useState(false)  // false | 'add' | 'edit'
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
    <div style={{minHeight:'100vh',background:'#f0f4f8'}}>

      {/* HEADER */}
      <header style={S.header}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div style={S.hIcon}>🏥</div>
          <div>
            <div style={{color:'#fff',fontSize:16,fontWeight:700}}>Panel de Administración</div>
            <div style={{color:'rgba(255,255,255,0.5)',fontSize:11}}>Directorio Médico</div>
          </div>
          <span style={S.adminTag}>ADMIN</span>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button style={S.hBtn} onClick={()=>navigate('/')}>👁 Ver directorio</button>
          <button style={{...S.hBtn,background:'rgba(239,68,68,0.15)',border:'1px solid rgba(239,68,68,0.3)',color:'#fca5a5'}} onClick={logout}>Cerrar sesión</button>
        </div>
      </header>

      {/* TOOLBAR */}
      <div style={S.toolbar}>
        <div style={{display:'flex',alignItems:'center',gap:14,flex:1}}>
          <div style={S.searchBox}>
            <span>🔍</span>
            <input placeholder="Buscar doctor, especialidad, consultorio..." value={q} onChange={e=>setQ(e.target.value)}
              style={{border:'none',background:'none',outline:'none',fontSize:14,flex:1}} />
            {q && <button onClick={()=>setQ('')} style={{background:'none',border:'none',color:'#9ca3af',fontSize:13}}>✕</button>}
          </div>
          <span style={{fontSize:13,color:'#6b7280',whiteSpace:'nowrap'}}>{filtered.length} registros</span>
        </div>
        <button style={S.addBtn} onClick={openAdd}>+ Agregar médico</button>
      </div>

      {/* TABLE */}
      <div style={{padding:'20px 24px',overflowX:'auto'}}>
        {loading ? (
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {[...Array(5)].map((_,i)=><div key={i} className="sk" style={{height:54,borderRadius:8}}/>)}
          </div>
        ) : filtered.length===0 ? (
          <div style={{background:'#fff',borderRadius:16,padding:'64px 20px',textAlign:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.07)'}}>
            <div style={{fontSize:48,marginBottom:12}}>📋</div>
            <div style={{fontWeight:700,color:'#111827'}}>
              {q?'Sin resultados para tu búsqueda':'No hay registros aún'}
            </div>
            {!q && <button style={S.addBtn} onClick={openAdd}>+ Agregar primer médico</button>}
          </div>
        ) : (
          <table style={{width:'100%',borderCollapse:'collapse',background:'#fff',borderRadius:16,overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,0.07)',minWidth:780}}>
            <thead>
              <tr>
                {['Doctor / Clínica','Especialidad','Consultorio','Piso/Nivel','Teléfono','WhatsApp','Estado','Acciones'].map(h=>(
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r=>(
                <tr key={r.id} style={{borderTop:'1px solid #f3f4f6',transition:'background 0.15s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='#f0f9ff'}
                  onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                  <td style={S.td}>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{width:36,height:36,borderRadius:9,background:'linear-gradient(135deg,#1e40af,#2563eb)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-disp)',fontSize:13,fontWeight:700,flexShrink:0}}>
                        {initials(r.nombre_doctor)}
                      </div>
                      <div>
                        <div style={{fontWeight:700,color:'#111827',fontSize:13}}>{r.nombre_doctor}</div>
                        <div style={{fontSize:11,color:'#6b7280'}}>{r.nombre_clinica}</div>
                      </div>
                    </div>
                  </td>
                  <td style={S.td}><span style={{background:'#dbeafe',color:'#1e40af',padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700}}>{r.especialidad}</span></td>
                  <td style={{...S.td,fontWeight:700}}>{r.numero_consultorio}</td>
                  <td style={S.td}>{r.piso_nivel}</td>
                  <td style={S.td}>{r.telefono}{r.extension?` ext.${r.extension}`:''}</td>
                  <td style={S.td}>
                    {r.whatsapp
                      ? <a href={`https://wa.me/${r.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                          style={{color:'#059669',fontWeight:600,fontSize:13}}>💬 {r.whatsapp}</a>
                      : <span style={{color:'#d1d5db',fontSize:12}}>—</span>
                    }
                  </td>
                  <td style={S.td}>
                    <button onClick={()=>toggleActivo(r)}
                      style={{background:r.activo?'#d1fae5':'#fee2e2',color:r.activo?'#065f46':'#991b1b',border:'none',padding:'4px 10px',borderRadius:20,fontSize:11,fontWeight:700,cursor:'pointer'}}>
                      {r.activo?'● Activo':'● Inactivo'}
                    </button>
                  </td>
                  <td style={S.td}>
                    <div style={{display:'flex',gap:6}}>
                      <button onClick={()=>openEdit(r)} style={S.editBtn}>✏ Editar</button>
                      <button onClick={()=>setDelId(r.id)} style={S.delBtn}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL FORMULARIO */}
      {modal && (
        <div style={S.overlay} onClick={e=>e.target===e.currentTarget&&closeModal()}>
          <div style={S.modal}>
            <div style={S.modalHdr}>
              <h2 style={{fontSize:17,fontWeight:700,color:'#111827'}}>{modal==='edit'?'✏ Editar médico':'+ Agregar nuevo médico'}</h2>
              <button onClick={closeModal} style={{background:'#f3f4f6',border:'none',width:32,height:32,borderRadius:8,fontSize:15,cursor:'pointer'}}>✕</button>
            </div>
            <form onSubmit={save} style={{padding:'20px 24px',display:'flex',flexDirection:'column',gap:14}}>
              <Row>
                <Field label="Nombre del Doctor *" name="nombre_doctor" val={form.nombre_doctor} hc={hc} ph="Dr. Juan Pérez" />
                <Field label="Especialidad *" name="especialidad" val={form.especialidad} hc={hc} type="select" opts={ESPECIALIDADES} />
              </Row>
              <Field label="Nombre de la Clínica" name="nombre_clinica" val={form.nombre_clinica} hc={hc} ph="Clínica del Corazón" />
              <Row>
                <Field label="Piso / Nivel" name="piso_nivel" val={form.piso_nivel} hc={hc} ph="Nivel 2" />
                <Field label="N° Consultorio" name="numero_consultorio" val={form.numero_consultorio} hc={hc} ph="201" />
              </Row>
              <Row>
                <Field label="Teléfono" name="telefono" val={form.telefono} hc={hc} ph="24561234" />
                <Field label="Extensión" name="extension" val={form.extension} hc={hc} ph="201" />
              </Row>
              <Row>
                <Field label="WhatsApp (con código país)" name="whatsapp" val={form.whatsapp} hc={hc} ph="50224561234" />
                <Field label="Email" name="email" val={form.email} hc={hc} type="email" ph="doctor@clinica.com" />
              </Row>
              <Field label="Horario (texto libre)" name="horario_texto" val={form.horario_texto} hc={hc} ph="Lun-Vie 8:00am - 2:00pm" />
              <Field label="Servicios (separados por coma)" name="servicios" val={form.servicios} hc={hc} ph="Ecocardiograma, Holter, Consulta general" />
              <Field label="URL Foto del Doctor (opcional)" name="foto_url" val={form.foto_url} hc={hc} ph="https://..." />

              <label style={{display:'flex',alignItems:'center',gap:10,fontSize:14,color:'#374151',cursor:'pointer'}}>
                <input type="checkbox" name="activo" checked={form.activo} onChange={hc} style={{width:16,height:16,accentColor:'#2563eb'}} />
                Consultorio activo (visible en el directorio)
              </label>

              <div style={{display:'flex',gap:10,justifyContent:'flex-end',paddingTop:8,borderTop:'1px solid #f3f4f6'}}>
                <button type="button" onClick={closeModal} style={S.cancelBtn}>Cancelar</button>
                <button type="submit" disabled={saving} style={{...S.saveBtn,opacity:saving?0.6:1}}>{saving?'Guardando...':'💾 Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE */}
      {delId && (
        <div style={S.overlay}>
          <div style={{background:'#fff',borderRadius:20,padding:36,textAlign:'center',maxWidth:360,width:'100%',boxShadow:'0 10px 40px rgba(0,0,0,0.2)'}}>
            <div style={{fontSize:44,marginBottom:12}}>⚠️</div>
            <h3 style={{color:'#111827',marginBottom:8}}>¿Eliminar registro?</h3>
            <p style={{color:'#6b7280',fontSize:14,marginBottom:24}}>Esta acción no se puede deshacer.</p>
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setDelId(null)} style={S.cancelBtn}>Cancelar</button>
              <button onClick={()=>del(delId)} style={{...S.saveBtn,background:'#ef4444'}}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div style={{position:'fixed',bottom:24,right:24,padding:'12px 20px',borderRadius:10,fontSize:14,fontWeight:600,boxShadow:'0 4px 20px rgba(0,0,0,0.12)',zIndex:200,background:toast.type==='err'?'#fee2e2':'#d1fae5',color:toast.type==='err'?'#991b1b':'#065f46',border:`1px solid ${toast.type==='err'?'#fecaca':'#a7f3d0'}`}}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

function Row({children}){ return <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>{children}</div> }
function Field({label,name,val,hc,ph,type='text',opts}){
  return (
    <div style={{display:'flex',flexDirection:'column',gap:5}}>
      <label style={{fontSize:11,fontWeight:700,color:'#374151',textTransform:'uppercase',letterSpacing:'0.5px'}}>{label}</label>
      {type==='select'
        ? <select name={name} value={val} onChange={hc} style={S.input}>
            <option value="">Seleccionar...</option>
            {opts.map(o=><option key={o} value={o}>{o}</option>)}
          </select>
        : <input name={name} type={type} value={val} onChange={hc} placeholder={ph} style={S.input} />
      }
    </div>
  )
}

const S = {
  header:{ background:'#1e3a5f',padding:'0 24px',height:64,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:50,boxShadow:'0 2px 12px rgba(0,0,0,0.2)' },
  hIcon:{ width:40,height:40,background:'linear-gradient(135deg,#2563eb,#3b82f6)',borderRadius:11,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20 },
  adminTag:{ background:'#2563eb',color:'#fff',fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:5,letterSpacing:1 },
  hBtn:{ background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',color:'#fff',padding:'7px 14px',borderRadius:8,fontSize:13,fontWeight:500 },
  toolbar:{ background:'#fff',padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,borderBottom:'1px solid #e5e7eb',flexWrap:'wrap' },
  searchBox:{ display:'flex',alignItems:'center',gap:8,background:'#f3f4f6',padding:'8px 14px',borderRadius:9,flex:1,maxWidth:380 },
  addBtn:{ background:'#2563eb',color:'#fff',border:'none',padding:'10px 20px',borderRadius:9,fontSize:14,fontWeight:700,display:'flex',alignItems:'center',gap:6,whiteSpace:'nowrap' },
  th:{ background:'#1e3a5f',color:'rgba(255,255,255,0.75)',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.8px',padding:'14px 16px',textAlign:'left' },
  td:{ padding:'13px 16px',fontSize:13,verticalAlign:'middle' },
  editBtn:{ background:'#eff6ff',color:'#1d4ed8',border:'none',padding:'6px 12px',borderRadius:7,fontSize:12,fontWeight:700,cursor:'pointer' },
  delBtn:{ background:'#fef2f2',color:'#991b1b',border:'none',padding:'6px 10px',borderRadius:7,fontSize:13,cursor:'pointer' },
  overlay:{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:20 },
  modal:{ background:'#fff',borderRadius:20,width:'100%',maxWidth:580,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 10px 40px rgba(0,0,0,0.2)' },
  modalHdr:{ padding:'20px 24px 16px',borderBottom:'1px solid #f3f4f6',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,background:'#fff',zIndex:1 },
  input:{ border:'1.5px solid #e5e7eb',borderRadius:8,padding:'10px 12px',fontSize:14,outline:'none',width:'100%',color:'#374151' },
  cancelBtn:{ background:'#f3f4f6',border:'none',padding:'10px 20px',borderRadius:8,fontSize:14,fontWeight:600,color:'#374151',cursor:'pointer' },
  saveBtn:{ background:'#2563eb',color:'#fff',border:'none',padding:'10px 24px',borderRadius:8,fontSize:14,fontWeight:700,cursor:'pointer' },
}
