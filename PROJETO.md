# Audiodescrição IA - Cinema Acessível

## 📋 Visão Geral

Plataforma web completa para geração automática de audiodescrição de filmes usando inteligência artificial open source. A aplicação analisa vídeos, identifica cenas importantes e gera audiodescrição narrada em português brasileiro, seguindo as normas técnicas brasileiras (ABNT NBR 16452:2016) e a Lei Brasileira de Inclusão (LBI).

## 🎯 Objetivo

Tornar o cinema mais acessível para pessoas cegas e com baixa visão, democratizando a produção de audiodescrição através de tecnologia open source, sem custos de APIs externas e pronta para comercialização.

## ✨ Funcionalidades Principais

### Para Usuários

- **Upload de Vídeos**: Envie arquivos de vídeo (MP4, WebM, OGG, MOV) até 500MB
- **Integração YouTube**: Cole uma URL do YouTube para processar vídeos online
- **Processamento Automático**: IA analisa o vídeo frame por frame
- **Roteiro Estruturado**: Gera roteiro de audiodescrição conforme NBR 16452:2016
- **Áudio Narrado**: Síntese de voz em português brasileiro para cada descrição
- **Dashboard**: Visualize e gerencie todos os seus projetos
- **Download**: Baixe roteiros em JSON e áudios individuais

### Tecnologias Open Source

- **Visão Computacional**: Modelo de IA via LLM para análise de imagens
- **Processamento de Vídeo**: FFmpeg para extração de frames
- **Download YouTube**: yt-dlp para obter vídeos do YouTube
- **Síntese de Voz**: Google TTS (API gratuita) para narração em português
- **Backend**: Node.js + Express + tRPC
- **Frontend**: React 19 + Tailwind CSS + shadcn/ui
- **Banco de Dados**: MySQL/TiDB
- **Armazenamento**: S3 para vídeos, frames e áudios

## 📚 Conformidade Legal

A plataforma foi desenvolvida com base em extensa pesquisa sobre:

### Legislação Brasileira

- **Lei 13.146/2015 (LBI)**: Lei Brasileira de Inclusão da Pessoa com Deficiência
  - Artigo 67: Garante o direito à audiodescrição em serviços de radiodifusão
  - Artigo 42: Acessibilidade em websites e aplicações

- **ABNT NBR 16452:2016**: Acessibilidade na Comunicação - Audiodescrição
  - Nota introdutória obrigatória
  - Estrutura de unidades descritivas
  - Diretrizes de linguagem e estilo
  - Recomendação de revisão por profissionais

- **Instrução Normativa nº 165/2022 (ANCINE)**: Acessibilidade em obras audiovisuais

### Demandas da Comunidade

Baseado em pesquisas em fóruns e artigos científicos sobre as necessidades de pessoas cegas:

- Descrições objetivas e claras
- Contexto adequado sem interpretações subjetivas
- Linguagem no presente do indicativo
- Identificação de personagens, ações, cenários e atmosfera
- Qualidade do áudio narrado

## 🏗️ Arquitetura do Sistema

### Fluxo de Processamento

1. **Recebimento do Vídeo**
   - Upload direto ou URL do YouTube
   - Validação de formato e tamanho
   - Upload para S3 (se necessário)

2. **Extração de Frames**
   - FFmpeg extrai frames a cada 10 segundos
   - Frames são enviados para S3
   - Metadados salvos no banco de dados

3. **Análise com IA**
   - Cada frame é analisado por modelo de visão computacional
   - IA gera descrições seguindo diretrizes da NBR 16452
   - Descrições são estruturadas em unidades descritivas

4. **Geração de Roteiro**
   - Nota introdutória é adicionada
   - Unidades descritivas são organizadas por timestamp
   - Roteiro completo é salvo em JSON

5. **Síntese de Voz**
   - Cada unidade descritiva é convertida em áudio
   - Google TTS gera narração em português brasileiro
   - Áudios são salvos no S3

6. **Finalização**
   - Projeto marcado como concluído
   - Usuário pode visualizar e baixar resultados

### Estrutura do Banco de Dados

