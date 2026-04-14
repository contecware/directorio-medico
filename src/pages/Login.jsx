import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login(){
  const navigate = useNavigate()
  const [user,setUser] = useState('')
  const [pass,setPass] = useState('')
  const [err,setErr]   = useState('')
  const [busy,setBusy] = useState(false)

  const ADMIN_USER = import.meta.env.VITE_ADMIN_USER || 'admin'
  const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS || 'Sist3m@7487'

  function handleLogin(e){
    e.preventDefault()
    setBusy(true); setErr('')
    setTimeout(()=>{
      if(user===ADMIN_USER && pass===ADMIN_PASS){
        sessionStorage.setItem('dm_admin','true')
        navigate('/admin')
      } else {
        setErr('Usuario o contraseña incorrectos.')
        setBusy(false)
      }
    },600)
  }

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(155deg,#1e40af,#2563eb 55%,#3b82f6)',display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div style={{background:'#fff',borderRadius:20,padding:'40px 36px',width:'100%',maxWidth:400,boxShadow:'0 10px 40px rgba(0,0,0,0.2)',textAlign:'center'}}>

        <div style={{width:68,height:68,background:'linear-gradient(135deg,#1e40af,#2563eb)',borderRadius:20,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,margin:'0 auto 20px',boxShadow:'0 4px 20px rgba(37,99,235,0.3)'}}>🔐</div>

        <h1 style={{fontFamily:'var(--font-disp)',fontSize:24,color:'#111827',marginBottom:8}}>Acceso Administrativo</h1>
        <p style={{fontSize:14,color:'#6b7280',marginBottom:28}}>Ingresa tus credenciales para gestionar el directorio</p>

        <form onSubmit={handleLogin} style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{display:'flex',flexDirection:'column',gap:5,textAlign:'left'}}>
            <label style={{fontSize:11,fontWeight:700,color:'#374151',textTransform:'uppercase',letterSpacing:'0.5px'}}>Usuario</label>
            <input value={user} onChange={e=>setUser(e.target.value)} placeholder="admin" required
              style={{border:'1.5px solid #e5e7eb',borderRadius:10,padding:'12px 14px',fontSize:15,outline:'none'}} />
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:5,textAlign:'left'}}>
            <label style={{fontSize:11,fontWeight:700,color:'#374151',textTransform:'uppercase',letterSpacing:'0.5px'}}>Contraseña</label>
            <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" required
              style={{border:'1.5px solid #e5e7eb',borderRadius:10,padding:'12px 14px',fontSize:15,outline:'none'}} />
          </div>

          {err && <div style={{background:'#fef2f2',border:'1px solid #fecaca',color:'#991b1b',padding:'10px 14px',borderRadius:8,fontSize:13,fontWeight:500}}>⚠️ {err}</div>}

          <button type="submit" disabled={busy}
            style={{background:'linear-gradient(135deg,#1e40af,#2563eb)',color:'#fff',border:'none',padding:14,borderRadius:10,fontSize:15,fontWeight:700,marginTop:4,opacity:busy?0.7:1}}>
            {busy?'Verificando...':'Ingresar al Panel →'}
          </button>
        </form>

        <button onClick={()=>navigate('/')} style={{background:'none',border:'none',color:'#9ca3af',fontSize:13,marginTop:16,display:'block',width:'100%'}}>
          ← Volver al directorio público
        </button>
        <div style={{fontSize:11,color:'#d1d5db',marginTop:8}}>Credenciales configuradas en <code>.env</code></div>
      </div>
    </div>
  )
}
