# 🚀 Guia de Deploy em Produção - Ailun Saúde

## Configuração Inicial no Vercel

### 1. Acesse o Painel do Vercel
- Vá para [vercel.com](https://vercel.com)
- Acesse com sua conta
- Selecione o projeto `ailun-saude`

### 2. Configure as Variáveis de Ambiente
No painel do projeto, vá em **Settings** > **Environment Variables** e adicione:

```bash
RAPIDOC_BASE_URL=https://api.rapidoc.tech
RAPIDOC_CLIENT_ID=seu_client_id_aqui
RAPIDOC_TOKEN=seu_token_aqui
COOKIE_SECURE=true
NODE_ENV=production
```

### 3. Deploy Manual (Recomendado)

#### Opção A: Via Vercel Dashboard
1. Vá para [vercel.com/dashboard](https://vercel.com/dashboard)
2. Clique em "New Project"
3. Importe do GitHub ou faça upload dos arquivos
4. Configure as variáveis de ambiente
5. Clique em "Deploy"

#### Opção B: Via CLI (Se tiver acesso)
```bash
# Instale o Vercel CLI
npm i -g vercel

# Faça login
vercel login

# Configure variáveis
vercel env add RAPIDOC_CLIENT_ID production
vercel env add RAPIDOC_TOKEN production
vercel env add COOKIE_SECURE production

# Deploy
vercel --prod
```

### 4. Verificação Pós-Deploy

Após o deploy, teste as seguintes funcionalidades:

#### ✅ Login
- Acesse: `https://ailun-saude.vercel.app`
- Teste login com credenciais válidas

#### ✅ Dashboard
- Verifique se o dashboard carrega corretamente
- Teste as abas de navegação

#### ✅ API Integration
- Teste cadastro de beneficiário
- Teste agendamento de consulta
- Verifique se a lógica de negócio está funcionando

## 🔧 Solução de Problemas

### Erro 401 (Não Autenticado)
- Verifique se as credenciais da Rapidoc estão corretas
- Confirme que o token não expirou

### Erro 500 (Erro Interno)
- Verifique os logs no Vercel Dashboard
- Confirme que todas as variáveis de ambiente estão configuradas

### Erro de CORS
- Verifique se as origens estão configuradas corretamente
- A URL deve ser `https://ailun-saude.vercel.app`

## 📊 Monitoramento

### Logs
- Acesse: Vercel Dashboard > Project > Logs
- Monitore erros e performance

### Analytics
- Ative o Vercel Analytics para monitorar uso
- Configure alertas para erros

## 🔐 Segurança em Produção

### Verificações de Segurança
- ✅ HTTPS habilitado automaticamente
- ✅ Cookies HTTP-only configurados
- ✅ CORS restrito para domínios permitidos
- ✅ Headers de segurança adicionados
- ✅ Rate limiting implementado

### Backup de Dados
- A Rapidoc gerencia os dados médicos
- A aplicação não armazena dados localmente
- Sessões são gerenciadas via cookies seguros

## 🎯 Testes Recomendados

### Teste de Login
```javascript
// No console do navegador
document.getElementById('email').value = 'seu_email@exemplo.com';
document.getElementById('password').value = 'sua_senha';
document.getElementById('login-form').dispatchEvent(new Event('submit'));
```

### Teste de Cadastro
1. Vá para aba "Cadastrar"
2. Preencha os campos obrigatórios
3. Teste validações de CPF, data, etc.

### Teste de Agendamento
1. Vá para aba "Agendar Consulta"
2. Teste a lógica:
   - Especialidade Médica → Requer encaminhamento
   - Psicologia/Nutrição → Direto

## 📞 Suporte

Se encontrar problemas:

1. **Verifique os logs do Vercel**
2. **Teste as credenciais da Rapidoc**
3. **Confirme as variáveis de ambiente**
4. **Verifique a conectividade com a API**

## 🎉 Sucesso!

Após o deploy bem-sucedido, sua aplicação estará disponível em:
**https://ailun-saude.vercel.app**

A aplicação está pronta para uso em produção com:
- ✅ Segurança reforçada
- ✅ Performance otimizada
- ✅ Monitoramento integrado
- ✅ Logs detalhados

Boa sorte com o deploy! 🚀