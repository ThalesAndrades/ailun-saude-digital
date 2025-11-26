import * as SecureStore from 'expo-secure-store'

const base = process.env.EXPO_PUBLIC_API_BASE_URL || ''

async function getSessionToken() {
  return await SecureStore.getItemAsync('session_token')
}

async function authFetch(path: string, init?: RequestInit) {
  const token = await getSessionToken()
  const headers = new Headers(init?.headers || {})
  if (token) headers.set('Cookie', `session=${token}`)
  headers.set('Content-Type', 'application/json')
  const res = await fetch(`${base}${path}`, { ...init, headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Erro na requisição')
  return data
}

export async function login(email: string, password: string) {
  const res = await fetch(`${base}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Falha na autenticação')
  if (data.token) {
    await SecureStore.setItemAsync('session_token', String(data.token))
    await SecureStore.setItemAsync('user_role', 'admin') // Assume admin role for mobile
  }
  return data
}

export async function checkAuth() {
  try {
    const token = await getSessionToken()
    if (!token) return false
    
    const res = await fetch(`${base}/me`, {
      headers: { 'X-Session-Token': token }
    })
    const data = await res.json().catch(() => ({}))
    return res.ok && data.authenticated
  } catch {
    return false
  }
}

export async function getUserRole() {
  return await SecureStore.getItemAsync('user_role') || 'admin'
}

export async function logout() {
  await SecureStore.deleteItemAsync('session_token')
  await SecureStore.deleteItemAsync('user_role')
}

export async function addBeneficiaries(items: any[]) { return await authFetch('/beneficiaries', { method: 'POST', body: JSON.stringify(items) }) }
export async function listBeneficiaries() { return await authFetch('/beneficiaries') }
export async function findBeneficiaryByCPF(cpf: string) { return await authFetch(`/beneficiaries/cpf?cpf=${encodeURIComponent(cpf)}`) }
export async function updateBeneficiary(uuid: string, body: any) { return await authFetch(`/beneficiaries/${encodeURIComponent(uuid)}`, { method: 'PUT', body: JSON.stringify(body) }) }
export async function reactivateBeneficiary(uuid: string) { return await authFetch(`/beneficiaries/${encodeURIComponent(uuid)}/reactivate`, { method: 'PUT' }) }
export async function deleteBeneficiary(uuid: string) { return await authFetch(`/beneficiaries/${encodeURIComponent(uuid)}`, { method: 'DELETE' }) }
export async function requestAppointment(uuid: string) { return await authFetch(`/beneficiaries/${encodeURIComponent(uuid)}/request-appointment`) }
export async function listSpecialties() { return await authFetch('/specialties') }
export async function listAvailability(params: Record<string,string>) {
  const qs = new URLSearchParams(params).toString()
  return await authFetch(`/specialty-availability?${qs}`)
}
export async function listReferrals(uuid: string) { return await authFetch(`/beneficiaries/${encodeURIComponent(uuid)}/medical-referrals`) }
export async function scheduleAppointment(body: any) { return await authFetch('/appointments', { method: 'POST', body: JSON.stringify(body) }) }
export async function listAppointments() { return await authFetch('/appointments') }
export async function cancelAppointment(uuid: string) { return await authFetch(`/appointments/${encodeURIComponent(uuid)}`, { method: 'DELETE' }) }