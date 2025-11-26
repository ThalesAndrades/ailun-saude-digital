# Ailun Saúde - Telemedicina

Aplicação web de telemedicina integrada à API Rapidoc para gestão de beneficiários e agendamento de consultas.

## Funcionalidades

- **Login seguro** com autenticação via API Rapidoc
- **Gestão de beneficiários** (cadastro, edição, inativação e reativação)
- **Agendamento de consultas** com lógica de negócio:
  - Especialidades médicas requerem encaminhamento após consulta geral
  - Psicologia e Nutrição podem ser agendadas diretamente
- **Dashboard administrativo** com interface responsiva
- **Solicitação de atendimento** com geração de URL

## Deploy no Vercel

### Configuração de Variáveis de Ambiente

Configure as seguintes variáveis no painel do Vercel:

```
RAPIDOC_BASE_URL=https://api.rapidoc.tech
RAPIDOC_CLIENT_ID=seu_client_id
RAPIDOC_TOKEN=seu_token
COOKIE_SECURE=true
```

### Estrutura de Arquivos

```
├── api/[[...path]].js      # Função serverless para proxy da API
├── assets/
│   ├── app.js             # Lógica JavaScript do frontend
│   └── style.css          # Estilos CSS
├── index.html             # Interface principal
├── vercel.json            # Configuração do Vercel
└── package.json           # Dependências
```

### Como Usar

1. Configure as variáveis de ambiente no Vercel
2. Acesse a URL do seu projeto
3. Faça login com suas credenciais da Rapidoc
4. Use o dashboard para gerenciar beneficiários e agendamentos

### Lógica de Negócio

- **Consulta Geral**: Primeira etapa obrigatória para especialidades médicas
- **Especialidades Médicas**: Requerem encaminhamento após consulta geral
- **Psicologia/Nutrição**: Podem ser agendadas diretamente sem encaminhamento

## Segurança

- Autenticação via cookies HTTP-only
- CORS configurado para domínios específicos
- Rate limiting implementado
- Headers de segurança com Helmet

## Suporte

Para problemas com a integração, verifique:
- Variáveis de ambiente configuradas corretamente
- Credenciais da API Rapidoc válidas
- Logs de erro no dashboard do Vercel