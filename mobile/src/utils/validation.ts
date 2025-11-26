export function onlyDigits(v: string) { return (v || '').replace(/\D+/g, '') }
export function validCPF(v: string) {
  const cpf = onlyDigits(v)
  if (!/^\d{11}$/.test(cpf)) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false
  let sum = 0; for (let i=0;i<9;i++) sum += parseInt(cpf[i]) * (10 - i)
  let d1 = 11 - (sum % 11); if (d1 >= 10) d1 = 0; if (d1 !== parseInt(cpf[9])) return false
  sum = 0; for (let i=0;i<10;i++) sum += parseInt(cpf[i]) * (11 - i)
  let d2 = 11 - (sum % 11); if (d2 >= 10) d2 = 0; if (d2 !== parseInt(cpf[10])) return false
  return true
}
export function validDateISO(v: string) { return /^\d{4}-\d{2}-\d{2}$/.test(v) }
export function validEmail(v?: string) { return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) }
export function validPhone(v?: string) { const d = onlyDigits(v || ''); return !d || /^\d{10,11}$/.test(d) }
export function validCEP(v?: string) { const d = onlyDigits(v || ''); return !d || /^\d{8}$/.test(d) }
export function validUUID(v: string) { return /^[0-9a-fA-F-]{32,36}$/.test(v) }
export function formatCPF(v: string){ const d=onlyDigits(v).slice(0,11); return d.replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2') }
export function formatCEP(v: string){ const d=onlyDigits(v).slice(0,8); return d.replace(/(\d{5})(\d{1,3})/,'$1-$2') }
export function formatPhone(v: string){ const d=onlyDigits(v).slice(0,11); if(d.length<=10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/,'($1) $2-$3'); return d.replace(/(\d{2})(\d{5})(\d{0,4})/,'($1) $2-$3') }