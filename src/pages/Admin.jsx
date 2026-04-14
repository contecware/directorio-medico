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
  const [selected, setSelected] = useState(null)

  const toast$ = (msg,type='ok') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000) }

  const load = useCallback(async()=>{
    setLoading(true)
    const {data} = await supabase.from('clinicas').select('*').order('nombre_doctor')
    setRows(data||[])
    setLoading(false)
  },[])

  useEffect(()=>{load()},[load])

  function logout(){ sessionStorage.removeItem('dm_admin'); navigate('/login') }

  function openAdd(){ setForm(EMPTY); setEditId(null); setModal('add'); setSelected(null) }
  function openEdit(r){
    setForm({
      nombre_doctor:r.nombre_doctor||'', especialidad:r.especialidad||'',
      nombre_clinica:r.nombre_clinica||'', piso_nivel:r.piso_nivel||'',
      numero_consultorio:r.numero_consultorio||'', telefono:r.telefono||'',
      extension:r.extension||'', whatsapp:r.whatsapp||'',
      email:r.email||'', horario_texto:r.horario_texto||'',
      servicios:r.servicios||'', foto_url:r.foto_url||'', activo:r.activo??true
    })
    setEditId(r.id); setModal('edit'); setSelected(r)
  }
  function closeModal(){ setModal(false); setEditId(null); setSelected(null) }
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
    <div style={{display:'flex',minHeight:'100vh',background:'#f1f5f9',fontFamily:'system-ui, -apple-system, sans-serif'}}>
      
      {/* SIDEBAR - Desktop optimized */}
      <aside style={{width:280,minWidth:280,background:'#1e293b',color:'#fff',display:'flex',flexDirection:'column',position:'fixed',height:'100vh',overflowY:'auto'}}>
        <div style={{padding:24,borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
            <div style={{width:44,height:44,background:'linear-gradient(135deg,#0ea5e9,#2563eb)',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>🏥</div>
            <div>
              <div style={{fontSize:18,fontWeight:800,letterSpacing:'-0.5px'}}>MediAdmin</div>
              <div style={{fontSize:12,color:'#94a3b8'}}>Panel de Control</div>
            </div>
          </div>
        </div>

        <nav style={{flex:1,padding:'20px 16px',display:'flex',flexDirection:'column',gap:8}}>
          <div style={{fontSize:11,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'1px',padding:'0 12px',marginBottom:8}}>Principal</div>
          
          <button style={{...S.navBtn,background:'rgba(255,255,255,0.1)',color:'#fff'}}>
            <span>👨‍⚕️</span> Directorio Médico
          </button>
          
          <button onClick={()=>navigate('/')} style={S.navBtn}>
            <span>🌐</span> Ver Sitio Público
          </button>

          <div style={{fontSize:11,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'1px',padding:'20px 12px 8px'}}>Acciones Rápidas</div>
          
          <button onClick={openAdd} style={{...S.navBtn,background:'#0ea5e9',color:'#fff'}}>
            <span>➕</span> Nuevo Médico
          </button>
        </nav>

        <div style={{padding:16,borderTop:'1px solid rgba(255,255,255,0.1)'}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
            <div style={{width:36,height:36,borderRadius:'50%',background:'#334155',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>👤</div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600}}>Administrador</div>
              <div style={{fontSize:11,color:'#94a3b8'}}>Admin</div>
            </div>
          </div>
          <button onClick={logout} style={{width:'100%',padding:'10px',background:'rgba(239,68,68,0.2)',color:'#fca5a5',border:'1px solid rgba(239,68,68,0.3)',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{flex:1,marginLeft:280,padding:32,minWidth:0}}>
        
        {/* HEADER */}
        <div style={{marginBottom:32}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
            <h1 style={{fontSize:32,fontWeight:800,color:'#0f172a',letterSpacing:'-0.5px'}}>Directorio Médico</h1>
            <div style={{display:'flex',gap:12}}>
              <div style={{background:'#fff',padding:'8px 16px',borderRadius:12,boxShadow:'0 1px 3px rgba(0,0,0,0.1)',fontSize:14,fontWeight:600,color:'#475569'}}>
                {rows.length} médicos registrados
              </div>
              <div style={{background:'#fff',padding:'8px 16px',borderRadius:12,boxShadow:'0 1px 3px rgba(0,0,0,0.1)',fontSize:14,fontWeight:600,color:'#059669'}}>
                {rows.filter(r=>r.activo).length} activos
              </div>
            </div>
          </div>
          <p style={{color:'#64748b',fontSize:16}}>Gestiona los médicos, consultorios y especialidades del directorio</p>
        </div>

        {/* TOOLBAR */}
        <div style={{background:'#fff',padding:20,borderRadius:16,boxShadow:'0 1px 3px rgba(0,0,0,0.1)',marginBottom:24,display:'flex',alignItems:'center',gap:16}}>
          <div style={{flex:1,position:'relative',maxWidth:500}}>
            <span style={{position:'absolute',left:16,top:'50%',transform:'translateY(-50%)',fontSize:18,color:'#94a3b8'}}>🔍</span>
            <input 
              placeholder="Buscar por nombre, especialidad, consultorio..." 
              value={q} 
              onChange={e=>setQ(e.target.value)}
              style={{width:'100%',padding:'12px 16px 12px 48px',border:'2px solid #e2e8f0',borderRadius:12,fontSize:15,outline:'none',transition:'all 0.2s'}}
            />
            {q && (
              <button onClick={()=>setQ('')} style={{position:'absolute',right:16,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:18}}>✕</button>
            )}
          </div>
          
          <button onClick={openAdd} style={{background:'#2563eb',color:'#fff',border:'none',padding:'12px 24px',borderRadius:12,fontSize:15,fontWeight:700,display:'flex',alignItems:'center',gap:8,cursor:'pointer',boxShadow:'0 4px 6px -1px rgba(37,99,235,0.3)',transition:'all 0.2s',whiteSpace:'nowrap'}}>
            <span style={{fontSize:20}}>+</span> Agregar Médico
          </button>
        </div>

        {/* STATS CARDS */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:16,marginBottom:24}}>
          {ESPECIALIDADES.slice(0,4).map((esp,idx)=>{
            const count = rows.filter(r=>r.especialidad===esp).length
            const colors = ['#3b82f6','#8b5cf6','#10b981','#f59e0b']
            return (
              <div key={esp} style={{background:'#fff',padding:20,borderRadius:16,boxShadow:'0 1px 3px rgba(0,0,0,0.1)',borderLeft:`4px solid ${colors[idx]}`}}>
                <div style={{fontSize:12,color:'#64748b',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px'}}>{esp}</div>
                <div style={{fontSize:28,fontWeight:800,color:'#0f172a',marginTop:4}}>{count}</div>
              </div>
            )
          })}
        </div>

        {/* TABLE */}
        <div style={{background:'#fff',borderRadius:16,boxShadow:'0 1px 3px rgba(0,0,0,0.1)',overflow:'hidden'}}>
          {loading ? (
            <div style={{padding:40}}>
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {[...Array(6)].map((_,i)=><div key={i} style={{height:64,background:'#f1f5f9',borderRadius:8,animation:'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'}}/>)}
              </div>
            </div>
          ) : filtered.length===0 ? (
            <div style={{padding:80,textAlign:'center'}}>
              <div style={{fontSize:64,marginBottom:16}}>📋</div>
              <h3 style={{fontSize:20,fontWeight:700,color:'#0f172a',marginBottom:8}}>{q?'No se encontraron resultados':'No hay médicos registrados'}</h3>
              <p style={{color:'#64748b',marginBottom:24}}>{q?'Intenta con otra búsqueda':'Comienza agregando el primer médico al directorio'}</p>
              {!q && <button onClick={openAdd} style={{background:'#2563eb',color:'#fff',border:'none',padding:'12px 24px',borderRadius:12,fontSize:15,fontWeight:700,cursor:'pointer'}}>+ Agregar Médico</button>}
            </div>
          ) : (
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:14}}>
                <thead>
                  <tr style={{background:'#f8fafc',borderBottom:'2px solid #e2e8f0'}}>
                    <th style={{padding:'16px 20px',textAlign:'left',fontSize:12,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.5px',whiteSpace:'nowrap'}}>Doctor</th>
                    <th style={{padding:'16px 20px',textAlign:'left',fontSize:12,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.5px'}}>Especialidad</th>
                    <th style={{padding:'16px 20px',textAlign:'left',fontSize:12,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.5px'}}>Ubicación</th>
                    <th style={{padding:'16px 20px',textAlign:'left',fontSize:12,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.5px'}}>Contacto</th>
                    <th style={{padding:'16px 20px',textAlign:'left',fontSize:12,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.5px'}}>Horario</th>
                    <th style={{padding:'16px 20px',textAlign:'center',fontSize:12,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.5px'}}>Estado</th>
                    <th style={{padding:'16px 20px',textAlign:'center',fontSize:12,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.5px'}}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r,idx)=>(
                    <tr key={r.id} style={{borderBottom:'1px solid #f1f5f9',transition:'all 0.2s',background:idx%2===0?'#fff':'#fafafa','&:hover':{background:'#f0f9ff'}}}>
                      <td style={{padding:'20px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:16}}>
                          <div style={{width:48,height:48,borderRadius:12,background:'linear-gradient(135deg,#1e40af,#3b82f6)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,flexShrink:0}}>
                            {initials(r.nombre_doctor)}
                          </div>
                          <div>
                            <div style={{fontWeight:700,color:'#0f172a',fontSize:15,marginBottom:2}}>{r.nombre_doctor}</div>
                            <div style={{fontSize:13,color:'#64748b'}}>{r.nombre_clinica}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{padding:'20px'}}>
                        <span style={{background:'#dbeafe',color:'#1e40af',padding:'6px 14px',borderRadius:20,fontSize:12,fontWeight:700,display:'inline-block'}}>
                          {r.especialidad}
                        </span>
                      </td>
                      <td style={{padding:'20px'}}>
                        <div style={{fontWeight:600,color:'#374151'}}>Consultorio {r.numero_consultorio}</div>
                        <div style={{fontSize:13,color:'#6b7280'}}>{r.piso_nivel}</div>
                      </td>
                      <td style={{padding:'20px'}}>
                        <div style={{display:'flex',flexDirection:'column',gap:4}}>
                          {r.telefono && <div style={{fontSize:13,color:'#374151'}}>📞 {r.telefono}{r.extension && ` ext. ${r.extension}`}</div>}
                          {r.whatsapp && <div style={{fontSize:13,color:'#059669'}}>💬 {r.whatsapp}</div>}
                          {r.email && <div style={{fontSize:12,color:'#6b7280'}}>✉ {r.email}</div>}
                        </div>
                      </td>
                      <td style={{padding:'20px',maxWidth:200}}>
                        <div style={{fontSize:13,color:'#374151',lineHeight:1.4}}>{r.horario_texto || '—'}</div>
                      </td>
                      <td style={{padding:'20px',textAlign:'center'}}>
                        <button 
                          onClick={()=>toggleActivo(r)}
                          style={{
                            background:r.activo?'#d1fae5':'#fee2e2',
                            color:r.activo?'#065f46':'#991b1b',
                            border:'none',
                            padding:'8px 16px',
                            borderRadius:20,
                            fontSize:12,
                            fontWeight:700,
                            cursor:'pointer',
                            display:'inline-flex',
                            alignItems:'center',
                            gap:6,
                            transition:'all 0.2s'
                          }}
                        >
                          <span style={{width:6,height:6,borderRadius:'50%',background:r.activo?'#059669':'#dc2626'}}></span>
                          {r.activo?'Activo':'Inactivo'}
                        </button>
                      </td>
                      <td style={{padding:'20px',textAlign:'center'}}>
                        <div style={{display:'flex',gap:8,justifyContent:'center'}}>
                          <button onClick={()=>openEdit(r)} style={{background:'#eff6ff',color:'#2563eb',border:'none',padding:'8px 16px',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',transition:'all 0.2s'}}>✏ Editar</button>
                          <button onClick={()=>setDelId(r.id)} style={{background:'#fef2f2',color:'#dc2626',border:'none',padding:'8px 12px',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',transition:'all 0.2s'}}>🗑</button>
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

      {/* MODAL - Desktop optimized with 3 columns */}
      {modal && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.6)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:40,backdropFilter:'blur(4px)'}} onClick={e=>e.target===e.currentTarget&&closeModal()}>
          <div style={{background:'#fff',borderRadius:24,width:'100%',maxWidth:1000,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 25px 50px -12px rgba(0,0,0,0.25)'}}>
            <div style={{padding:'24px 32px',borderBottom:'1px solid #e2e8f0',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,background:'#fff',zIndex:1}}>
              <div>
                <h2 style={{fontSize:24,fontWeight:800,color:'#0f172a'}}>{modal==='edit'?'✏ Editar médico':'+ Agregar nuevo médico'}</h2>
                <p style={{color:'#64748b',fontSize:14,marginTop:4}}>Completa la información del profesional de la salud</p>
              </div>
              <button onClick={closeModal} style={{background:'#f1f5f9',border:'none',width:40,height:40,borderRadius:12,fontSize:20,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#64748b',transition:'all 0.2s'}}>✕</button>
            </div>
            
            <form onSubmit={save} style={{padding:32}}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:20}}>
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
              
              <div style={{marginTop:20,display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
                <Field label="Horario de Atención" name="horario_texto" val={form.horario_texto} hc={hc} ph="Lunes a Viernes: 8:00 AM - 2:00 PM y 4:00 PM - 8:00 PM" />
                <Field label="URL Foto del Doctor" name="foto_url" val={form.foto_url} hc={hc} ph="https://ejemplo.com/foto.jpg" />
              </div>
              
              <div style={{marginTop:20}}>
                <Field label="Servicios (separados por coma)" name="servicios" val={form.servicios} hc={hc} ph="Consulta general, Ecocardiograma, Electrocardiograma, Holter, Prueba de esfuerzo" />
              </div>

              <div style={{marginTop:24,padding:20,background:'#f8fafc',borderRadius:12,border:'1px solid #e2e8f0'}}>
                <label style={{display:'flex',alignItems:'center',gap:12,cursor:'pointer'}}>
                  <input type="checkbox" name="activo" checked={form.activo} onChange={hc} style={{width:20,height:20,accentColor:'#2563eb'}} />
                  <div>
                    <div style={{fontSize:15,fontWeight:700,color:'#0f172a'}}>Consultorio activo</div>
                    <div style={{fontSize:13,color:'#64748b'}}>El médico será visible en el directorio público</div>
                  </div>
                </label>
              </div>

              <div style={{display:'flex',gap:12,justifyContent:'flex-end',marginTop:24,paddingTop:24,borderTop:'1px solid #e2e8f0'}}>
                <button type="button" onClick={closeModal} style={{background:'#f1f5f9',color:'#475569',border:'none',padding:'12px 24px',borderRadius:12,fontSize:15,fontWeight:700,cursor:'pointer',transition:'all 0.2s'}}>Cancelar</button>
                <button type="submit" disabled={saving} style={{background:'#2563eb',color:'#fff',border:'none',padding:'12px 32px',borderRadius:12,fontSize:15,fontWeight:700,cursor:saving?'not-allowed':'pointer',opacity:saving?0.6:1,boxShadow:'0 4px 6px -1px rgba(37,99,235,0.3)',transition:'all 0.2s'}}>
                  {saving?'⏳ Guardando...':'💾 Guardar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE */}
      {delId && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.6)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:40,backdropFilter:'blur(4px)'}}>
          <div style={{background:'#fff',borderRadius:24,padding:48,textAlign:'center',maxWidth:420,width:'100%',boxShadow:'0 25px 50px -12px rgba(0,0,0,0.25)'}}>
            <div style={{width:80,height:80,borderRadius:'50%',background:'#fef2f2',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px',fontSize:40}}>⚠️</div>
            <h3 style={{fontSize:22,fontWeight:800,color:'#0f172a',marginBottom:12}}>¿Eliminar registro?</h3>
            <p style={{color:'#64748b',fontSize:16,lineHeight:1.5,marginBottom:32}}>Esta acción eliminará permanentemente al médico del directorio. No se puede deshacer.</p>
            <div style={{display:'flex',gap:12,justifyContent:'center'}}>
              <button onClick={()=>setDelId(null)} style={{background:'#f1f5f9',color:'#475569',border:'none',padding:'12px 24px',borderRadius:12,fontSize:15,fontWeight:700,cursor:'pointer'}}>Cancelar</button>
              <button onClick={()=>del(delId)} style={{background:'#dc2626',color:'#fff',border:'none',padding:'12px 24px',borderRadius:12,fontSize:15,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 6px -1px rgba(220,38,38,0.3)'}}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div style={{position:'fixed',bottom:32,right:32,padding:'16px 24px',borderRadius:12,fontSize:15,fontWeight:600,boxShadow:'0 10px 15px -3px rgba(0,0,0,0.1)',zIndex:200,background:toast.type==='err'?'#fef2f2':'#f0fdf4',color:toast.type==='err'?'#991b1b':'#166534',border:`1px solid ${toast.type==='err'?'#fecaca':'#bbf7d0'}`,display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:20}}>{toast.type==='err'?'❌':'✅'}</span>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

function Field({label,name,val,hc,ph,type='text',opts}){
  return (
    <div style={{display:'flex',flexDirection:'column',gap:6}}>
      <label style={{fontSize:12,fontWeight:700,color:'#374151',textTransform:'uppercase',letterSpacing:'0.5px'}}>{label}</label>
      {type==='select'
        ? <select name={name} value={val} onChange={hc} style={{padding:'12px 16px',border:'2px solid #e5e7eb',borderRadius:10,fontSize:15,outline:'none',transition:'all 0.2s',background:'#fff',color:'#111827',cursor:'pointer'}}>
            <option value="">Seleccionar...</option>
            {opts.map(o=><option key={o} value={o}>{o}</option>)}
          </select>
        : <input 
            name={name} 
            type={type} 
            value={val} 
            onChange={hc} 
            placeholder={ph} 
            style={{padding:'12px 16px',border:'2px solid #e5e7eb',borderRadius:10,fontSize:15,outline:'none',transition:'all 0.2s',background:'#fff',color:'#111827',width:'100%'}} 
          />
      }
    </div>
  )
}

const S = {
  navBtn: { 
    width:'100%', 
    padding:'12px 16px', 
    borderRadius:10, 
    border:'none', 
    background:'transparent', 
    color:'#94a3b8', 
    fontSize:14, 
    fontWeight:600, 
    cursor:'pointer',
    display:'flex',
    alignItems:'center',
    gap:12,
    transition:'all 0.2s',
    textAlign:'left'
  }
}