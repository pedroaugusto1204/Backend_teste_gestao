# 🏗️ Gestão de Contratos & Controle de Obras — Backend API

API REST de produção desenvolvida como núcleo de um sistema SaaS multi-tenant para controle de contratos, orçamentos e custos de obras civis.

Construída em **Node.js + Express + TypeScript** com **Prisma ORM** e banco **PostgreSQL + pgvector**.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|:---|:---|
| Runtime | Node.js 18+ com TypeScript |
| Framework | Express.js |
| ORM | Prisma ORM v5 |
| Banco de Dados | PostgreSQL + pgvector (via Docker) |
| Autenticação | JWT (Access + Refresh tokens) |
| Validação | Zod |
| Upload | Multer |
| Dev Tools | Nodemon, ts-node |

---

## ⚙️ Pré-requisitos

- **Node.js** 18.0 ou superior
- **npm** 9.0 ou superior
- **Docker Desktop** (para subir o PostgreSQL automaticamente)

---

## 🚀 Setup Completo — Passo a Passo

### 1. Instalar dependências

```bash
npm install
```

---

### 2. Subir o banco de dados com Docker

O projeto usa a imagem `ankane/pgvector` com as seguintes configurações (definidas em `docker-compose.yml`):

| Parâmetro | Valor |
|:---|:---|
| Container | `postgres_vector_db` |
| Usuário | `user` |
| Senha | `password` |
| Database | `contratos_db` |
| Porta | `5432` |

```bash
docker compose up -d
```

> **Sem Docker?** Crie manualmente o banco `contratos_db` no seu PostgreSQL local e ajuste o `DATABASE_URL` no `.env`.

---

### 3. Criar o arquivo `.env`

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**Linux / macOS:**
```bash
cp .env.example .env
```

O `.env.example` já vem preenchido com as credenciais do Docker Compose. Se você usou o `docker compose up -d` com as configurações padrão, **não precisa alterar nada**.

Variáveis principais do `.env`:

```env
# Banco — deve bater com o docker-compose.yml
DATABASE_URL="postgresql://user:password@localhost:5432/contratos_db"

# JWT — troque os valores abaixo por strings longas e únicas em produção
JWT_SECRET="sua-chave-secreta-super-segura-aqui-minimo-32-caracteres"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_SECRET="sua-chave-refresh-super-segura-aqui-diferente-da-acima"
JWT_REFRESH_EXPIRES_IN="30d"

# Servidor
PORT=3001
NODE_ENV=development

# Frontend (CORS)
FRONTEND_URL=http://localhost:5173
```

> Email e WhatsApp são **simulados via log de console** — deixe os campos `SMTP_*` e `WHATSAPP_*` em branco durante o desenvolvimento.

---

### 4. Rodar as migrações do banco

```bash
npm run prisma:migrate
```

Esse comando aplica todas as migrações da pasta `prisma/migrations/` e sincroniza o Prisma Client tipado.

---

### 5. Popular o banco com dados de demonstração

```bash
npm run prisma:seed
```

Ao final, o terminal exibe confirmação e as credenciais de acesso.

---

### 6. Iniciar o servidor

```bash
npm run dev
```

- API disponível em: **`http://localhost:3001`**
- Healthcheck: **`http://localhost:3001/health`**
- Hot-reload ativo via Nodemon (qualquer alteração em `src/` reinicia automaticamente)

---

## 🔑 Credenciais de Teste (geradas pelo seed)

Todos os usuários pertencem à empresa **Constructora Sólida Ltda** (CNPJ `12.345.678/0001-90`).  
**Senha de todos os usuários:** `senha123!`

| E-mail | Papel | Permissões |
|:---|:---|:---|
| `admin@solida.com.br` | `ADMIN` | Acesso total — configurações, usuários, contratos, obras |
| `marcos@solida.com.br` | `MANAGER` | Cria obras, lança custos, gera e aprova OCs |
| `mariana.costa@solida.com.br` | `OPERATOR` | Lançamentos operacionais e consultas básicas |
| `ricardo@solida.com.br` | `VIEWER` | Somente leitura (conta inativa no seed) |

---

## 🗂️ Estrutura de Diretórios

