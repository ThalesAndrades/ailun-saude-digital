const http = require('http');

console.log('🔍 Testando servidor local...');

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/me',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Resposta:', data);
    
    // Testar a aplicação principal
    console.log('\n🔍 Testando aplicação principal...');
    testMainApp();
  });
});

req.on('error', (err) => {
  console.error('Erro:', err.message);
  if (err.code === 'ECONNREFUSED') {
    console.log('❌ Servidor não está rodando na porta 8080');
  }
});

req.on('timeout', () => {
  console.log('⏰ Timeout - servidor não respondeu');
  req.destroy();
});

req.end();

function testMainApp() {
  const mainReq = http.request({
    hostname: 'localhost',
    port: 8080,
    path: '/',
    method: 'GET',
    timeout: 5000
  }, (res) => {
    console.log(`Status da aplicação principal: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ Aplicação principal está funcionando!');
        console.log(`📄 Tamanho do HTML: ${data.length} bytes`);
      }
    });
  });
  
  mainReq.on('error', (err) => {
    console.error('Erro na aplicação principal:', err.message);
  });
  
  mainReq.end();
}