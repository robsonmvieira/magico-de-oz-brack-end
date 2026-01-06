# Mágico de Oz - CRM Backend

Sistema de CRM (Customer Relationship Management) desenvolvido com NestJS, seguindo princípios de Domain-Driven Design (DDD) e Clean Architecture.

## Sobre o Projeto

O Mágico de Oz é um CRM completo para gestão de leads, clientes e relacionamentos comerciais. O backend foi construído com foco em escalabilidade, manutenibilidade e testabilidade.

## Tecnologias

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| [NestJS](https://nestjs.com/) | 11.x | Framework Node.js para aplicações server-side |
| [TypeScript](https://www.typescriptlang.org/) | 5.x | Superset tipado do JavaScript |
| [Drizzle ORM](https://orm.drizzle.team/) | 0.45.x | ORM TypeScript-first para PostgreSQL |
| [PostgreSQL](https://www.postgresql.org/) | 16 | Banco de dados relacional |
| [Redis](https://redis.io/) | latest | Cache e sessões |
| [RabbitMQ](https://www.rabbitmq.com/) | 3.9 | Message broker para eventos |
| [Docker](https://www.docker.com/) | latest | Containerização |
| [Jest](https://jestjs.io/) | 29.x | Framework de testes |

## Arquitetura

O projeto segue a arquitetura DDD (Domain-Driven Design) com separação clara de camadas:

```
src/
├── modules/
│   ├── core/                    # Módulo core com abstrações base
│   │   └── domain/
│   │       └── repositories/    # Interfaces de repositórios
│   ├── shared/                  # Código compartilhado
│   │   ├── domain/
│   │   │   └── entities/        # Entidades base e Value Objects
│   │   └── infra/
│   │       └── repositories/    # Implementações base (DrizzleRepository)
│   ├── database/                # Configuração do Drizzle ORM
│   ├── env/                     # Configuração de variáveis de ambiente
│   └── lead/                    # Módulo de Leads
│       ├── domain/
│       │   ├── entities/        # Entidades de domínio
│       │   ├── models/          # Modelos de persistência (Drizzle schemas)
│       │   ├── repositories/    # Interfaces de repositórios
│       │   └── valueObject/     # Value Objects
│       ├── application/
│       │   ├── controllers/     # Controllers HTTP
│       │   ├── dto/             # Data Transfer Objects
│       │   └── usecases/        # Casos de uso
│       └── infra/
│           └── repositories/    # Implementações de repositórios
tests/
├── modules/                     # Testes organizados espelhando src/
│   └── lead/
│       ├── domain/
│       ├── application/
│       └── infra/
│           └── repositories/    # Testes de repositório (in-memory e integração)
```

## Requisitos

- Docker e Docker Compose
- Git

## Como Rodar

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

## Serviços

| Serviço | URL/Porta | Credenciais |
|---------|-----------|-------------|
| App (API) | http://localhost:4001 | - |
| PostgreSQL | localhost:5435 | postgres / postgres / magicoDb |
| PostgreSQL (Testes) | localhost:5436 | test / test / test_db |
| Redis | localhost:6380 | redisDev123 |
| RabbitMQ | http://localhost:15672 | admin / admin |

## Testes

### Testes Unitários

Testes unitários rodam sem banco de dados e usam implementações in-memory.

```bash
# Dentro do container
./dev.sh shell
npm test

# Ou sem entrar no shell
docker compose exec app npm test
```

### Testes de Integração

Testes de integração usam um banco PostgreSQL dedicado (`db-test`).

```bash
# 1. Subir o container do banco de teste
docker compose up -d db-test

# 2. Aplicar migrations no banco de teste
docker compose exec -T -e DATABASE_URL=postgresql://test:test@db-test:5432/test_db app npx drizzle-kit push

# 3. Rodar os testes de integração
docker compose exec app npm run test:integration
```

### Scripts disponíveis

| Script | Descrição |
|--------|-----------|
| `npm test` | Roda testes unitários (exclui integração) |
| `npm run test:watch` | Testes unitários em modo watch |
| `npm run test:cov` | Testes unitários com coverage |
| `npm run test:integration` | Roda testes de integração |

## Banco de Dados

### Drizzle ORM

O projeto usa [Drizzle ORM](https://orm.drizzle.team/) para gerenciamento do banco de dados.

```bash
# Gerar migrations
docker compose exec app npx drizzle-kit generate

# Aplicar migrations (desenvolvimento)
docker compose exec app npx drizzle-kit push

# Aplicar migrations (banco de teste)
docker compose exec -e DATABASE_URL=postgresql://test:test@db-test:5432/test_db app npx drizzle-kit push
```

## CI/CD

O projeto possui pipeline de CI configurada com GitHub Actions:

- **Lint & Format Check** - Verifica ESLint e Prettier
- **TypeScript Type Check** - Verifica tipos TypeScript
- **Unit & Component Tests** - Roda testes unitários
- **Integration Tests** - Roda testes de integração com PostgreSQL
- **Build Application** - Compila a aplicação
- **Security Audit** - Verifica vulnerabilidades nas dependências

## Estrutura de Arquivos

Tudo na pasta do projeto é sincronizado com `/home/node/app` dentro do container. Você pode editar arquivos no seu editor normalmente e as mudanças aparecem instantaneamente no container.

## Variáveis de Ambiente

O projeto usa arquivos `.env` separados por ambiente:

| Arquivo | Ambiente |
|---------|----------|
| `.env.local` | Desenvolvimento local (Docker) |
| `.env.test` | Testes de integração |
| `.env.development` | Ambiente de desenvolvimento |
| `.env.production` | Produção |

## Licença

Este projeto é proprietário e confidencial.