**Tabela `ad_projects`**
- Informações do projeto (título, fonte, status)
- Referência ao vídeo no S3
- Roteiro completo em JSON
- Timestamps de criação e conclusão

**Tabela `ad_units`**
- Unidades descritivas individuais
- Timestamp, tipo (nota introdutória ou descrição)
- Texto da descrição
- Referência ao áudio no S3

## 🚀 Como Usar

### Acesso Online

A aplicação está disponível em: https://3000-i1pj9ujcoxo2xdqhi5qlb-2998e34a.manusvm.computer

### Criar Primeiro Projeto

1. Faça login na plataforma
2. Clique em "Novo Projeto"
3. Digite um título para o projeto
4. Escolha uma das opções:
   - **YouTube**: Cole a URL do vídeo
   - **Upload**: Selecione um arquivo de vídeo
5. Aguarde o processamento (pode levar alguns minutos)
6. Visualize o roteiro e ouça as audiodescrições

### Gerenciar Projetos

- **Dashboard**: Veja todos os seus projetos
- **Status**: Acompanhe o processamento em tempo real
- **Visualizar**: Clique em um projeto para ver detalhes
- **Download**: Baixe roteiros em JSON
- **Áudio**: Ouça cada unidade descritiva
- **Deletar**: Remova projetos que não precisa mais

## 💡 Metodologia de Audiodescrição

A plataforma implementa um fluxo híbrido IA + Humano:

### Fase Automatizada (IA)

1. **Análise Visual**: IA identifica elementos visuais importantes
2. **Geração de Descrições**: Texto objetivo e claro
3. **Estruturação**: Organização conforme NBR 16452
4. **Narração**: Síntese de voz em português

### Fase Humana (Recomendada)

Para uso profissional, recomenda-se:

1. **Audiodescritor Roteirista**: Revisa e refina descrições
2. **Audiodescritor Consultor**: Pessoa cega valida clareza
3. **Narrador Profissional**: Regrava áudio com qualidade superior (opcional)

## 🔧 Desenvolvimento Local

### Pré-requisitos

- Node.js 22+
- MySQL/TiDB
- FFmpeg
- Python 3 (para yt-dlp)

### Instalação

```bash
# Clonar repositório
git clone https://github.com/contact703/audiodescricao-ia.git
cd audiodescricao-ia

# Instalar dependências
pnpm install

# Instalar ferramentas do sistema
sudo apt-get install ffmpeg
pip3 install yt-dlp

# Configurar banco de dados
pnpm db:push

# Iniciar servidor de desenvolvimento
pnpm dev
```

### Variáveis de Ambiente

As variáveis são injetadas automaticamente pela plataforma Manus:

- `DATABASE_URL`: Conexão MySQL
- `BUILT_IN_FORGE_API_KEY`: Chave para LLM
- `BUILT_IN_FORGE_API_URL`: URL da API do LLM
- Outras variáveis de autenticação e storage

## 📊 Limitações Atuais

- **Duração do Vídeo**: Recomendado até 10 minutos (processamento mais rápido)
- **Tamanho do Arquivo**: Máximo 500MB para upload
- **Qualidade da IA**: Descrições podem precisar de revisão humana
- **TTS**: Voz sintética, não substitui narrador profissional
- **Idioma**: Apenas português brasileiro

## 🔮 Melhorias Futuras

- [ ] Suporte a múltiplos idiomas
- [ ] Editor de roteiro inline
- [ ] Exportação para SRT/WebVTT
- [ ] Integração com plataformas de streaming
- [ ] API pública para desenvolvedores
- [ ] Sistema de planos e créditos
- [ ] Narração profissional opcional
- [ ] Edição colaborativa de roteiros

## 📄 Licença

Este projeto usa apenas tecnologias open source e pode ser comercializado livremente.

## 🤝 Contribuições

Desenvolvido com base em:

- Pesquisa sobre legislação brasileira de acessibilidade
- Análise de demandas da comunidade de pessoas cegas
- Normas técnicas da ABNT
- Políticas públicas de inclusão

## 📞 Suporte

Para dúvidas ou sugestões, entre em contato através da plataforma Manus.

---

**Audiodescrição IA - Cinema Acessível**  
*Tecnologia Open Source para Inclusão Real*
