# 🏠 Imobiliária Porto Iguaçu

Plataforma web completa para uma imobiliária real, com site público de busca de imóveis e um **CRM próprio** para gestão interna dos anúncios. Projeto em produção, desenvolvido do zero (front-end, back-end e banco de dados).

**🔗 Site em produção:** [imobiliariaportoiguacu.com.br](https://imobiliariaportoiguacu.com.br)

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?logo=postgresql&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?logo=tailwind-css&logoColor=white)

---

## ✨ Funcionalidades

### Site público
- 🔍 Busca de imóveis com filtros por finalidade (venda/aluguel), tipo, cidade e bairro
- 🏘️ Catálogo com diversos tipos de imóvel (casa, apartamento, terreno, comercial, rural, litoral, sobrado, kitnet...)
- ⚖️ Comparador de imóveis lado a lado
- 📊 Página de índices do mercado imobiliário
- 🗺️ Mapa interativo com a localização dos imóveis (Leaflet)
- 💬 Contato direto via WhatsApp e formulário de solicitação
- 📱 Layout 100% responsivo

### Painel administrativo (CRM)
- 🔐 Autenticação e área restrita (NextAuth)
- 📝 Cadastro, edição e gestão de imóveis
- 🖼️ Upload de imagens com compressão automática e otimização (Sharp + Cloudinary)
- ☁️ Armazenamento de arquivos em nuvem (S3-compatible / Cloudflare R2)

---

## 🛠️ Stack técnica

| Camada | Tecnologias |
|---|---|
| **Front-end** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS |
| **Back-end** | Next.js API Routes / Server Actions, NextAuth |
| **Banco de dados** | PostgreSQL + Prisma ORM |
| **Storage** | AWS S3 SDK (Cloudflare R2), Cloudinary, Supabase |
| **Imagens** | Sharp, browser-image-compression |
| **Mapas** | Leaflet / React-Leaflet |
| **Deploy** | Vercel |

---

## 🚀 Rodando localmente

### Pré-requisitos
- Node.js 18+
- Banco PostgreSQL (local ou serviço como Supabase/Neon)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/KaikeSouza1/Imobiliaria.git
cd Imobiliaria

# Instale as dependências
npm install
```

### Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com base no exemplo abaixo:

```env
# Banco de dados
DATABASE_URL=

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Armazenamento (S3 / Cloudflare R2)
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=
S3_ENDPOINT=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### Executando as migrations

```bash
npx prisma migrate dev
```

### Ambiente de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## 📁 Estrutura do projeto

```
├── app/            # Rotas e páginas (App Router)
├── components/     # Componentes reutilizáveis de UI
├── lib/            # Configurações, utilitários e integrações (Prisma, storage, etc.)
├── public/          # Arquivos estáticos
├── middleware.ts    # Middleware de autenticação/rotas
```

---

## 👨‍💻 Autor

Desenvolvido por **Kaike Souza**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/kaike-de-souza-755595281/)
[![GitHub](https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=white)](https://github.com/KaikeSouza1)

---

## 📄 Licença

Este projeto foi desenvolvido sob demanda para um cliente real. O código está disponível para fins de portfólio; caso queira reaproveitá-lo, entre em contato.
