# Magico de Oz - NestJS CRM Backend

Ambiente de desenvolvimento 100% isolado usando Docker.

## 🚀 Como usar

### Primeira vez / Iniciar ambiente

```bash
./dev.sh start
```

Isso vai:
- Subir todos os containers (App, PostgreSQL, Redis, RabbitMQ)
- Instalar todas as dependências Node.js dentro do container

### Acessar o shell do container

```bash
./dev.sh shell
```

Você estará dentro do container com zsh configurado. A partir daí pode rodar:
- `npm run start:dev` - Iniciar NestJS em modo desenvolvimento
- `nest g module users` - Gerar módulos
- `npm install pacote` - Instalar pacotes
- Qualquer comando do NestJS ou npm

### Iniciar desenvolvimento (sem entrar no shell)

```bash
./dev.sh dev
```

### Outros comandos úteis

```bash
./dev.sh stop      # Parar containers
./dev.sh logs      # Ver logs
./dev.sh rebuild   # Reconstruir do zero
./dev.sh install   # Reinstalar dependências
```

## 🐳 Serviços disponíveis

- **App**: http://localhost:4001
- **PostgreSQL**: localhost:5435
  - User: postgres
  - Password: postgres
  - Database: magicoDb
- **Redis**: localhost:6380
  - Password: redisDev123
- **RabbitMQ**: http://localhost:15672
  - User: admin
  - Password: admin

## 📁 Estrutura

Tudo na pasta do projeto é sincronizado com `/home/node/app` dentro do container. Você pode editar arquivos no Cursor normalmente e as mudanças aparecem instantaneamente no container.
