const store = {
  loadAppointments() {
    try { return JSON.parse(localStorage.getItem('appointments') || '[]'); } catch { return []; }
  },
  saveAppointments(list) {
    localStorage.setItem('appointments', JSON.stringify(list || []));
  }
};

function setStatus(msg, type) {
  const el = document.getElementById('status');
  el.textContent = msg || '';
  el.className = type ? `status ${type}` : 'status';
  
  // Auto-hide success messages after 3 seconds
  if (type === 'success') {
    setTimeout(() => {
      el.textContent = '';
      el.className = 'status';
    }, 3000);
  }
}

function showLoading(elementId, show = true) {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.opacity = show ? '0.6' : '1';
    element.style.pointerEvents = show ? 'none' : 'auto';
  }
}

function formatErrorMessage(error) {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.details) {
    try {
      return `${error.message}: ${JSON.stringify(error.details)}`;
    } catch {
      return error.message;
    }
  }
  return 'Erro desconhecido';
}

function mapSpecialtyToServiceType(s) {
  if (s === 'PSICOLOGIA') return 'P';
  if (s === 'NUTRICAO') return 'GS';
  return 'G';
}
function onlyDigits(v) { return (v || '').replace(/\D+/g, ''); }
function validCPF(v) {
  const cpf = onlyDigits(v);
  if (!/^\d{11}$/.test(cpf)) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0; for (let i=0;i<9;i++) sum += parseInt(cpf[i]) * (10 - i);
  let d1 = 11 - (sum % 11); if (d1 >= 10) d1 = 0; if (d1 !== parseInt(cpf[9])) return false;
  sum = 0; for (let i=0;i<10;i++) sum += parseInt(cpf[i]) * (11 - i);
  let d2 = 11 - (sum % 11); if (d2 >= 10) d2 = 0; if (d2 !== parseInt(cpf[10])) return false;
  return true;
}
function validDateISO(v) { return /^\d{4}-\d{2}-\d{2}$/.test(v); }
function validEmail(v) { return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function validPhone(v) { const d = onlyDigits(v); return !d || /^\d{10,11}$/.test(d); }
function validCEP(v) { const d = onlyDigits(v); return !d || /^\d{8}$/.test(d); }
function validUUID(v) { return /^[0-9a-fA-F-]{32,36}$/.test(v); }
function formatCPF(v){ const d=onlyDigits(v).slice(0,11); return d.replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2'); }
function formatCEP(v){ const d=onlyDigits(v).slice(0,8); return d.replace(/(\d{5})(\d{1,3})/,'$1-$2'); }
function formatPhone(v){ const d=onlyDigits(v).slice(0,11); if(d.length<=10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/,'($1) $2-$3'); return d.replace(/(\d{2})(\d{5})(\d{0,4})/,'($1) $2-$3'); }

async function checkAuth() {
  try {
    const res = await fetch('/api/me');
    const data = await res.json().catch(() => ({}));
    return res.ok && data.authenticated;
  } catch {
    return false;
  }
}

async function login(email, password) {
  const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Falha na autenticação');
  if (data.token) {
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('user_role', 'admin'); // Assume admin for web version
  }
  return data;
}

async function addBeneficiary(payload) {
  const res = await fetch('/api/beneficiaries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify([payload]) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMessage = data.message || 'Erro ao cadastrar beneficiário';
    const details = data.details ? ` (${JSON.stringify(data.details)})` : '';
    throw new Error(`${errorMessage}${details}`);
  }
  return data;
}

async function requestAppointment(uuid) {
  const res = await fetch(`/api/beneficiaries/${encodeURIComponent(uuid)}/request-appointment`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Erro ao solicitar atendimento');
  return data;
}

async function scheduleAppointment(payload) {
  const res = await fetch('/api/appointments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Erro ao agendar');
  return data;
}
async function listBeneficiaries() {
  const r = await fetch('/api/beneficiaries');
  const d = await r.json().catch(() => ({ beneficiaries: [] }));
  if (!r.ok) throw new Error(d.message || 'Erro ao listar beneficiários');
  return d;
}
async function findBeneficiaryByCPF(cpf) {
  const r = await fetch(`/api/beneficiaries/cpf?cpf=${encodeURIComponent(cpf)}`);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.message || 'Erro ao buscar CPF');
  return d;
}
async function reactivateBeneficiary(uuid) {
  const r = await fetch(`/api/beneficiaries/${encodeURIComponent(uuid)}/reactivate`, { method: 'PUT' });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.message || 'Erro ao reativar');
  return d;
}
async function updateBeneficiary(uuid, body) {
  const r = await fetch(`/api/beneficiaries/${encodeURIComponent(uuid)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.message || 'Erro ao atualizar');
  return d;
}
async function listBeneficiaryAppointments(uuid) {
  const r = await fetch(`/api/beneficiaries/${encodeURIComponent(uuid)}/appointments`);
  const d = await r.json().catch(() => ({ appointments: [] }));
  if (!r.ok) throw new Error(d.message || 'Erro ao listar consultas');
  return d;
}

async function deleteBeneficiary(uuid) {
  const res = await fetch(`/api/beneficiaries/${encodeURIComponent(uuid)}`, { method: 'DELETE' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Erro ao inativar beneficiário');
  return data;
}

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('login-form');
  const btn = document.getElementById('login-button');
  const buttonText = btn.querySelector('.button-text');
  const buttonLoading = btn.querySelector('.button-loading');
  const dashboard = document.getElementById('dashboard');
  const logout = document.getElementById('logout-button');
  
  // Check for existing session on load
  const isAuthenticated = await checkAuth();
  if (isAuthenticated) {
    dashboard.hidden = false;
    form.hidden = true;
    applyRoleTabs();
  }
  
  let currentRole = localStorage.getItem('user_role') || 'admin';
  const rolePacienteBtn = document.getElementById('role-paciente');
  const roleAdminBtn = document.getElementById('role-admin');
  
  function updateRoleUI() {
    if (rolePacienteBtn && roleAdminBtn) {
      if (currentRole === 'paciente') {
        rolePacienteBtn.classList.add('tab','active');
        roleAdminBtn.classList.remove('active');
      } else {
        roleAdminBtn.classList.add('tab','active');
        rolePacienteBtn.classList.remove('active');
      }
    }
    localStorage.setItem('user_role', currentRole);
    applyRoleTabs();
  }
  
  if (rolePacienteBtn) rolePacienteBtn.addEventListener('click', () => { currentRole = 'paciente'; updateRoleUI(); });
  if (roleAdminBtn) roleAdminBtn.addEventListener('click', () => { currentRole = 'admin'; updateRoleUI(); });
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('Autenticando...', '');
    btn.disabled = true;
    buttonText.style.display = 'none';
    buttonLoading.style.display = 'inline';
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    try {
      const result = await login(email, password);
      setStatus('Login realizado com sucesso!', 'success');
      dashboard.hidden = false;
      form.hidden = true;
      applyRoleTabs();
    } catch (err) {
      setStatus(err.message, 'error');
    } finally {
      btn.disabled = false;
      buttonText.style.display = 'inline';
      buttonLoading.style.display = 'none';
    }
  });

  logout.addEventListener('click', () => {
    fetch('/api/logout', { method: 'POST' }).finally(() => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_role');
      dashboard.hidden = true;
      form.hidden = false;
    });
  });

  const tabs = Array.from(document.querySelectorAll('.tab'));
  tabs.forEach((t) => {
    t.addEventListener('click', () => {
      tabs.forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      const target = t.getAttribute('data-target');
      Array.from(document.querySelectorAll('.tab-content')).forEach(c => c.hidden = c.id !== target);
    });
  });

  function applyRoleTabs() {
    const showForPatient = ['tab-appointment','tab-schedule'];
    const showForAdmin = ['tab-create','tab-beneficiaries','tab-delete'];
    const showSet = currentRole === 'paciente' ? showForPatient : showForAdmin;
    const allButtons = Array.from(document.querySelectorAll('.tabs .tab'));
    const allContents = Array.from(document.querySelectorAll('.tab-content'));
    allButtons.forEach(b => { const tgt = b.getAttribute('data-target'); b.style.display = showSet.includes(tgt) ? '' : 'none'; });
    allContents.forEach(c => { c.hidden = !showSet.includes(c.id); });
    const firstVisible = allButtons.find(b => b.style.display !== 'none');
    if (firstVisible) { firstVisible.click(); }
  }

  const iCPF = document.getElementById('b-cpf');
  const iPhone = document.getElementById('b-phone');
  const iCEP = document.getElementById('b-zip');
  if (iCPF) iCPF.addEventListener('input', () => { iCPF.value = formatCPF(iCPF.value); });
  if (iPhone) iPhone.addEventListener('input', () => { iPhone.value = formatPhone(iPhone.value); });
  if (iCEP) iCEP.addEventListener('input', () => { iCEP.value = formatCEP(iCEP.value); });

  const bStatus = document.getElementById('beneficiary-status');
  const bAdd = document.getElementById('beneficiary-add');
  const bReset = document.getElementById('beneficiary-reset');
  const bSubmit = document.getElementById('beneficiary-submit');
  const bList = document.getElementById('beneficiary-list');
  const bItems = [];
  function renderBList() {
    bList.innerHTML = '';
    bItems.forEach((item, idx) => {
      const el = document.createElement('div');
      el.className = 'list-item';
      const text = document.createElement('div');
      text.textContent = `${item.name} • CPF ${item.cpf} • ${item.birthday}`;
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = item.email || 'sem email';
      const remove = document.createElement('button');
      remove.className = 'copy';
      remove.textContent = 'Remover';
      remove.addEventListener('click', () => { bItems.splice(idx, 1); renderBList(); });
      el.appendChild(text);
      el.appendChild(badge);
      el.appendChild(remove);
      bList.appendChild(el);
    });
  }
  bAdd.addEventListener('click', (e) => {
    e.preventDefault();
    const item = {
      name: document.getElementById('b-name').value.trim(),
      cpf: document.getElementById('b-cpf').value.trim(),
      birthday: document.getElementById('b-birthday').value.trim(),
      email: document.getElementById('b-email').value.trim() || undefined,
      phone: document.getElementById('b-phone').value.trim() || undefined,
      zipCode: document.getElementById('b-zip').value.trim() || undefined,
      paymentType: document.getElementById('b-payment').value,
      serviceType: document.getElementById('b-service').value,
      holder: document.getElementById('b-holder').value.trim() || undefined,
      general: document.getElementById('b-general').value.trim() || undefined,
    };
    if (!item.name || !item.cpf || !item.birthday) { bStatus.textContent = 'Preencha Nome, CPF e Nascimento'; bStatus.className = 'status error'; return; }
    if (!validCPF(item.cpf)) { bStatus.textContent = 'CPF inválido'; bStatus.className = 'status error'; return; }
    if (!validDateISO(item.birthday)) { bStatus.textContent = 'Nascimento inválido (yyyy-MM-dd)'; bStatus.className = 'status error'; return; }
    if (!validEmail(item.email)) { bStatus.textContent = 'Email inválido'; bStatus.className = 'status error'; return; }
    if (!validPhone(item.phone)) { bStatus.textContent = 'Telefone inválido'; bStatus.className = 'status error'; return; }
    if (!validCEP(item.zipCode)) { bStatus.textContent = 'CEP inválido'; bStatus.className = 'status error'; return; }
    bItems.push(item);
    renderBList();
  });
  bReset.addEventListener('click', (e) => {
    e.preventDefault();
    ['b-name','b-cpf','b-birthday','b-email','b-phone','b-zip','b-holder','b-general'].forEach(id => { const el = document.getElementById(id); if (el) el.value=''; });
  });
  bSubmit.addEventListener('click', async (e) => {
    e.preventDefault();
    
    if (bItems.length === 0) {
      setStatus('Adicione pelo menos um beneficiário', 'error');
      return;
    }
    
    setStatus('Enviando beneficiários...', '');
    showLoading('beneficiary-form', true);
    bSubmit.disabled = true;
    
    try {
      const res = await fetch('/api/beneficiaries', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(bItems) 
      });
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        const errorMsg = formatErrorMessage(data);
        throw new Error(errorMsg);
      }
      
      setStatus(`✅ ${data.count || bItems.length} beneficiário(s) cadastrado(s) com sucesso!`, 'success');
      
      if (Array.isArray(data.beneficiaries)) {
        data.beneficiaries.forEach(b => {
          const el = document.createElement('div');
          el.className = 'list-item success-item';
          const text = document.createElement('div');
          text.textContent = `✅ CPF ${b.cpf} • UUID ${b.uuid}`;
          const copy = document.createElement('button');
          copy.className = 'copy';
          copy.textContent = 'Copiar UUID';
          copy.addEventListener('click', () => {
            navigator.clipboard.writeText(b.uuid);
            copy.textContent = 'Copiado!';
            setTimeout(() => copy.textContent = 'Copiar UUID', 2000);
          });
          el.appendChild(text);
          el.appendChild(copy);
          bList.appendChild(el);
        });
      }
      
      // Clear form after successful submission
      bItems.length = 0;
      renderBList();
      
      // Clear input fields
      ['b-name','b-cpf','b-birthday','b-email','b-phone','b-zip','b-holder','b-general'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      
    } catch (err) {
      setStatus(`❌ Erro: ${err.message}`, 'error');
      console.error('Beneficiary creation error:', err);
    } finally { 
      bSubmit.disabled = false;
      showLoading('beneficiary-form', false);
    }
  });

  const aForm = document.getElementById('appointment-form');
  const aStatus = document.getElementById('appointment-status');
  const aUrl = document.getElementById('appointment-url');
  aForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    aStatus.textContent = 'Solicitando...';
    aStatus.className = 'status';
    aUrl.textContent = '';
    aUrl.href = '#';
    const uuid = document.getElementById('a-uuid').value.trim();
    try {
      const data = await requestAppointment(uuid);
      aStatus.textContent = 'URL gerada';
      aStatus.className = 'status success';
      if (data.url) {
        aUrl.textContent = 'Abrir atendimento';
        aUrl.href = data.url;
      }
    } catch (err) {
      aStatus.textContent = err.message;
      aStatus.className = 'status error';
    }
  });

  const dForm = document.getElementById('delete-form');
  const dStatus = document.getElementById('delete-status');
  dForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    dStatus.textContent = 'Inativando...';
    dStatus.className = 'status';
    const uuid = document.getElementById('d-uuid').value.trim();
    try {
      const data = await deleteBeneficiary(uuid);
      dStatus.textContent = 'Beneficiário inativado';
      dStatus.className = 'status success';
    } catch (err) {
      dStatus.textContent = err.message;
      dStatus.className = 'status error';
    }
  });
  const sUuid = document.getElementById('s-uuid');
  const sType = document.getElementById('s-type');
  const sSpecialtyUuid = document.getElementById('s-specialty-uuid');
  const sAvailabilityUuid = document.getElementById('s-availability-uuid');
  const sReferralUuid = document.getElementById('s-referral-uuid');
  const loadReferralsBtn = document.getElementById('load-referrals');
  const selectReferrals = document.getElementById('select-referrals');
  const sApprove = document.getElementById('s-approve');
  const sStatus = document.getElementById('schedule-status');
  const sSchedule = document.getElementById('schedule-button');
  const sConfirm = document.getElementById('confirm-button');
  const tContainer = document.getElementById('appointments-table');
  const fUuid = document.getElementById('filter-uuid');
  const fSpec = document.getElementById('filter-specialty');
  const fApply = document.getElementById('filter-apply');
  const loadSpecsBtn = document.getElementById('load-specialties');
  const selectSpec = document.getElementById('select-specialty');
  const loadAvailBtn = document.getElementById('load-availability');
  const selectAvail = document.getElementById('select-availability');
  const dateInitial = document.getElementById('date-initial');
  const dateFinal = document.getElementById('date-final');
  const specialtySearch = document.getElementById('specialty-search');
  const loadAppointmentsBtn = document.getElementById('load-appointments');
  const allAppointments = document.getElementById('all-appointments');

  let appointments = store.loadAppointments();
  let specialtiesCache = [];
  let beneficiariesCache = [];

  function renderAppointments(filter) {
    tContainer.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'table-row table-header';
    header.innerHTML = '<div>UUID</div><div>Especialidade</div><div>Status</div><div>Ações</div>';
    tContainer.appendChild(header);
    appointments
      .filter(a => !filter || (
        (!filter.uuid || a.uuid.includes(filter.uuid)) &&
        (!filter.specialty || a.specialty === filter.specialty)
      ))
      .forEach(a => {
        const row = document.createElement('div');
        row.className = 'table-row';
        const uuid = document.createElement('div'); uuid.textContent = a.uuid;
        const spec = document.createElement('div'); spec.textContent = a.specialty;
        const status = document.createElement('div'); status.textContent = a.status;
        const actions = document.createElement('div');
        const open = document.createElement('button'); open.className = 'copy'; open.textContent = 'Abrir'; open.addEventListener('click', () => { if (a.url) window.open(a.url, '_blank'); });
        const copy = document.createElement('button'); copy.className = 'copy'; copy.textContent = 'Copiar URL'; copy.addEventListener('click', () => { if (a.url) navigator.clipboard.writeText(a.url); });
        const remove = document.createElement('button'); remove.className = 'copy'; remove.textContent = 'Remover'; remove.addEventListener('click', () => { appointments = appointments.filter(x => x !== a); store.saveAppointments(appointments); renderAppointments(); });
        actions.appendChild(open); actions.appendChild(copy); actions.appendChild(remove);
        row.appendChild(uuid); row.appendChild(spec); row.appendChild(status); row.appendChild(actions);
        tContainer.appendChild(row);
      });
  }

  function renderAllAppointments(items) {
    allAppointments.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'table-row table-header';
    header.innerHTML = '<div>UUID</div><div>Beneficiário</div><div>Status</div><div>Ações</div>';
    allAppointments.appendChild(header);
    (items || []).forEach(a => {
      const row = document.createElement('div');
      row.className = 'table-row';
      const uuid = document.createElement('div'); uuid.textContent = a.uuid || '';
      const ben = document.createElement('div'); ben.textContent = a.beneficiary?.uuid || '';
      const status = document.createElement('div'); status.textContent = a.status || '';
      const actions = document.createElement('div');
      const open = document.createElement('button'); open.className = 'copy'; open.textContent = 'Abrir'; open.addEventListener('click', () => { if (a.beneficiaryUrl) window.open(a.beneficiaryUrl, '_blank'); });
      const cancel = document.createElement('button'); cancel.className = 'copy'; cancel.textContent = 'Cancelar'; cancel.addEventListener('click', async () => { try { await cancelAppointment(a.uuid); renderAllAppointments((items || []).filter(x => x.uuid !== a.uuid)); } catch (err) { } });
      actions.appendChild(open); actions.appendChild(cancel);
      row.appendChild(uuid); row.appendChild(ben); row.appendChild(status); row.appendChild(actions);
      allAppointments.appendChild(row);
    });
  }

  renderAppointments();
  fApply.addEventListener('click', (e) => {
    e.preventDefault();
    renderAppointments({ uuid: fUuid.value.trim(), specialty: fSpec.value.trim() });
  });

  async function loadSpecialties() {
    const r = await fetch('/api/specialties');
    const d = await r.json().catch(() => ({ specialties: [] }));
    selectSpec.innerHTML = '';
    specialtiesCache = d.specialties || d.data || [];
    specialtiesCache.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.uuid || s.specialtyUuid || '';
      opt.textContent = s.name || s.specialty || opt.value;
      selectSpec.appendChild(opt);
    });
  }
  function filterSpecialties(text) {
    selectSpec.innerHTML = '';
    (specialtiesCache || [])
      .filter(s => !text || (s.name || '').toLowerCase().includes(text.toLowerCase()))
      .forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.uuid || s.specialtyUuid || '';
        opt.textContent = s.name || s.specialty || opt.value;
        selectSpec.appendChild(opt);
      });
  }
  async function loadAvailability() {
    const specUuid = selectSpec.value.trim();
    const di = dateInitial.value.trim();
    const df = dateFinal.value.trim();
    const bu = sUuid.value.trim();
    const qs = new URLSearchParams({ specialtyUuid: specUuid, dateInitial: di, dateFinal: df, beneficiaryUuid: bu });
    const r = await fetch(`/api/specialty-availability?${qs.toString()}`);
    const d = await r.json().catch(() => ({ items: [] }));
    selectAvail.innerHTML = '';
    const items = d.items || d.availability || d.data || [];
    items.forEach(av => {
      const opt = document.createElement('option');
      opt.value = av.uuid || av.detail?.uuid || '';
      const date = av.date || av.detail?.date || '';
      const from = av.from || av.detail?.from || '';
      const to = av.to || av.detail?.to || '';
      opt.textContent = `${date} ${from}-${to}`.trim();
      selectAvail.appendChild(opt);
    });
  }
  loadSpecsBtn.addEventListener('click', (e) => { e.preventDefault(); loadSpecialties(); });
  if (specialtySearch) specialtySearch.addEventListener('input', () => { filterSpecialties(specialtySearch.value.trim()); });
  loadAvailBtn.addEventListener('click', (e) => { e.preventDefault(); loadAvailability(); sSpecialtyUuid.value = selectSpec.value; sAvailabilityUuid.value = selectAvail.value; });
  loadReferralsBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const bu = sUuid.value.trim();
    if (!bu || !validUUID(bu)) { sStatus.textContent = 'UUID do beneficiário inválido'; sStatus.className = 'status error'; return; }
    const r = await fetch(`/api/beneficiaries/${encodeURIComponent(bu)}/medical-referrals`);
    const d = await r.json().catch(() => ({ referrals: [] }));
    selectReferrals.innerHTML = '';
    const items = d.referrals || d.data || [];
    items.forEach(mr => {
      const opt = document.createElement('option');
      opt.value = mr.uuid || '';
      opt.textContent = mr.name ? `${mr.name} (${opt.value})` : opt.value;
      selectReferrals.appendChild(opt);
    });
    if (selectReferrals.value) sReferralUuid.value = selectReferrals.value;
  });
  loadAppointmentsBtn.addEventListener('click', async (e) => { e.preventDefault(); try { const d = await listAppointments(); const items = d.appointments || d.data || []; renderAllAppointments(items); } catch (err) { } });

  sSchedule.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const uuid = sUuid.value.trim();
    const type = sType.value;
    const specialtyUuid = sSpecialtyUuid.value.trim();
    const availabilityUuid = sAvailabilityUuid.value.trim();
    const referralUuid = sReferralUuid.value.trim();
    const approve = !!sApprove.checked;
    
    // Validate inputs
    if (!uuid || !validUUID(uuid)) {
      setStatus('UUID do beneficiário inválido', 'error');
      return;
    }
    if (!specialtyUuid || !validUUID(specialtyUuid)) {
      setStatus('UUID da especialidade inválido', 'error');
      return;
    }
    if (!availabilityUuid || !validUUID(availabilityUuid)) {
      setStatus('UUID da disponibilidade inválido', 'error');
      return;
    }
    
    // Business logic validation
    if (type === 'MEDICA' && (!referralUuid || !validUUID(referralUuid))) {
      setStatus('Encaminhamento obrigatório para especialidade médica. Solicite atendimento clínico imediato antes.', 'error');
      return;
    }
    
    setStatus('Agendando consulta...', '');
    showLoading('schedule-form', true);
    sSchedule.disabled = true;
    
    const payload = { 
      beneficiaryUuid: uuid, 
      availabilityUuid, 
      specialtyUuid, 
      approveAdditionalPayment: approve 
    };
    
    if (type === 'MEDICA') {
      payload.beneficiaryMedicalReferralUuid = referralUuid;
    }
    
    try {
      const data = await scheduleAppointment(payload);
      const record = { 
        uuid, 
        specialty: type, 
        appointmentUuid: data.appointment?.uuid || data.uuid || '', 
        url: data.beneficiaryUrl || data.appointment?.beneficiaryUrl || '', 
        status: 'scheduled', 
        createdAt: Date.now(),
        requiresReferral: data.requiresReferral || false
      };
      
      appointments.push(record);
      store.saveAppointments(appointments);
      renderAppointments();
      
      setStatus('✅ Consulta agendada com sucesso!', 'success');
      
      // Clear form after successful scheduling
      sUuid.value = '';
      sSpecialtyUuid.value = '';
      sAvailabilityUuid.value = '';
      sReferralUuid.value = '';
      sApprove.checked = false;
      
    } catch (err) {
      const errorMsg = formatErrorMessage(err);
      setStatus(`❌ Erro ao agendar: ${errorMsg}`, 'error');
      console.error('Appointment scheduling error:', err);
    } finally { 
      sSchedule.disabled = false;
      showLoading('schedule-form', false);
    }
  });

  sConfirm.addEventListener('click', (e) => {
    e.preventDefault();
    sStatus.textContent = 'Confirmando...';
    sStatus.className = 'status';
    sConfirm.disabled = true;
    const uuid = sUuid.value.trim();
    const idx = appointments.findIndex(a => a.uuid === uuid);
    if (idx < 0) { sStatus.textContent = 'UUID não encontrado'; sStatus.className = 'status error'; sConfirm.disabled = false; return; }
    appointments[idx].status = 'confirmed';
    store.saveAppointments(appointments);
    renderAppointments();
    sStatus.textContent = 'Confirmado';
    sStatus.className = 'status success';
    sConfirm.disabled = false;
  });
});
  const benCPF = document.getElementById('ben-cpf');
  const benFind = document.getElementById('ben-find');
  const benLoad = document.getElementById('ben-load');
  const benTable = document.getElementById('ben-table');
  const benSelected = document.getElementById('ben-selected');
  const benEmail = document.getElementById('ben-email');
  const benPhone = document.getElementById('ben-phone');
  const benZip = document.getElementById('ben-zip');
  const benAddress = document.getElementById('ben-address');
  const benCity = document.getElementById('ben-city');
  const benState = document.getElementById('ben-state');
  const benSave = document.getElementById('ben-save');
  const benStatus = document.getElementById('ben-status');
  function renderBeneficiaries(items) {
    benTable.innerHTML = '';
    const header = document.createElement('div');
    header.className = 'table-row table-header';
    header.innerHTML = '<div>Nome</div><div>UUID</div><div>Status</div><div>Ações</div>';
    benTable.appendChild(header);
    beneficiariesCache = items || [];
    beneficiariesCache.forEach(b => {
      const row = document.createElement('div');
      row.className = 'table-row';
      const name = document.createElement('div'); name.textContent = b.name || '';
      const uuid = document.createElement('div'); uuid.textContent = b.uuid || '';
      const status = document.createElement('div'); status.textContent = b.isActive === false ? 'inativo' : 'ativo';
      const actions = document.createElement('div');
      const sel = document.createElement('button'); sel.className = 'copy'; sel.textContent = 'Selecionar'; sel.addEventListener('click', () => { benSelected.value = b.uuid || ''; benEmail.value = b.email || ''; benPhone.value = b.phone || ''; benZip.value = b.zipCode || ''; benAddress.value = b.address || ''; benCity.value = b.city || ''; benState.value = b.state || ''; });
      const react = document.createElement('button'); react.className = 'copy'; react.textContent = 'Reativar'; react.addEventListener('click', async () => { try { benStatus.textContent = 'Reativando...'; benStatus.className = 'status'; await reactivateBeneficiary(b.uuid); benStatus.textContent = 'Reativado'; benStatus.className = 'status success'; } catch (err) { benStatus.textContent = err.message; benStatus.className = 'status error'; } });
      const apps = document.createElement('button'); apps.className = 'copy'; apps.textContent = 'Consultas'; apps.addEventListener('click', async () => { try { benStatus.textContent = 'Listando consultas...'; benStatus.className = 'status'; const d = await listBeneficiaryAppointments(b.uuid); const list = Array.isArray(d.appointments) ? d.appointments : (d.data || []); tContainer.innerHTML=''; renderAppointments(); benStatus.textContent = `Consultas: ${list.length}`; benStatus.className = 'status success'; } catch (err) { benStatus.textContent = err.message; benStatus.className = 'status error'; } });
      actions.appendChild(sel); actions.appendChild(react); actions.appendChild(apps);
      row.appendChild(name); row.appendChild(uuid); row.appendChild(status); row.appendChild(actions);
      benTable.appendChild(row);
    });
  }
  function applyBeneficiaryStatusFilter(value) {
    const src = beneficiariesCache || [];
    const filtered = src.filter(b => {
      if (!value) return true;
      const inactive = b.isActive === false;
      return value === 'inativo' ? inactive : !inactive;
    });
    renderBeneficiaries(filtered);
  }

  benFind.addEventListener('click', async (e) => { e.preventDefault(); try { benStatus.textContent = 'Buscando...'; benStatus.className = 'status'; const d = await findBeneficiaryByCPF(onlyDigits(benCPF.value)); renderBeneficiaries(Array.isArray(d.beneficiaries) ? d.beneficiaries : (d.data ? [d.data] : [])); benStatus.textContent = 'Busca concluída'; benStatus.className = 'status success'; } catch (err) { benStatus.textContent = err.message; benStatus.className = 'status error'; } });
  benLoad.addEventListener('click', async (e) => { e.preventDefault(); try { benStatus.textContent = 'Carregando...'; benStatus.className = 'status'; const d = await listBeneficiaries(); renderBeneficiaries(d.beneficiaries || d.data || []); benStatus.textContent = 'Carregado'; benStatus.className = 'status success'; } catch (err) { benStatus.textContent = err.message; benStatus.className = 'status error'; } });
  const benFilterStatus = document.getElementById('ben-filter-status');
  benFilterStatus.addEventListener('change', (e) => { applyBeneficiaryStatusFilter(benFilterStatus.value); });
  const benLoadInactive = document.getElementById('ben-load-inactive');
  benLoadInactive.addEventListener('click', async (e) => { e.preventDefault(); try { benStatus.textContent = 'Carregando inativos...'; benStatus.className = 'status'; const d = await listBeneficiaries(); const items = (d.beneficiaries || d.data || []).filter(x => x.isActive === false); renderBeneficiaries(items); benStatus.textContent = 'Inativos carregados'; benStatus.className = 'status success'; } catch (err) { benStatus.textContent = err.message; benStatus.className = 'status error'; } });
  const benReactivateSelected = document.getElementById('ben-reactivate-selected');
  benReactivateSelected.addEventListener('click', async (e) => { e.preventDefault(); const u = benSelected.value.trim(); if (!u) { benStatus.textContent = 'Selecione um beneficiário'; benStatus.className = 'status error'; return; } try { benStatus.textContent = 'Reativando...'; benStatus.className = 'status'; await reactivateBeneficiary(u); benStatus.textContent = 'Reativado'; benStatus.className = 'status success'; } catch (err) { benStatus.textContent = err.message; benStatus.className = 'status error'; } });
  benSave.addEventListener('click', async (e) => { e.preventDefault(); const u = benSelected.value.trim(); if (!u) { benStatus.textContent = 'Selecione um beneficiário'; benStatus.className = 'status error'; return; } const body = { email: benEmail.value.trim() || undefined, phone: onlyDigits(benPhone.value) || undefined, zipCode: onlyDigits(benZip.value) || undefined, address: benAddress.value.trim() || undefined, city: benCity.value.trim() || undefined, state: benState.value.trim().toUpperCase() || undefined }; try { benStatus.textContent = 'Atualizando...'; benStatus.className = 'status'; await updateBeneficiary(u, body); benStatus.textContent = 'Atualizado'; benStatus.className = 'status success'; } catch (err) { benStatus.textContent = err.message; benStatus.className = 'status error'; } });
async function listAppointments() {
  const r = await fetch('/api/appointments');
  const d = await r.json().catch(() => ({ appointments: [] }));
  if (!r.ok) throw new Error(d.message || 'Erro ao listar agendamentos');
  return d;
}
async function cancelAppointment(uuid) {
  const r = await fetch(`/api/appointments/${encodeURIComponent(uuid)}`, { method: 'DELETE' });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.message || 'Erro ao cancelar agendamento');
  return d;
}