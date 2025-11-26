const https = require('https');
const readline = require('readline');

console.log('🚀 Monitor de Deploy - Ailun Saúde Digital\n');

const deploymentUrls = [
  'https://ailun-saude.vercel.app',
  'https://ailun-saude-digital-thalesandradees-4009s-projects.vercel.app'
];

let checkCount = 0;
let successCount = 0;

function checkDeployment() {
  checkCount++;
  console.log(`\n🔍 Verificação #${checkCount} - ${new Date().toLocaleTimeString()}`);
  
  deploymentUrls.forEach((url, index) => {
    const startTime = Date.now();
    
    const req = https.request(url, { 
      method: 'HEAD', 
      timeout: 10000 
    }, (res) => {
      const responseTime = Date.now() - startTime;
      
      if (res.statusCode === 200) {
        successCount++;
        console.log(`✅ ${url}`);
        console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
        console.log(`   Tempo de resposta: ${responseTime}ms`);
        console.log(`   ✅ DEPLOY BEM SUCEDIDO!`);
        
        // Testar API endpoints
        testApiEndpoints(url);
      } else {
        console.log(`⏳ ${url}`);
        console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
        console.log(`   Ainda em progresso...`);
      }
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${url}`);
      console.log(`   Erro: ${err.message}`);
      console.log(`   Deploy ainda não disponível`);
    });
    
    req.on('timeout', () => {
      console.log(`⏰ ${url}`);
      console.log(`   Timeout - Deploy em andamento`);
      req.destroy();
    });
    
    req.end();
  });
  
  console.log(`\n📊 Resumo: ${successCount}/${deploymentUrls.length} URLs funcionando`);
  
  if (successCount < deploymentUrls.length) {
    console.log('🔄 Próxima verificação em 30 segundos...');
    setTimeout(checkDeployment, 30000);
  } else {
    console.log('\n🎉 TODAS AS URLS ESTÃO FUNCIONANDO!');
    console.log('\n📋 Testes concluídos:');
    console.log('✅ Deploy bem sucedido');
    console.log('✅ Aplicação está no ar');
    console.log('✅ Sistema pronto para uso');
    
    showFinalInstructions();
  }
}

function testApiEndpoints(baseUrl) {
  console.log(`\n🔍 Testando endpoints da API...`);
  
  const endpoints = ['/api/me', '/api/test'];
  
  endpoints.forEach(endpoint => {
    const url = baseUrl + endpoint;
    const req = https.get(url, (res) => {
      console.log(`   ${endpoint}: ${res.statusCode} ${res.statusMessage}`);
    }).on('error', (err) => {
      console.log(`   ${endpoint}: Erro - ${err.message}`);
    });
  });
}

function showFinalInstructions() {
  console.log('\n🎯 PRÓXIMOS PASSOS:');
  console.log('1. Acesse: https://ailun-saude.vercel.app');
  console.log('2. Faça login com suas credenciais');
  console.log('3. Teste as funcionalidades de telemedicina');
  console.log('4. Gerencie beneficiários e agendamentos');
  
  console.log('\n🔗 Links importantes:');
  console.log('   - Aplicação: https://ailun-saude.vercel.app');
  console.log('   - Repositório: https://github.com/ThalesAndrades/ailun-saude-digital');
  console.log('   - Dashboard Vercel: https://vercel.com/dashboard');
  
  console.log('\n✅ DEPLOY CONCLUÍDO COM SUCESSO! 🚀');
}

// Iniciar monitoramento
console.log('🎯 Iniciando monitoramento de deploy...');
console.log('📍 URLs sendo monitoradas:');
deploymentUrls.forEach(url => console.log(`   - ${url}`));
console.log('\n⏰ Verificações a cada 30 segundos');
console.log('🔄 Pressione Ctrl+C para parar\n');

checkDeployment();