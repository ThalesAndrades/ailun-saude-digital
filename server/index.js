const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config({ path: process.env.ENV_FILE || '.env' });
const fetch = require('node-fetch');
const { z } = require('zod');

const app = express();
const PORT = process.env.PORT || 3000;
const RAPIDOC_BASE_URL = process.env.RAPIDOC_BASE_URL || 'https://api.rapidoc.tech';
const RAPIDOC_CLIENT_ID = process.env.RAPIDOC_CLIENT_ID || '';
const RAPIDOC_TOKEN = process.env.RAPIDOC_TOKEN || '';
const COOKIE_SECURE = String(process.env.COOKIE_SECURE).toLowerCase() === 'true';
const TRUST_PROXY = ['true','1','yes'].includes(String(process.env.TRUST_PROXY).toLowerCase());
const CORS_ORIGIN = process.env.CORS_ORIGIN || '';
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '120', 10);

app.use(helmet());
const corsOrigin = CORS_ORIGIN ? CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean) : true;
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(rateLimit({ windowMs: RATE_LIMIT_WINDOW_MS, max: RATE_LIMIT_MAX }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
if (TRUST_PROXY) app.set('trust proxy', 1);

function rapidocHeaders(contentType, sessionToken) {
  const h = {
    clientId: RAPIDOC_CLIENT_ID,
    Authorization: `Bearer ${RAPIDOC_TOKEN}`,
  };
  if (contentType) h['Content-Type'] = contentType;
  if (sessionToken) h['X-Session-Token'] = sessionToken;
  return h;
}
function requireAuth(req, res, next) {
  const s = req.cookies.session || req.headers['x-session-token'];
  if (!s) return res.status(401).json({ message: 'Não autenticado', code: 'UNAUTHORIZED', timestamp: new Date().toISOString() });
  req.sessionToken = s;
  next();
}

function errorResponse(res, status, message, code = null, details = null) {
  return res.status(status).json({
    message,
    code: code || `ERROR_${status}`,
    timestamp: new Date().toISOString(),
    ...(details && { details })
  });
}
const BeneficiarySchema = z.object({
  name: z.string().min(1),
  cpf: z.string().regex(/^\d{11}$/),
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  phone: z.string().regex(/^\d{10,11}$/).optional(),
  email: z.string().email().optional(),
  zipCode: z.string().regex(/^\d{8}$/).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  paymentType: z.enum(['S','A']).optional(),
  serviceType: z.enum(['G','P','GP','GS','GSP']).optional(),
  holder: z.string().regex(/^\d{11}$/).optional(),
  general: z.string().optional(),
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return errorResponse(res, 400, 'Email e senha são obrigatórios', 'MISSING_CREDENTIALS');
    }
    
    // Mock login for test environment
    if (process.env.NODE_ENV === 'test' || (RAPIDOC_CLIENT_ID === 'test_client_id')) {
      const mockToken = 'mock_session_token_' + Date.now();
      const mockUser = {
        uuid: 'test-user-uuid',
        name: 'Test User',
        email: email,
        role: email.includes('admin') ? 'admin' : 'patient'
      };
      
      res.cookie('session', mockToken, { 
        httpOnly: true, 
        sameSite: 'strict', 
        secure: COOKIE_SECURE,
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
      });
      
      return res.json({
        success: true,
        token: mockToken,
        user: mockUser,
        timestamp: new Date().toISOString()
      });
    }
    
    const url = `${RAPIDOC_BASE_URL}/login`;
    const r = await fetch(url, {
      method: 'POST',
      headers: rapidocHeaders('application/json'),
      body: JSON.stringify({ email, password }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return errorResponse(res, r.status, data.message || 'Falha na autenticação', 'AUTH_FAILED', data);
    }
    if (data.token) {
      res.cookie('session', data.token, { 
        httpOnly: true, 
        sameSite: 'strict', 
        secure: COOKIE_SECURE,
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
      });
    }
    res.json({
      success: true,
      token: data.token,
      user: data.user || null,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Login error:', err);
    errorResponse(res, 500, 'Erro ao autenticar', 'AUTH_ERROR', err.message);
  }
});
app.post('/api/logout', (req, res) => {
  res.clearCookie('session');
  res.json({ 
    success: true, 
    message: 'Logout realizado com sucesso',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    authenticated: true,
    sessionToken: req.sessionToken,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/beneficiaries', requireAuth, async (req, res) => {
  try {
    const input = Array.isArray(req.body) ? req.body : [req.body];
    if (input.length === 0) {
      return errorResponse(res, 400, 'Nenhum beneficiário fornecido', 'EMPTY_PAYLOAD');
    }
    
    const parsed = input.map((x, idx) => {
      try {
        return BeneficiarySchema.parse(x);
      } catch (err) {
        if (err instanceof z.ZodError) {
          throw new Error(`Erro no beneficiário ${idx + 1}: ${err.errors.map(e => e.message).join(', ')}`);
        }
        throw err;
      }
    });
    
    const url = `${RAPIDOC_BASE_URL}/tema/api/beneficiaries`;
    const r = await fetch(url, {
      method: 'POST',
      headers: rapidocHeaders('application/vnd.rapidoc.tema-v2+json', req.sessionToken),
      body: JSON.stringify(parsed),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return errorResponse(res, r.status, data.message || 'Erro ao cadastrar beneficiários', 'BENEFICIARY_CREATION_FAILED', data);
    }
    res.json({
      success: true,
      beneficiaries: data.beneficiaries || data.data || [],
      count: (data.beneficiaries || data.data || []).length,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return errorResponse(res, 400, 'Dados inválidos', 'VALIDATION_ERROR', err.errors);
    }
    console.error('Beneficiaries creation error:', err);
    errorResponse(res, 500, 'Erro ao cadastrar beneficiários', 'SERVER_ERROR', err.message);
  }
});

app.get('/api/beneficiaries/:uuid/request-appointment', requireAuth, async (req, res) => {
  try {
    const uuid = req.params.uuid;
    if (!uuid || !/^[0-9a-fA-F-]{32,36}$/.test(uuid)) {
      return errorResponse(res, 400, 'UUID inválido', 'INVALID_UUID');
    }
    
    const url = `${RAPIDOC_BASE_URL}/tema/api/beneficiaries/${encodeURIComponent(uuid)}/request-appointment`;
    const r = await fetch(url, {
      method: 'GET',
      headers: rapidocHeaders('application/vnd.rapidoc.tema-v1+json', req.sessionToken),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return errorResponse(res, r.status, data.message || 'Erro ao solicitar atendimento', 'APPOINTMENT_REQUEST_FAILED', data);
    }
    res.json({
      success: true,
      url: data.url || data.data?.url || null,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Request appointment error:', err);
    errorResponse(res, 500, 'Erro ao solicitar atendimento', 'SERVER_ERROR', err.message);
  }
});

app.delete('/api/beneficiaries/:uuid', requireAuth, async (req, res) => {
  try {
    const uuid = req.params.uuid;
    if (!uuid || !/^[0-9a-fA-F-]{32,36}$/.test(uuid)) {
      return errorResponse(res, 400, 'UUID inválido', 'INVALID_UUID');
    }
    
    const url = `${RAPIDOC_BASE_URL}/tema/api/beneficiaries/${encodeURIComponent(uuid)}`;
    const r = await fetch(url, {
      method: 'DELETE',
      headers: rapidocHeaders('application/vnd.rapidoc.tema-v1+json', req.sessionToken),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return errorResponse(res, r.status, data.message || 'Erro ao inativar beneficiário', 'BENEFICIARY_DEACTIVATION_FAILED', data);
    }
    res.json({
      success: true,
      message: 'Beneficiário inativado com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Delete beneficiary error:', err);
    errorResponse(res, 500, 'Erro ao inativar beneficiário', 'SERVER_ERROR', err.message);
  }
});

const AppointmentSchema = z.object({
  beneficiaryUuid: z.string().uuid(),
  availabilityUuid: z.string().uuid(),
  specialtyUuid: z.string().uuid(),
  approveAdditionalPayment: z.boolean().optional(),
  beneficiaryMedicalReferralUuid: z.string().uuid().optional(),
});

app.post('/api/appointments', requireAuth, async (req, res) => {
  try {
    const payload = AppointmentSchema.parse(req.body);
    
    // Validação adicional de regras de negócio
    const specialty = await fetch(`${RAPIDOC_BASE_URL}/tema/api/specialties/${payload.specialtyUuid}`, {
      headers: rapidocHeaders('application/vnd.rapidoc.tema-v2+json', req.sessionToken)
    }).then(r => r.json()).catch(() => null);
    
    const specialtyName = specialty?.name || '';
    const requiresReferral = !['PSICOLOGIA', 'NUTRICAO'].includes(specialtyName.toUpperCase());
    
    if (requiresReferral && !payload.beneficiaryMedicalReferralUuid) {
      return errorResponse(res, 400, 'Encaminhamento médico obrigatório para esta especialidade', 'MISSING_REFERRAL');
    }
    
    const url = `${RAPIDOC_BASE_URL}/tema/api/appointments`;
    const r = await fetch(url, {
      method: 'POST',
      headers: rapidocHeaders('application/vnd.rapidoc.tema-v2+json', req.sessionToken),
      body: JSON.stringify(payload),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return errorResponse(res, r.status, data.message || 'Erro ao agendar consulta', 'APPOINTMENT_CREATION_FAILED', data);
    }
    res.status(201).json({
      success: true,
      appointment: data,
      requiresReferral,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return errorResponse(res, 400, 'Dados inválidos para agendamento', 'VALIDATION_ERROR', err.errors);
    }
    console.error('Appointment creation error:', err);
    errorResponse(res, 500, 'Erro ao agendar consulta', 'SERVER_ERROR', err.message);
  }
});

app.get('/api/beneficiaries', requireAuth, async (req, res) => {
  try {
    const url = `${RAPIDOC_BASE_URL}/tema/api/beneficiaries`;
    const r = await fetch(url, { 
      method: 'GET', 
      headers: rapidocHeaders('application/vnd.rapidoc.tema-v2+json', req.sessionToken) 
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return errorResponse(res, r.status, data.message || 'Erro ao listar beneficiários', 'BENEFICIARIES_LIST_FAILED', data);
    }
    const beneficiaries = data.beneficiaries || data.data || [];
    res.json({
      success: true,
      beneficiaries,
      count: beneficiaries.length,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('List beneficiaries error:', err);
    errorResponse(res, 500, 'Erro ao listar beneficiários', 'SERVER_ERROR', err.message);
  }
});

app.get('/api/beneficiaries/cpf', requireAuth, async (req, res) => {
  try {
    const cpf = req.query.cpf || '';
    if (!cpf || !/^\d{11}$/.test(cpf.replace(/\D/g, ''))) {
      return errorResponse(res, 400, 'CPF inválido', 'INVALID_CPF');
    }
    
    const cleanCPF = cpf.replace(/\D/g, '');
    const url = `${RAPIDOC_BASE_URL}/tema/api/beneficiaries/cpf?cpf=${encodeURIComponent(cleanCPF)}`;
    const r = await fetch(url, { 
      method: 'GET', 
      headers: rapidocHeaders('application/vnd.rapidoc.tema-v2+json', req.sessionToken) 
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return errorResponse(res, r.status, data.message || 'Erro ao consultar beneficiário por CPF', 'CPF_QUERY_FAILED', data);
    }
    res.json({
      success: true,
      beneficiary: data.data || data.beneficiary || null,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Find beneficiary by CPF error:', err);
    errorResponse(res, 500, 'Erro ao consultar beneficiário por CPF', 'SERVER_ERROR', err.message);
  }
});

app.put('/api/beneficiaries/:uuid/reactivate', requireAuth, async (req, res) => {
  try {
    const uuid = req.params.uuid;
    if (!uuid || !/^[0-9a-fA-F-]{32,36}$/.test(uuid)) {
      return errorResponse(res, 400, 'UUID inválido', 'INVALID_UUID');
    }
    
    const url = `${RAPIDOC_BASE_URL}/tema/api/beneficiaries/${encodeURIComponent(uuid)}/reactivate`;
    const r = await fetch(url, { 
      method: 'PUT', 
      headers: rapidocHeaders('application/vnd.rapidoc.tema-v2+json', req.sessionToken) 
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return errorResponse(res, r.status, data.message || 'Erro ao reativar beneficiário', 'BENEFICIARY_REACTIVATION_FAILED', data);
    }
    res.json({
      success: true,
      message: 'Beneficiário reativado com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Reactivate beneficiary error:', err);
    errorResponse(res, 500, 'Erro ao reativar beneficiário', 'SERVER_ERROR', err.message);
  }
});

app.put('/api/beneficiaries/:uuid', requireAuth, async (req, res) => {
  try {
    const uuid = req.params.uuid;
    if (!uuid || !/^[0-9a-fA-F-]{32,36}$/.test(uuid)) {
      return errorResponse(res, 400, 'UUID inválido', 'INVALID_UUID');
    }
    
    if (!req.body || Object.keys(req.body).length === 0) {
      return errorResponse(res, 400, 'Dados de atualização não fornecidos', 'EMPTY_UPDATE_DATA');
    }
    
    const url = `${RAPIDOC_BASE_URL}/tema/api/beneficiaries/${encodeURIComponent(uuid)}`;
    const r = await fetch(url, { 
      method: 'PUT', 
      headers: rapidocHeaders('application/vnd.rapidoc.tema-v2+json', req.sessionToken), 
      body: JSON.stringify(req.body) 
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return errorResponse(res, r.status, data.message || 'Erro ao atualizar beneficiário', 'BENEFICIARY_UPDATE_FAILED', data);
    }
    res.json({
      success: true,
      message: 'Beneficiário atualizado com sucesso',
      beneficiary: data,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Update beneficiary error:', err);
    errorResponse(res, 500, 'Erro ao atualizar beneficiário', 'SERVER_ERROR', err.message);
  }
});

app.get('/api/beneficiaries/:uuid/medical-referrals', requireAuth, async (req, res) => {
  try {
    const uuid = req.params.uuid;
    if (!uuid || !/^[0-9a-fA-F-]{32,36}$/.test(uuid)) {
      return errorResponse(res, 400, 'UUID inválido', 'INVALID_UUID');
    }
    
    const url = `${RAPIDOC_BASE_URL}/tema/api/beneficiaries/${encodeURIComponent(uuid)}/medical-referrals`;
    const r = await fetch(url, { 
      method: 'GET', 
      headers: rapidocHeaders('application/vnd.rapidoc.tema-v2+json', req.sessionToken) 
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return errorResponse(res, r.status, data.message || 'Erro ao listar encaminhamentos', 'REFERRALS_LIST_FAILED', data);
    }
    const referrals = data.referrals || data.data || [];
    res.json({
      success: true,
      referrals,
      count: referrals.length,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Medical referrals error:', err);
    errorResponse(res, 500, 'Erro ao listar encaminhamentos do beneficiário', 'SERVER_ERROR', err.message);
  }
});

app.get('/api/beneficiaries/:uuid/appointments', requireAuth, async (req, res) => {
  try {
    const uuid = req.params.uuid;
    if (!uuid || !/^[0-9a-fA-F-]{32,36}$/.test(uuid)) {
      return errorResponse(res, 400, 'UUID inválido', 'INVALID_UUID');
    }
    
    const url = `${RAPIDOC_BASE_URL}/tema/api/beneficiaries/${encodeURIComponent(uuid)}/appointments`;
    const r = await fetch(url, { 
      method: 'GET', 
      headers: rapidocHeaders('application/vnd.rapidoc.tema-v2+json', req.sessionToken) 
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return errorResponse(res, r.status, data.message || 'Erro ao listar consultas', 'APPOINTMENTS_LIST_FAILED', data);
    }
    const appointments = data.appointments || data.data || [];
    res.json({
      success: true,
      appointments,
      count: appointments.length,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Beneficiary appointments error:', err);
    errorResponse(res, 500, 'Erro ao listar consultas do beneficiário', 'SERVER_ERROR', err.message);
  }
});

app.get('/api/specialties', requireAuth, async (req, res) => {
  try {
    const url = `${RAPIDOC_BASE_URL}/tema/api/specialties`;
    const r = await fetch(url, { 
      method: 'GET', 
      headers: rapidocHeaders('application/vnd.rapidoc.tema-v2+json', req.sessionToken) 
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return errorResponse(res, r.status, data.message || 'Erro ao listar especialidades', 'SPECIALTIES_LIST_FAILED', data);
    }
    const specialties = data.specialties || data.data || [];
    res.json({
      success: true,
      specialties,
      count: specialties.length,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('List specialties error:', err);
    errorResponse(res, 500, 'Erro ao listar especialidades', 'SERVER_ERROR', err.message);
  }
});

app.get('/api/specialty-availability', requireAuth, async (req, res) => {
  try {
    const { specialtyUuid, dateInitial, dateFinal, beneficiaryUuid } = req.query;
    
    if (!specialtyUuid || !/^[0-9a-fA-F-]{32,36}$/.test(specialtyUuid)) {
      return errorResponse(res, 400, 'UUID da especialidade inválido', 'INVALID_SPECIALTY_UUID');
    }
    
    if (!dateInitial || !/^\d{4}-\d{2}-\d{2}$/.test(dateInitial)) {
      return errorResponse(res, 400, 'Data inicial inválida (formato: YYYY-MM-DD)', 'INVALID_DATE_INITIAL');
    }
    
    if (!dateFinal || !/^\d{4}-\d{2}-\d{2}$/.test(dateFinal)) {
      return errorResponse(res, 400, 'Data final inválida (formato: YYYY-MM-DD)', 'INVALID_DATE_FINAL');
    }
    
    const qs = new URLSearchParams({
      specialtyUuid: specialtyUuid,
      dateInitial: dateInitial,
      dateFinal: dateFinal,
      beneficiaryUuid: beneficiaryUuid || '',
    });
    
    const url = `${RAPIDOC_BASE_URL}/tema/api/specialty-availability?${qs.toString()}`;
    const r = await fetch(url, { 
      method: 'GET', 
      headers: rapidocHeaders('application/vnd.rapidoc.tema-v2+json', req.sessionToken) 
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return errorResponse(res, r.status, data.message || 'Erro ao listar disponibilidades', 'AVAILABILITY_LIST_FAILED', data);
    }
    const availability = data.items || data.availability || data.data || [];
    res.json({
      success: true,
      availability,
      count: availability.length,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Specialty availability error:', err);
    errorResponse(res, 500, 'Erro ao listar disponibilidades', 'SERVER_ERROR', err.message);
  }
});

app.get('/api/appointments', requireAuth, async (req, res) => {
  try {
    const url = `${RAPIDOC_BASE_URL}/tema/api/appointments`;
    const r = await fetch(url, { 
      method: 'GET', 
      headers: rapidocHeaders('application/vnd.rapidoc.tema-v2+json', req.sessionToken) 
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return errorResponse(res, r.status, data.message || 'Erro ao listar agendamentos', 'APPOINTMENTS_LIST_FAILED', data);
    }
    const appointments = data.appointments || data.data || [];
    res.json({
      success: true,
      appointments,
      count: appointments.length,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('List appointments error:', err);
    errorResponse(res, 500, 'Erro ao listar agendamentos', 'SERVER_ERROR', err.message);
  }
});

app.get('/api/appointments/:uuid', requireAuth, async (req, res) => {
  try {
    const uuid = req.params.uuid;
    if (!uuid || !/^[0-9a-fA-F-]{32,36}$/.test(uuid)) {
      return errorResponse(res, 400, 'UUID inválido', 'INVALID_UUID');
    }
    
    const url = `${RAPIDOC_BASE_URL}/tema/api/appointments/${encodeURIComponent(uuid)}`;
    const r = await fetch(url, { 
      method: 'GET', 
      headers: rapidocHeaders('application/vnd.rapidoc.tema-v2+json', req.sessionToken) 
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return errorResponse(res, r.status, data.message || 'Erro ao consultar agendamento', 'APPOINTMENT_QUERY_FAILED', data);
    }
    res.json({
      success: true,
      appointment: data.data || data.appointment || data,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Get appointment error:', err);
    errorResponse(res, 500, 'Erro ao consultar agendamento', 'SERVER_ERROR', err.message);
  }
});

app.delete('/api/appointments/:uuid', requireAuth, async (req, res) => {
  try {
    const uuid = req.params.uuid;
    if (!uuid || !/^[0-9a-fA-F-]{32,36}$/.test(uuid)) {
      return errorResponse(res, 400, 'UUID inválido', 'INVALID_UUID');
    }
    
    const url = `${RAPIDOC_BASE_URL}/tema/api/appointments/${encodeURIComponent(uuid)}`;
    const r = await fetch(url, { 
      method: 'DELETE', 
      headers: rapidocHeaders('application/vnd.rapidoc.tema-v2+json', req.sessionToken) 
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      return errorResponse(res, r.status, data.message || 'Erro ao cancelar agendamento', 'APPOINTMENT_CANCELLATION_FAILED', data);
    }
    res.json({
      success: true,
      message: 'Agendamento cancelado com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Cancel appointment error:', err);
    errorResponse(res, 500, 'Erro ao cancelar agendamento', 'SERVER_ERROR', err.message);
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'index.html'));
});
app.use(express.static(path.resolve(__dirname, '..')));

app.get('/health', (req, res) => { 
  res.json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime()
  }); 
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  errorResponse(res, 500, 'Erro interno do servidor', 'INTERNAL_ERROR', err.message);
});

app.listen(PORT);
console.log(`Server listening on http://localhost:${PORT}`);