/**
 * horario.js — Utilidades para horarios del Directorio Médico
 *
 * Formato esperado en la BD (horario_texto):
 *   "Lun-Vie 7:00am - 1:00pm"
 *   "Lun-Sáb 8:00am - 3:00pm"
 *   "Lun, Mié, Vie 8:00am - 12:00pm"
 *   "Lun-Vie 8:00 - 17:00"          ← también acepta formato 24h
 *   "Lun-Vie 8:00am-2:00pm, Sáb 9:00am-1:00pm"  ← múltiples bloques
 */

// ── Nombres de días ──────────────────────────────────────────────
const DIA_IDX = {
  lun:1, lunes:1,
  mar:2, martes:2,
  mié:3, mie:3, miercoles:3, miércoles:3,
  jue:4, jueves:4,
  vie:5, viernes:5,
  sáb:6, sab:6, sabado:6, sábado:6,
  dom:0, domingo:0,
}
export const DIAS_LABELS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

// ── Normaliza texto (sin tildes, minúsculas) ──────────────────────
export function normalizar(str = '') {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // quita tildes
    .trim()
}

// ── Convierte hora "8:00am" / "14:00" → minutos desde medianoche ─
function horaAMinutos(str) {
  if (!str) return null
  const s    = str.trim().toLowerCase()
  const pm   = s.includes('pm')
  const am   = s.includes('am')
  const num  = s.replace(/[ap]m/g,'').trim()
  const [h,m]= num.split(':').map(Number)
  let hora   = isNaN(h) ? 0 : h
  let min    = isNaN(m) ? 0 : m
  if (pm && hora !== 12) hora += 12
  if (am && hora === 12) hora  = 0
  return hora * 60 + min
}

// ── Expande rango "Lun-Vie" → [1,2,3,4,5] ───────────────────────
function expandirRangoDias(parte) {
  const norm = normalizar(parte)

  // rango con guión: "lun-vie"
  if (norm.includes('-')) {
    const [desde, hasta] = norm.split('-').map(d => DIA_IDX[d.trim()])
    if (desde == null || hasta == null) return []
    // maneja wrap (ej: Vie-Dom)
    const result = []
    let i = desde
    while (true) {
      result.push(i)
      if (i === hasta) break
      i = (i + 1) % 7
      if (result.length > 7) break   // evita loop infinito
    }
    return result
  }

  // lista con comas: "Lun, Mié, Vie" → ya separado antes
  const idx = DIA_IDX[norm.trim()]
  return idx != null ? [idx] : []
}

// ── Parsea un bloque "Lun-Vie 8:00am - 2:00pm" ──────────────────
function parsearBloque(bloque) {
  // Separa días de horas: busca primer dígito de hora
  const match = bloque.match(/^([\w\s,áéíóúüñ\-]+?)\s+(\d{1,2}:\d{2}\s*[apm]*\s*[-–]\s*\d{1,2}:\d{2}\s*[apm]*)$/i)
  if (!match) return null

  const parteDias  = match[1].trim()
  const parteHoras = match[2].trim()

  // Parsear horas
  const [horaInicio, horaFin] = parteHoras.split(/[-–]/).map(h => horaAMinutos(h.trim()))
  if (horaInicio == null || horaFin == null) return null

  // Parsear días (pueden ser lista con comas o rango)
  const diasStr = parteDias.split(',')
  const dias    = []
  for (const d of diasStr) {
    const expanded = expandirRangoDias(d.trim())
    dias.push(...expanded)
  }

  return { dias: [...new Set(dias)], inicio: horaInicio, fin: horaFin }
}

// ── API PRINCIPAL ─────────────────────────────────────────────────

/**
 * parseHorario(texto)
 * Devuelve array de bloques: [{ dias:[1,2,3,4,5], inicio:480, fin:840 }, ...]
 * dias usa índice JS de Date.getDay(): 0=Dom,1=Lun,...,6=Sáb
 */
export function parseHorario(texto = '') {
  if (!texto) return []
  // Permite múltiples bloques separados por "," si no forman parte de días
  // Estrategia: dividir por coma + espacio antes de número
  const bloques = texto.split(/,\s*(?=\d)/)
  const result  = []
  for (const b of bloques) {
    const parsed = parsearBloque(b.trim())
    if (parsed) result.push(parsed)
  }
  return result
}

/**
 * estaAbierto(bloques, ahora?)
 * Retorna true si la clínica está abierta en este momento
 */
export function estaAbierto(bloques, ahora = new Date()) {
  const diaSemana  = ahora.getDay()             // 0=Dom…6=Sáb
  const minActual  = ahora.getHours() * 60 + ahora.getMinutes()

  return bloques.some(b =>
    b.dias.includes(diaSemana) &&
    minActual >= b.inicio &&
    minActual <  b.fin
  )
}

/**
 * horarioPorDia(bloques)
 * Devuelve mapa: { 0: "Cerrado", 1: "8:00–14:00", ... }
 */
export function horarioPorDia(bloques) {
  const mapa = {}
  for (let d = 0; d < 7; d++) {
    const bloque = bloques.find(b => b.dias.includes(d))
    if (bloque) {
      mapa[d] = `${minAHora(bloque.inicio)}–${minAHora(bloque.fin)}`
    } else {
      mapa[d] = null   // null = cerrado ese día
    }
  }
  return mapa
}

// ── Helpers de formato ───────────────────────────────────────────
function minAHora(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  const hh = h.toString().padStart(2,'0')
  const mm = m.toString().padStart(2,'0')
  // Mostrar en formato 12h si quieres, o 24h:
  if (m === 0) {
    // formato amigable: "8:00am"
    if (h === 0)  return '12:00am'
    if (h < 12)  return `${h}:00am`
    if (h === 12) return '12:00pm'
    return `${h-12}:00pm`
  }
  return `${hh}:${mm}`
}