```
src/
├── config/              → Cliente Prisma, configurações JWT e globais
├── middlewares/         → Auth JWT, Tenant guard (multi-tenant), Auditoria, Upload, Erros
├── modules/             → Módulos de domínio isolados:
│   ├── auth/            → Registro de tenants, login, refresh token, /me
│   ├── companies/       → Dados corporativos da empresa (tenant)
│   ├── users/           → Gestão de usuários por empresa
│   ├── templates/       → Templates dinâmicos de contrato com campos mesclados
│   ├── contracts/       → Geração, vigência, encerramento de contratos
│   ├── signatures/      → Assinaturas eletrônicas com token único
│   ├── obras/           → Canteiros, etapas, custos e vistorias
│   ├── purchase-orders/ → Ordens de compra (numeração OC-ANO-SEQ)
│   ├── uploads/         → Upload e persistência de mídias
│   └── audit/           → Trilha de auditoria de ações
└── utils/               → Helpers de resposta JSON, paginação e formatadores

prisma/
├── schema.prisma        → Schema do banco (modelos e relações)
├── seed.ts              → Script de dados de demonstração
└── migrations/          → Histórico de migrações
```

---

## 📡 Principais Endpoints

Todas as rotas (exceto `/api/auth/*` e `/api/signatures/sign/:token`) exigem:

```
Authorization: Bearer <accessToken>
```

O tenant é injetado automaticamente a partir do token JWT — nenhum parâmetro extra é necessário.

### 🔐 Auth
| Método | Rota | Descrição |
|:---|:---|:---|
| `POST` | `/api/auth/register` | Cria empresa + primeiro usuário Admin |
| `POST` | `/api/auth/login` | Login → retorna `accessToken`, `refreshToken`, `user`, `company` |
| `POST` | `/api/auth/refresh` | Renova o access token com um refresh token válido |
| `GET` | `/api/auth/me` | Dados do usuário autenticado |

### 📄 Contratos
| Método | Rota | Descrição |
|:---|:---|:---|
| `GET` | `/api/contracts` | Lista contratos (paginação + filtros de status/texto) |
| `POST` | `/api/contracts` | Cria novo contrato |
| `GET` | `/api/contracts/dashboard/kpis` | KPIs para dashboard |
| `POST` | `/api/signatures/contracts/:contractId/send` | Dispara link de assinatura eletrônica |

### 🚧 Obras
| Método | Rota | Descrição |
|:---|:---|:---|
| `GET` | `/api/obras` | Lista obras da empresa |
| `POST` | `/api/obras` | Cria obra com endereço e orçamento |
| `POST` | `/api/obras/:id/steps/seed` | Popula obra com as 21 etapas padrão de construção civil |
| `POST` | `/api/obras/:id/custos` | Lança custo real (atualiza financeiro instantaneamente) |
| `GET` | `/api/obras/:id/summary` | Resumo consolidado (gasto total, progresso %, saldo) |

### 🛍️ Ordens de Compra
| Método | Rota | Descrição |
|:---|:---|:---|
| `GET` | `/api/purchase-orders/next-number` | Próximo número disponível (ex: `OC-2026-0003`) |
| `POST` | `/api/purchase-orders` | Cria OC com itens, impostos e descontos |
| `POST` | `/api/purchase-orders/:id/approve` | Aprova OC (requer perfil MANAGER ou ADMIN) |

---

## 🛠️ Scripts npm Disponíveis

| Comando | O que faz |
|:---|:---|
| `npm run dev` | Inicia servidor com hot-reload (desenvolvimento) |
| `npm run build` | Compila TypeScript para `dist/` |
| `npm run start` | Inicia versão compilada (`dist/server.js`) |
| `npm run prisma:migrate` | Aplica migrações e sincroniza Prisma Client |
| `npm run prisma:seed` | Popula banco com dados de demonstração |
| `npm run prisma:studio` | Abre interface visual do banco em `http://localhost:5555` |
| `npm run prisma:reset` | ⚠️ Apaga tudo, remigra e re-executa o seed |
| `npm run prisma:generate` | Regenera Prisma Client após editar `schema.prisma` |
| `npm run typecheck` | Valida tipagem TypeScript sem compilar |

---

## ✉️ Simulação de Assinaturas Eletrônicas

Email e WhatsApp são simulados via log estruturado no terminal — nenhuma configuração de SMTP ou API externa é necessária para testar:

```
📧 [SIMULAÇÃO EMAIL] ─────────────────────────────────
  Para:              manoel@pintoresabc.com.br
  Nome:              Manoel da Silva (Pintores ABC)
  Contrato:          Pintura Fachada Residencial Bela Vista
  Link para Assinar: http://localhost:5173/sign/token-pintura-5544
──────────────────────────────────────────────────────
```

Copie o link do console e abra no navegador para completar o fluxo de assinatura e atualizar o status do contrato para `SIGNED`.

---

## 🔒 Multi-Tenancy

Todos os dados são isolados por `company_id`. Um middleware injeta automaticamente o escopo do tenant a partir do JWT em todas as queries — impossibilitando acesso cruzado entre empresas distintas.
