# Regras do Projeto

## Commits

- **NUNCA** commite direto na main, develop, homolog ou stage. Sempre crie branch semantica correspondente com o que foi alterado/criado/modificado
- **NUNCA** incluir referências a "Claude", "Claude IA", "Generated with Claude Code", "Co-Authored-By: Claude" ou similares nas mensagens de commit
- Mensagens de commit devem seguir o padrão Conventional Commits (feat, fix, test, refactor, docs, chore)
- Escrever mensagens de commit em inglês

## Testes

- Testes unitários devem rodar no banco de testes (in-memory repositories)
- Testes de integração devem usar banco de dados de teste isolado
- Sempre rodar `npm test` antes de commitar para garantir que nenhum teste quebrou
- Comando para rodar testes: `docker compose exec -T app npm test`

## Banco de Dados

- Migrations devem ser geradas com Drizzle Kit: `npx drizzle-kit generate`
- Para rodar migrations no banco principal: `DATABASE_URL="postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_DATABASE}" npx drizzle-kit migrate`
- Para rodar migrations no banco de testes: usar DATABASE_URL do banco de testes

## Padrões de Código

- Usar injeção de dependência com `@Inject()` decorator
- Use Cases devem retornar `ModelOutput<T>` ou `ModelCollectionOutput<T>`
- Validação de formato (UUID, email, etc.) deve ser feita nos DTOs com class-validator
- Regras de negócio devem ficar nos Use Cases
- Entidades devem usar Value Objects para campos com validação

## Estrutura de Arquivos

- Use Cases: `src/modules/{module}/application/use-cases/{entity}/{action}/`
- DTOs de Use Case: `src/modules/{module}/application/use-cases/{entity}/{action}/dtos/`
- Controllers: `src/modules/{module}/application/controllers/`
- Providers: `src/modules/{module}/infra/providers/`
- Repositories: `src/modules/{module}/infra/repositories/`
