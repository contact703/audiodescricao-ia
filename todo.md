# TODO - Audiodescrição IA

## PROBLEMAS CRÍTICOS REPORTADOS
- [ ] Versão publicada não funciona: caminhos absolutos `/home/ubuntu/audiodescricao-ia`
- [ ] Upload não tem botão para iniciar processo
- [ ] Não suporta vídeos grandes (precisa upload em chunks)
- [ ] Timing da audiodescrição: deve detectar silêncios/pausas no áudio original
- [ ] Testar TUDO na versão publicada antes de entregar

## CORREÇÕES NECESSÁRIAS
- [x] Remover caminhos absolutos do código - CORRIGIDO (usa process.cwd())
- [x] Usar caminhos relativos ou variáveis de ambiente - CONCLUÍDO
- [ ] Adicionar botão "Processar" no upload
- [ ] Implementar upload em chunks (multipart)
- [ ] Implementar detecção de silêncios com FFmpeg
- [ ] Gerar timestamps baseados em silêncios detectados
- [ ] Testar na versão publicada do Manus

## FASE 1 - MELHORIAS ANTERIORES (CONCLUÍDAS)
- [x] Barra de progresso em tempo real
- [x] Upload de vídeo funcionando
- [x] YouTube funcionando
- [x] Downloads JSON e SRT
- [x] Commit no GitHub
- [x] ZIP gerado
