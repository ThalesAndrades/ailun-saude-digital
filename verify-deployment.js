const https = require('https');

console.log('🔍 Verificando status do deploy da Ailun Saúde...\n');

// URLs to test
const urls = [
  'https://ailun-saude.vercel.app',
  'https://ailun-saude-digital-thalesandradees-4009s-projects.vercel.app'
];

function testUrl(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD', timeout: 10000 }, (res) => {
      console.log(`✅ ${url}`);
      console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
      console.log(`   Headers: ${JSON.stringify(res.headers, null, 2)}`);
      resolve({ url, status: res.statusCode, headers: res.headers });
    });

    req.on('error', (err) => {
      console.log(`❌ ${url}`);
      console.log(`   Erro: ${err.message}`);
      resolve({ url, error: err.message });
    });

    req.on('timeout', () => {
      console.log(`⏰ ${url}`);
      console.log(`   Timeout: A requisição demorou muito tempo`);
      req.destroy();
      resolve({ url, error: 'Timeout' });
    });

    req.end();
  });
}

async function main() {
  console.log('📊 Testando URLs de deploy...\n');
  
  for (const url of urls) {
    await testUrl(url);
    console.log('');
  }

  console.log('\n📋 Instruções para deploy manual:');
  console.log('1. Acesse: https://vercel.com/dashboard');
  console.log('2. Importe o projeto do GitHub: ThalesAndrades/ailun-saude-digital');
  console.log('3. Configure as variáveis de ambiente:');
  console.log('   - RAPIDOC_CLIENT_ID: 540e4b44-d68d-4ade-885f-fd4940a3a045');
  console.log('   - RAPIDOC_TOKEN: eyJhbGciOiJSUzUxMiJ9.eyJjbGllbnQiOiJBSUxVTiBURUNOT0xPR0lBIn0.Wkzl4kZkBhTCHoSI_9r5TDmTY9ZHrxIj7kyCUvWeXM9FKIhpf9vY464wFwb4u0K_ys_TtB00awXU42duDxEz_KJ4oloJbklLsIaiHW6OgGnrv5iLN1wNYb9uTPDJjCkiNBtNIr0F5_7U8gV6qwztAWn5vY8qrt7DxOoaO_8uIe-jydSZYjl9jMtMjWd3phmjjxfoDLqLGRKoSgw01Efk6ivkzndB2gcdmZIz6tgwhTfwuQLRkhMmqCv188twAkP2Dyt8A_OREr8iyiXHlBNlZnLcYlng5_9PHDUww2exl_QC6RuhB2k-vwsZ4eOxjOThpkCWT-E4zomUMpVuoEFtN_yt3vGiTwr_WHWjleDnOR1CeGCtxRCDmzU7IGmwa7fEhOrx7VUXPKZKidmF2HGicBq4QK22JvAimuDstuAcHIepr9gs8abm0p93_-BbnZDoM4edmhFLvBykfbV-rXVhen0nJVm5c9av4QP8tb41lglrs3DVa7KCqESG8kB47uCf74K8GJLpHzgk2ERHH_E3o1I_NdFwf1qZTAxiCCGIi0wjtVkU9zTrEyNb5HNpSgXn3Hj7IyMiCvHTzrweY7aizFF9uyrIf_5-SY-jmE-XuhvZiOuRQO-7XnCWHtuuuHXUVxKEFmG7EQWvI-e7z62cAJdQZhlxEBtepSgzpC_GKPc');
  console.log('4. Deploy o projeto');
  console.log('');
  console.log('🔗 Links úteis:');
  console.log('   - Repositório GitHub: https://github.com/ThalesAndrades/ailun-saude-digital');
  console.log('   - Dashboard Vercel: https://vercel.com/dashboard');
  console.log('   - Documentação: https://ailun-saude.vercel.app (após deploy)');
}

main().catch(console.error);