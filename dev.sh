#!/bin/bash

# Script para facilitar o desenvolvimento no container Docker

case "$1" in
  start)
    echo "🚀 Iniciando containers..."
    docker-compose up -d
    echo "✅ Containers iniciados!"
    echo "📦 Instalando dependências..."
    docker exec -it magico-backend npm install
    echo "✅ Pronto para desenvolvimento!"
    echo ""
    echo "Para acessar o container, execute: ./dev.sh shell"
    ;;

  stop)
    echo "🛑 Parando containers..."
    docker-compose down
    echo "✅ Containers parados!"
    ;;

  shell)
    echo "🐚 Acessando shell do container..."
    docker exec -it magico-backend bash
    ;;

  logs)
    docker-compose logs -f app
    ;;

  rebuild)
    echo "🔨 Reconstruindo containers..."
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    docker exec -it magico-backend npm install
    echo "✅ Containers reconstruídos!"
    ;;

  install)
    echo "📦 Instalando dependências..."
    docker exec -it magico-backend npm install
    echo "✅ Dependências instaladas!"
    ;;

  dev)
    echo "🔥 Iniciando modo desenvolvimento..."
    docker exec -it magico-backend npm run start:dev
    ;;

  *)
    echo "📚 Comandos disponíveis:"
    echo ""
    echo "  ./dev.sh start    - Inicia os containers e instala dependências"
    echo "  ./dev.sh stop     - Para os containers"
    echo "  ./dev.sh shell    - Acessa o shell (bash) do container"
    echo "  ./dev.sh logs     - Mostra os logs do container"
    echo "  ./dev.sh rebuild  - Reconstrói os containers do zero"
    echo "  ./dev.sh install  - Instala/atualiza dependências"
    echo "  ./dev.sh dev      - Inicia o NestJS em modo desenvolvimento"
    echo ""
    ;;
esac
