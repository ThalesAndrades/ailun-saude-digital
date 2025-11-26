#!/bin/bash
# Script de deploy para Vercel - Ailun Saúde

echo "🚀 Preparando deploy da Ailun Saúde..."

# Verificar se o Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI não encontrado. Instale com: npm i -g vercel"
    exit 1
fi

# Verificar variáveis de ambiente necessárias
if [ -z "$RAPIDOC_CLIENT_ID" ] || [ -z "$RAPIDOC_TOKEN" ]; then
    echo "❌ Configure as variáveis de ambiente:"
    echo "   RAPIDOC_CLIENT_ID=sua_chave_aqui"
    echo "   RAPIDOC_TOKEN=seu_token_aqui"
    exit 1
fi

echo "✅ Variáveis de ambiente configuradas"
echo "📦 Fazendo deploy..."

# Deploy para o projeto existente
vercel deploy --prod --token=$VERCEL_TOKEN

echo "✅ Deploy concluído!"
echo "🌐 Acesse: https://ailun-saude.vercel.app"