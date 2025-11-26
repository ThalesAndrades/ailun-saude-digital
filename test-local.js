const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testando Aplicação Ailun Saúde Localmente...\n');

// Configurações do servidor
const PORT = 8081; // Porta alternativa

// Tipos MIME para arquivos estáticos
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Função para servir arquivos estáticos
function serveStaticFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 - Arquivo não encontrado</h1>');
      return;
    }
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}

// Criar servidor
const server = http.createServer((req, res) => {
  console.log(`📡 Requisição: ${req.method} ${req.url}`);
  
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Parse URL
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = parsedUrl.pathname;
  
  // Rota principal - index.html
  if (pathname === '/' || pathname === '/index.html') {
    serveStaticFile(res, './index.html');
    return;
  }
  
  // Rotas de API
  if (pathname.startsWith('/api/')) {
    // Test API endpoint
    if (pathname === '/api/me' || pathname === '/api/test') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        message: 'API Ailun Saúde funcionando!',
        timestamp: new Date().toISOString(),
        endpoint: pathname,
        status: 'success'
      }));
      return;
    }
    
    // API de login simulada
    if (pathname === '/api/login' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          message: 'Login simulado bem-sucedido',
          token: 'simulated-jwt-token',
          user: { email: 'admin@ailun.com', role: 'admin' }
        }));
      });
      return;
    }
    
    // API de beneficiários simulada
    if (pathname === '/api/beneficiaries' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        beneficiaries: [
          {
            id: 1,
            name: 'João Silva',
            cpf: '123.456.789-00',
            email: 'joao@example.com',
            status: 'active'
          },
          {
            id: 2,
            name: 'Maria Santos',
            cpf: '987.654.321-00',
            email: 'maria@example.com',
            status: 'active'
          }
        ]
      }));
      return;
    }
  }
  
  // Servir arquivos estáticos
  if (pathname.startsWith('/assets/')) {
    const filePath = '.' + pathname;
    serveStaticFile(res, filePath);
    return;
  }
  
  // Rota de fallback para SPA
  if (pathname !== '/api/' && !pathname.startsWith('/api/')) {
    serveStaticFile(res, './index.html');
    return;
  }
  
  // 404 para APIs não encontradas
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'API endpoint não encontrado' }));
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`✅ Servidor iniciado com sucesso!`);
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
  console.log(`📊 Teste as rotas:`);
  console.log(`   - http://localhost:${PORT}/ (aplicação principal)`);
  console.log(`   - http://localhost:${PORT}/api/me (teste de API)`);
  console.log(`   - http://localhost:${PORT}/api/test (teste de API)`);
  console.log(`   - http://localhost:${PORT}/api/login (login simulado)`);
  console.log(`   - http://localhost:${PORT}/api/beneficiaries (lista de beneficiários)`);
  console.log('');
  console.log('ℹ️  Pressione Ctrl+C para parar o servidor');
});

// Testar se os arquivos principais existem
const requiredFiles = ['index.html', 'assets/style.css', 'assets/app.js'];
console.log('📁 Verificando arquivos necessários:');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - OK`);
  } else {
    console.log(`❌ ${file} - Não encontrado`);
  }
});