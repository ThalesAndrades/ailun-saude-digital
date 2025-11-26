# 🚀 Guia de Deploy Manual - Ailun Saúde Digital

## Status Atual
O token Vercel fornecido não é válido. Este guia mostra como fazer o deploy manualmente.

## 📋 Passo a Passo para Deploy Manual

### 1. Acessar o Dashboard Vercel
- Vá para: https://vercel.com/dashboard
- Faça login com sua conta

### 2. Importar o Projeto do GitHub
1. Clique em "New Project" ou "Novo Projeto"
2. Selecione "Import Git Repository"
3. Procure por: `ThalesAndrades/ailun-saude-digital`
4. Clique em "Import"

### 3. Configurar o Projeto
**Configurações do Projeto:**
- **Name**: `ailun-saude` (ou deixe o padrão)
- **Framework Preset**: `Other`
- **Root Directory**: `./` (raiz do projeto)

### 4. Configurar Variáveis de Ambiente
Adicione estas variáveis na seção "Environment Variables":

```env
RAPIDOC_BASE_URL=https://api.rapidoc.tech
RAPIDOC_CLIENT_ID=540e4b44-d68d-4ade-885f-fd4940a3a045
RAPIDOC_TOKEN=eyJhbGciOiJSUzUxMiJ9.eyJjbGllbnQiOiJBSUxVTiBURUNOT0xPR0lBIn0.Wkzl4kZkBhTCHoSI_9r5TDmTY9ZHrxIj7kyCUvWeXM9FKIhpf9vY464wFwb4u0K_ys_TtB00awXU42duDxEz_KJ4oloJbklLsIaiHW6OgGnrv5iLN1wNYb9uTPDJjCkiNBtNIr0F5_7U8gV6qwztAWn5vY8qrt7DxOoaO_8uIe-jydSZYjl9jMtMjWd3phmjjxfoDLqLGRKoSgw01Efk6ivkzndB2gcdmZIz6tgwhTfwuQLRkhMmqCv188twAkP2Dyt8A_OREr8iyiXHlBNlZnLcYlng5_9PHDUww2exl_QC6RuhB2k-vwsZ4eOxjOThpkCWT-E4zomUMpVuoEFtN_yt3vGiTwr_WHWjleDnOR1CeGCtxRCDmzU7IGmwa7fEhOrx7VUXPKZKidmF2HGicBq4QK22JvAimuDstuAcHIepr9gs8abm0p93_-BbnZDoM4edmhFLvBykfbV-rXVhen0nJVm5c9av4QP8tb41lglrs3DVa7KCqESG8kB47uCf74K8GJLpHzgk2ERHH_E3o1I_NdFwf1qZTAxiCCGIi0wjtVkU9zTrEyNb5HNpSgXn3Hj7IyMiCvHTzrweY7aizFF9uyrIf_5-SY-jmE-XuhvZiOuRQO-7XnCWHtuuuHXUVxKEFmG7EQWvI-e7z62cAJdQZhlxEBtepSgzpC_GKPc
COOKIE_SECURE=true
NODE_ENV=production
CORS_ORIGIN=https://ailun-saude.vercel.app,https://ailun.com.br,https://www.ailun.com.br
```

### 5. Configurar Build Settings
**Build & Development Settings:**
- **Build Command**: `npm install` (ou deixe vazio)
- **Output Directory**: `./` (raiz)
- **Install Command**: `npm install`

### 6. Deploy
1. Clique em "Deploy"
2. Aguarde o processo completar (2-5 minutos)
3. O projeto estará disponível em: `https://ailun-saude.vercel.app`

## 🔧 Configurações Avançadas (Opcional)

### Custom Domain
Para usar um domínio customizado:
1. Vá para as configurações do projeto
2. Clique em "Domains"
3. Adicione seu domínio
4. Siga as instruções de DNS

### Environment Variables de Produção
Após o deploy, você pode adicionar mais variáveis em:
Settings > Environment Variables

## 📊 Verificação do Deploy

Após o deploy bem-sucedido, teste estas URLs:
- **Aplicação Principal**: https://ailun-saude.vercel.app
- **API Endpoint**: https://ailun-saude.vercel.app/api/me
- **Teste de API**: https://ailun-saude.vercel.app/api/test

## 🐛 Troubleshooting

### Problemas Comuns:
1. **Build falha**: Verifique se todas as dependências estão no package.json
2. **404 errors**: Confirme que o vercel.json está configurado corretamente
3. **API não responde**: Verifique as variáveis de ambiente RAPIDOC_*

### Arquivos Importantes:
- `vercel.json` - Configuração de rotas e builds
- `api/[[...path]].js` - API principal
- `index.html` - Aplicação principal
- `.env` - Variáveis de ambiente (não faça upload deste arquivo)

## 📞 Suporte
Se precisar de ajuda:
1. Verifique os logs no dashboard Vercel
2. Teste localmente primeiro: `npm install && npm start`
3. Confirme que o repositório GitHub está público

---
**🔗 Links Importantes:**
- Dashboard Vercel: https://vercel.com/dashboard
- Repositório GitHub: https://github.com/ThalesAndrades/ailun-saude-digital
- Documentação Vercel: https://vercel.com/docs

**✅ Status**: Projeto pronto para deploy manual 🚀