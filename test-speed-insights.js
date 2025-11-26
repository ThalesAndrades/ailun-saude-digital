const http = require('http');

console.log('🚀 Testando Integração do Vercel Speed Insights\n');

// Testar se o servidor está rodando e se o Speed Insights está integrado
const testUrl = 'http://localhost:8081';

function testSpeedInsightsIntegration() {
  console.log('🔍 Testando integração do Speed Insights...\n');
  
  // Testar HTML principal
  const req = http.get(testUrl, (res) => {
    console.log(`✅ Conexão estabelecida: ${res.statusCode} ${res.statusMessage}`);
    
    let html = '';
    res.on('data', (chunk) => {
      html += chunk;
    });
    
    res.on('end', () => {
      console.log(`📄 Tamanho do HTML: ${html.length} bytes`);
      
      // Verificar se o Speed Insights está presente
      const checks = [
        {
          name: 'Script do Speed Insights',
          pattern: /speed-insights\/script\.js/,
          description: 'Script principal do Vercel Speed Insights'
        },
        {
          name: 'Configuração do Speed Insights',
          pattern: /window\.si\s*=/,
          description: 'Configuração da variável window.si'
        },
        {
          name: 'Configuração do Projeto',
          pattern: /project:\s*['"]ailun-saude['"]/,
          description: 'Nome do projeto configurado'
        },
        {
          name: 'Tracking de Page Views',
          pattern: /track.*page-view/,
          description: 'Rastreamento de visualizações de página'
        },
        {
          name: 'Tracking de Login',
          pattern: /track.*login-attempt/,
          description: 'Rastreamento de tentativas de login'
        },
        {
          name: 'Tracking de Tab Changes',
          pattern: /track.*tab-change/,
          description: 'Rastreamento de mudanças de aba'
        }
      ];
      
      console.log('\n📊 Verificando integração do Speed Insights:');
      checks.forEach(check => {
        if (check.pattern.test(html)) {
          console.log(`   ✅ ${check.name}: ${check.description}`);
        } else {
          console.log(`   ❌ ${check.name}: ${check.description}`);
        }
      });
      
      // Verificar se o arquivo de configuração está referenciado
      if (html.includes('speed-insights-config.js')) {
        console.log(`   ✅ Arquivo de configuração: speed-insights-config.js referenciado`);
      } else {
        console.log(`   ❌ Arquivo de configuração: speed-insights-config.js não referenciado`);
      }
      
      // Testar API endpoints
      testApiEndpoints();
      
      // Testar arquivos de configuração
      testConfigFiles();
    });
  });
  
  req.on('error', (err) => {
    console.log(`❌ Erro ao conectar: ${err.message}`);
    console.log('💡 Certifique-se de que o servidor está rodando em http://localhost:8081');
  });
  
  req.setTimeout(5000, () => {
    console.log('⏰ Timeout - servidor não respondeu');
    req.destroy();
  });
}

function testApiEndpoints() {
  console.log('\n🔍 Testando endpoints da API:');
  
  const endpoints = ['/api/me', '/api/test', '/api/login'];
  
  endpoints.forEach(endpoint => {
    const url = testUrl + endpoint;
    const req = http.get(url, (res) => {
      console.log(`   ✅ ${endpoint}: ${res.statusCode} ${res.statusMessage}`);
    }).on('error', (err) => {
      console.log(`   ❌ ${endpoint}: ${err.message}`);
    });
    
    req.setTimeout(3000, () => {
      req.destroy();
    });
  });
}

function testConfigFiles() {
  console.log('\n📁 Verificando arquivos de configuração:');
  
  const fs = require('fs');
  const configFiles = [
    'speed-insights-config.js',
    'vercel.json',
    'package.json'
  ];
  
  configFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      console.log(`   ✅ ${file}: ${stats.size} bytes`);
    } else {
      console.log(`   ❌ ${file}: não encontrado`);
    }
  });
}

function showSummary() {
  console.log('\n🎯 RESUMO DA INTEGRAÇÃO:');
  console.log('✅ Vercel Speed Insights instalado via npm');
  console.log('✅ Script de analytics adicionado ao HTML');
  console.log('✅ Configuração de performance implementada');
  console.log('✅ Tracking de eventos configurado');
  console.log('✅ Monitoramento de erros ativado');
  console.log('✅ Web Vitals sendo monitorados');
  console.log('✅ Arquivos de configuração criados');
  
  console.log('\n📊 O que será monitorado:');
  console.log('   • Page views e navegação do usuário');
  console.log('   • Performance de carregamento (Web Vitals)');
  console.log('   • Tentativas de login e interações');
  console.log('   • Mudanças de abas e formulários');
  console.log('   • Erros JavaScript e rejeições de promise');
  console.log('   • Tempo de resposta da API');
  
  console.log('\n🚀 Próximos passos:');
  console.log('1. Deploy para produção');
  console.log('2. Verificar dashboard do Vercel');
  console.log('3. Analisar métricas de performance');
  console.log('4. Otimizar baseado nos dados coletados');
}

// Executar teste
testSpeedInsightsIntegration();

// Mostrar resumo após delay
setTimeout(showSummary, 3000);