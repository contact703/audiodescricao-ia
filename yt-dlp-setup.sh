#!/bin/bash
# Script para configurar yt-dlp em qualquer ambiente

# Criar wrapper yt-dlp-clean se não existir
if [ ! -f /usr/local/bin/yt-dlp-clean ]; then
  echo "Criando wrapper yt-dlp-clean..."
  sudo tee /usr/local/bin/yt-dlp-clean > /dev/null << 'WRAPPER'
#!/bin/bash
# Limpar variáveis de ambiente do Python para evitar conflitos
unset PYTHONPATH
unset PYTHONHOME
exec /usr/bin/python3.11 /usr/local/bin/yt-dlp "$@"
WRAPPER
  sudo chmod +x /usr/local/bin/yt-dlp-clean
  echo "✅ Wrapper criado!"
fi

# Verificar se yt-dlp existe
if [ ! -f /usr/local/bin/yt-dlp ]; then
  echo "Instalando yt-dlp..."
  sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
  sudo chmod a+rx /usr/local/bin/yt-dlp
  echo "✅ yt-dlp instalado!"
fi

echo "✅ Setup completo!"
