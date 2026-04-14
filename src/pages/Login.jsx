import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Login.module.css'

export default function Login() {
  const navigate  = useNavigate()
  const [user,    setUser]    = useState('')
  const [pass,    setPass]    = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const ADMIN_USER = import.meta.env.VITE_ADMIN_USER || 'admin'
  const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS || 'admin123'

  function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    setTimeout(() => {
      if (user === ADMIN_USER && pass === ADMIN_PASS) {
        sessionStorage.setItem('dm_admin', 'true')
        navigate('/admin')
      } else {
        setError('Usuario o contraseña incorrectos.')
        setLoading(false)
      }
    }, 600)
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.iconWrap}>🔐</div>
        <h1 className={styles.title}>Acceso Administrativo</h1>
        <p className={styles.subtitle}>Ingresa tus credenciales para gestionar el directorio</p>

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Usuario</label>
            <input
              className={styles.input}
              type="text"
              placeholder="admin"
              value={user}
              onChange={e => setUser(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Contraseña</label>
            <input
              className={styles.input}
              type="password"
              placeholder="••••••••"
              value={pass}
              onChange={e => setPass(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && <div className={styles.error}>⚠️ {error}</div>}

          <button className={styles.loginBtn} type="submit" disabled={loading}>
            {loading ? 'Verificando...' : 'Ingresar al Panel →'}
          </button>
        </form>

        <button className={styles.backLink} onClick={() => navigate('/')}>
          ← Volver al directorio público
        </button>

        <div className={styles.hint}>
          Credenciales configuradas en el archivo <code>.env</code>
        </div>
      </div>
    </div>
  )
}
