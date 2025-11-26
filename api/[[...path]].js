const fetch = require('node-fetch');

// Configurações de produção
const PRODUCTION_ORIGINS = [
  'https://ailun-saude.vercel.app',
  'https://ailun.com.br',
  'https://www.ailun.com.br'
];

module.exports = async (req, res) => {
  // Configuração de CORS para produção
  const origin = req.headers.origin || '';
  const isAllowedOrigin = PRODUCTION_ORIGINS.includes(origin);
  
  // Headers de segurança para produção
  res.setHeader('Access-Control-Allow-Origin', isAllowedOrigin ? origin : PRODUCTION_ORIGINS[0]);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'clientId, origin, Content-Type, accept, Authorization, beneficiary, groupId, X-Session-Token, Cookie');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
  
  // Headers de segurança adicionais
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Configurações da API Rapidoc
  const base = process.env.RAPIDOC_BASE_URL || 'https://api.rapidoc.tech';
  const clientId = process.env.RAPIDOC_CLIENT_ID || '';
  const token = process.env.RAPIDOC_TOKEN || '';
  
  // Validação de configurações obrigatórias (exceto para rotas locais de sessão)
  // Será aplicada após a definição de path/isLogin/isMe/isLogout

  const cookieSecure = String(process.env.COOKIE_SECURE).toLowerCase() === 'true';
  const path = (req.url || '').replace(/^\/api/, '') || '/';
  const isLogin = path.startsWith('/login');
  const isMe = path === '/me';
  const isLogout = path === '/logout';

  // Validação de configurações obrigatórias (exceto para rotas locais de sessão)
  if (!isLogin && !isMe && !isLogout && (!clientId || !token)) {
    res.status(500).json({ 
      message: 'Configuração incompleta. Verifique as variáveis de ambiente RAPIDOC_CLIENT_ID e RAPIDOC_TOKEN.' 
    });
    return;
  }
  
  // Validação de autenticação
  const sessionCookie = (req.headers.cookie || '').split(';').find(x => x.trim().startsWith('session='));
  const sessionHeader = req.headers['x-session-token'] || '';

  if (isMe) {
    const hasSession = !!sessionCookie || !!sessionHeader;
    if (!hasSession) {
      res.status(401).json({ authenticated: false, message: 'Não autenticado' });
      return;
    }
    res.status(200).json({ authenticated: true });
    return;
  }

  if (isLogout && req.method === 'POST') {
    const cookieOptions = ['session=','Path=/','HttpOnly','SameSite=Strict','Max-Age=0'];
    if (cookieSecure) cookieOptions.push('Secure');
    res.setHeader('Set-Cookie', cookieOptions.join('; '));
    res.status(200).json({ success: true, message: 'Logout realizado com sucesso' });
    return;
  }

  if (!isLogin && !sessionCookie && !sessionHeader) {
    res.status(401).json({ message: 'Não autenticado' });
    return;
  }

  // Preparação da requisição
  const hasBody = ['POST', 'PUT'].includes(req.method);
  const isV1 = path.includes('/request-appointment') || (req.method === 'DELETE' && path.includes('/beneficiaries/'));
  const contentType = isV1 ? 'application/vnd.rapidoc.tema-v1+json' : 'application/vnd.rapidoc.tema-v2+json';
  
  const target = isLogin ? `${base}/login` : `${base}/tema/api${path}`;
  const headers = { 
    clientId, 
    Authorization: `Bearer ${token}`,
    'User-Agent': 'Ailun-Saude-Vercel/1.0'
  };

  if (!isLogin && sessionHeader) {
    headers['X-Session-Token'] = String(sessionHeader);
  }
  
  if (hasBody) headers['Content-Type'] = contentType;

  try {
    // Timeout de 30 segundos para produção
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const body = hasBody ? JSON.stringify(req.body || {}) : undefined;
    const r = await fetch(target, { 
      method: req.method, 
      headers, 
      body,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const data = await r.json().catch(() => ({}));
    
    if (!r.ok) {
      res.status(r.status).json(data);
      return;
    }
    
    // Configuração do cookie de sessão para produção
    if (isLogin && data.token) {
      const cookieOptions = [
        `session=${data.token}`,
        'Path=/',
        'HttpOnly',
        'SameSite=Strict',
        'Max-Age=86400' // 24 horas
      ];
      
      if (cookieSecure) cookieOptions.push('Secure');
      
      res.setHeader('Set-Cookie', cookieOptions.join('; '));
    }
    
    res.status(isLogin && req.method === 'POST' ? 200 : r.status).json(data);
    
  } catch (err) {
    if (err.name === 'AbortError') {
      res.status(504).json({ message: 'Timeout na requisição' });
    } else {
      console.error('Erro no proxy:', err);
      res.status(500).json({ message: 'Erro ao processar requisição' });
    }
  }
};