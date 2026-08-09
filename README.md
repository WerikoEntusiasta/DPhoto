# FotoVenda SaaS — Plataforma de Venda de Fotos para Fotógrafos de Eventos

Uma plataforma SaaS moderna, simples e enxuta inspirada conceitualmente na Fotop, porém com uma experiência do usuário extremamente simplificada e mobile-first.

---

## 💡 10 Sugestões de Nomes Comerciais (Requisito #63)
1. **FotoVenda** (Nome Provisório)
2. **PicVenda**
3. **SnapClick**
4. **FotoSpot**
5. **GaleRia**
6. **ClickPro**
7. **FotoFlash**
8. **Picoo**
9. **FocalSaaS**
10. **FotoLink**

---

## 🏗️ 1. Arquitetura Proposta

O sistema adota uma arquitetura em camadas desacopladas:

```
Frontend (React + Tailwind CSS + Lucide Icons)
       │
       ▼
API REST / Controllers (Express + Server Actions)
       │
       ▼
Serviços de Negócio (Auth, Fee Engine, Watermark Service)
       │
       ▼
Repositório de Dados & Persistence Engine (ACID Disk JSON Store / Database)
       │
       ▼
Integradores Externos (Stripe Connect & Stripe Billing)
```

---

## 💳 2. Fluxo Financeiro e Estrutura da Stripe (Requisito #3, #5, #25)

### Regras Financeiras e Monetização
- **Plano Profissional (R$ 97,90/mês - Exclusivamente Mensal)**:
  - Mensalidade: **R$ 97,90/mês** (sem fidelidade ou contrato anual).
  - Comissão da Plataforma: **5%** sobre cada venda de foto realizada.
  - Repasse ao Fotógrafo: **95%** (menos taxas de processamento da Stripe).

### Exemplo Prático (Venda de R$ 100,00)
| Item | Valor |
|---|---|
| **Valor Bruto pago pelo Cliente** | R$ 100,00 |
| **Comissão Plataforma (5%)** | - R$ 5,00 |
| **Taxa Est. Processamento (Stripe ~3,99% + R$0,39)** | - R$ 4,38 |
| **Valor Destinado ao Fotógrafo** | **R$ 90,62** |

---

## 🔄 3. Fluxo de Onboarding Stripe Connect
1. Fotógrafo se cadastra no painel.
2. Na aba **Financeiro & Stripe Connect**, clica em "Conectar Conta Stripe".
3. A aplicação cria uma conta *Express* ou obtém o link do Stripe Connect Onboarding.
4. O fotógrafo é redirecionado e preenche a verificação oficial da Stripe.
5. A Stripe confirma a verificação via webhook/retorno e marca a conta como `VERIFIED`.
6. Ao realizar vendas, a taxa de aplicação (`application_fee_amount`) é retida pela plataforma e o valor restante é transferido via `transfer_data.destination` para a conta do fotógrafo.

---

## 🛒 4. Fluxo da Compra e Entrega de Fotos
1. O fotógrafo compartilha o link público do evento (`/f/joao-fotografia/corrida-sp-2026`).
2. O cliente abre no celular (WhatsApp/Instagram) sem necessidade de criar conta ou digitar senha.
3. Filtra pelo álbum ou digita o número do peito/atleta.
4. Seleciona as fotos desejadas e visualiza no carrinho.
5. Informa seu Nome, E-mail e WhatsApp para recebimento das fotos.
6. É redirecionado para o **Stripe Checkout**.
7. Após a confirmação confiável do pagamento (Webhook / Session Completed), a venda assume status `PAID`.
8. O cliente é direcionado para a tela de sucesso (`/compra/sucesso/:orderToken`), onde pode baixar cada foto em resolução máxima sem marca d'água ou baixar o arquivo ZIP completo.

---

## 🖼️ 5. Estratégia de Armazenamento e Marca d'Água
- **Original Protegido**: Fica armazenado em diretório/repositório protegido não acessível diretamente via URL pública.
- **Preview & Thumbnail Público**: O serviço de imagem (`WatermarkService`) gera versões com marca d'água diagonal e grade de proteção estampando o texto do fotógrafo (ex: `"JOÃO SILVA FOTOGRAFIA"`).
- **Download Restrito**: A rota `/api/downloads/:orderToken/:photoId` valida se o pedido existe, se pertence àquele token e se o pagamento tem status `PAID` antes de servir o arquivo original sem marca d'água.

---

## 🔒 6. Segurança e Conformidade (LGPD)
- **Zero armazenamento de dados de cartão**: Toda captura e tokenização de cartão e Pix é tratada exclusivamente pela Stripe.
- **Senhas Seguras**: Hashing SHA-256 com salting dinâmico no backend.
- **Minimização de Dados**: Coleta restrita para finalidades fiscais e operacionais.
- **Termos e Políticas**: Páginas dedicadas (`/termos` e `/privacidade`) para conformidade com a LGPD e declaração de direitos autorais pelo fotógrafo.

---

## 📂 7. Estrutura de Pastas
```
├── server.ts                  # Entry point Express + Vite middleware
├── server/
│   ├── db.ts                  # Persistence Engine e Seed inicial de demonstração
│   └── services/
│       ├── auth.ts            # Serviço de autenticação e hashing
│       ├── stripe.ts          # Integração Stripe Connect, Checkout, Billing & Webhooks
│       └── watermark.ts       # Gerador de marca d'água e previews
├── src/
│   ├── App.tsx                # Roteamento e orquestração de telas
│   ├── config/index.ts        # Configurações centrais do SaaS
│   ├── context/AuthContext.tsx# Estado global de autenticação
│   ├── lib/api.ts             # Cliente HTTP para API REST
│   ├── types/index.ts         # Tipos TypeScript compartilhados
│   ├── components/            # Componentes visuais reutilizáveis
│   └── pages/                 # Páginas (Landing, Dashboard, Galeria, Success, Admin)
├── package.json
└── .env.example
```

---

## 🚀 8. Como Rodar Localmente
1. Instale as dependências:
   ```bash
   npm install
   ```
2. Configure as variáveis de ambiente no arquivo `.env`:
   ```env
   APP_NAME="FotoVenda"
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRO_PRICE_ID=price_...
   ```
3. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
4. Acesse a aplicação no navegador em `http://localhost:3000`.
