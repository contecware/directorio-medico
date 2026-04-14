import { Routes, Route, Navigate } from 'react-router-dom'
import Directorio from './pages/Directorio'
import Detalle from './pages/Detalle'
import Admin from './pages/Admin'
import Login from './pages/Login'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Directorio />} />
      <Route path="/clinica/:id" element={<Detalle />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  )
}
export default App