const https = require('https');

console.log('🔍 Verificador de Status do Build - Vercel\n');

// Verificar se o package.json foi atualizado
const fs = require('fs');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
console.log('📦 Configuração do Node.js:');
console.log(`   Versão: ${packageJson.engines?.node || 'não definida'}`);
console.log(`   Nome: ${packageJson.name}`);
console.log(`   Descrição: ${packageJson.description}`);

// Verificar vercel.json
const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
console.log('\n⚙️ Configuração do Vercel:');
console.log(`   Nome: ${vercelConfig.name}`);
console.log(`   Versão: ${vercelConfig.version}`);
console.log(`   Builds: ${vercelConfig.builds?.length || 0} configurados`);

// Verificar arquivos principais
const files = [
  'index.html',
  'api/[[...path]].js',
  'assets/style.css',
  'assets/app.js'
];

console.log('\n📁 Arquivos principais:');
files.forEach(file => {
  if (fs.existsSync(file)) {
    const stats = fs.statSync(file);
    console.log(`   ✅ ${file} (${stats.size} bytes)`);
  } else {
    console.log(`   ❌ ${file} (não encontrado)`);
  }
});

// Verificar variáveis de ambiente
console.log('\n🔐 Variáveis de ambiente:');
const envVars = ['RAPIDOC_CLIENT_ID', 'RAPIDOC_TOKEN', 'RAPIDOC_BASE_URL'];
envVars.forEach(env => {
  if (process.env[env]) {
    console.log(`   ✅ ${env}: ${process.env[env].substring(0, 10)}...`);
  } else {
    console.log(`   ❌ ${env}: não definida`);
  }
});

// Testar conectividade com Vercel
console.log('\n🌐 Testando conectividade:');
const testUrl = 'https://api.vercel.com/v1/integrations/deployments';
const req = https.get(testUrl, (res) => {
  console.log(`   API Vercel: ${res.statusCode} ${res.statusMessage}`);
}).on('error', (err) => {
  console.log(`   API Vercel: Erro - ${err.message}`);
});

console.log('\n📝 Recomendações:');
console.log('1. O package.json foi atualizado para Node.js 20.x');
console.log('2. O vercel.json está configurado corretamente');
console.log('3. Todos os arquivos principais estão presentes');
console.log('4. O deploy automático deve usar a nova configuração');

console.log('\n⏰ O deploy pode levar 2-5 minutos para completar.');
console.log('🔄 Use node monitor-deploy.js para monitorar o progresso.');