# Audiodescrição IA - Cinema Acessível

Plataforma web de audiodescrição automática para filmes usando inteligência artificial open source.

## 🚀 Setup Rápido

### 1. Instalar Dependências

```bash
pnpm install
```

### 2. Configurar yt-dlp (OBRIGATÓRIO)

```bash
./yt-dlp-setup.sh
```

Este script instala o yt-dlp e cria o wrapper necessário para download de vídeos do YouTube.

### 3. Executar Migrações do Banco de Dados

```bash
pnpm db:push
```

### 4. Iniciar Servidor de Desenvolvimento

```bash
pnpm dev
```

A aplicação estará disponível em `http://localhost:3000`

## 📋 Funcionalidades

- ✅ Upload de vídeos locais
- ✅ Download de vídeos do YouTube
- ✅ Análise REAL de vídeo frame por frame com IA
- ✅ Geração de roteiro conforme NBR 16452:2016
- ✅ Síntese de voz em português brasileiro
- ✅ Exportação em JSON e SRT
- ✅ Dashboard de projetos
- ✅ Conformidade com legislação brasileira (LBI)

## 🛠️ Tecnologias

- **Frontend**: React 19, Tailwind CSS 4, tRPC, Wouter
- **Backend**: Node.js, Express, tRPC, Drizzle ORM
- **IA**: LLM com visão computacional, TTS
- **Banco de Dados**: MySQL/TiDB
- **Processamento**: FFmpeg, yt-dlp

## ⚖️ Conformidade Legal

Esta aplicação segue as normas brasileiras:
- ABNT NBR 16452:2016 - Acessibilidade na Comunicação - Audiodescrição
- Lei 13.146/2015 (LBI) - Lei Brasileira de Inclusão da Pessoa com Deficiência
