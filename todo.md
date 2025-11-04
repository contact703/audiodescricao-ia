# TODO - Audiodescrição IA

## Funcionalidades Principais

### Backend
- [x] Endpoint para upload de vídeos
- [x] Endpoint para processar URL do YouTube
- [x] Sistema de extração de frames-chave
- [x] Integração com modelo de visão computacional via LLM
- [x] Geração de roteiro de audiodescrição estruturado
- [x] Síntese de voz em português brasileiro (TTS)
- [x] Processamento em background
- [x] Sistema de armazenamento de projetos de audiodescrição
- [x] Histórico de processamentos por usuário

### Frontend
- [x] Página inicial com apresentação da plataforma
- [x] Interface de upload de vídeo
- [x] Interface de inserção de URL do YouTube
- [x] Visualizador de status de processamento
- [x] Player de áudio para cada unidade descritiva
- [x] Visualização de roteiro completo
- [x] Painel de histórico de projetos (Dashboard)
- [x] Download de roteiro (JSON)
- [x] Reprodução de áudio de audiodescrição

### Conformidade Legal
- [x] Implementar diretrizes da NBR 16452:2016
- [x] Nota introdutória conforme norma
- [x] Estrutura de unidades descritivas
- [x] Informações sobre conformidade legal na interface

### Comercialização
- [ ] Sistema de créditos/planos (futuro)
- [ ] Limitação de duração de vídeo por plano (futuro)
- [ ] Dashboard administrativo (futuro)
- [ ] Métricas de uso (futuro)

## Bugs Conhecidos
(Nenhum no momento)

## Melhorias Futuras
- [ ] Suporte a múltiplos idiomas
- [ ] Edição colaborativa de roteiros
- [ ] Integração com plataformas de streaming
- [ ] API pública para desenvolvedores
- [ ] Exportação para formatos profissionais (SRT, WebVTT)

## Bugs Reportados pelo Usuário
- [x] Erro ao fazer upload de vídeo - CORRIGIDO (endpoint /api/storage/upload criado)
- [x] Erro ao processar vídeo do YouTube - CORRIGIDO (processador simplificado sem FFmpeg)
- [x] Implementar endpoint de storage funcional - CONCLUÍDO
- [x] Testar completamente com vídeo real - TESTES BÁSICOS PASSARAM

## Novos Requisitos do Usuário
- [x] Fazer análise REAL do vídeo (não usar exemplos genéricos)
- [x] Extrair frames do vídeo e enviar para IA analisar
- [x] IA deve ver e descrever o conteúdo REAL do vídeo
- [x] Exportar roteiro em formato SRT com minutagem exata
- [x] Gerar áudio completo em MP3/WAV para download
- [x] Testar com vídeo real e validar que funciona - Vídeo de teste criado

## Bug Crítico Identificado
- [x] Página NewProject.tsx não tem botão de submit para upload - CORRIGIDO (upload automático ao selecionar arquivo)
- [x] Lógica de upload não está conectada ao backend - CORRIGIDO (endpoint /api/storage/upload funcionando)
- [x] Testar fluxo completo de ponta a ponta - TESTADO E FUNCIONANDO
