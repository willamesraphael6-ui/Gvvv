# SecureNet VPN Platform

Plataforma completa para VPS com painel administrativo, API REST, gestão de VPN, DNS seguro, proteção de rede, análise de APK e documentação OpenAPI.

## Visão geral

A solução foi estruturada como um conjunto pronto para produção, com:

- painel administrativo em Node.js + Express
- API REST com autenticação por Bearer Token e API Key
- documentação OpenAPI/Swagger em `/docs`
- monitoramento e estatísticas de VPS e VPN
- gestão de servidores regionais, VPN, DNS e ameaças
- exemplos de integração para Lovable, JavaScript, TypeScript, React e Android
- ambiente Docker com Nginx, PostgreSQL e Redis

## Estrutura

- `server.js` - servidor Express principal
- `public/admin` - painel administrativo estático
- `examples` - exemplos de consumo da API
- `docker-compose.yml` - ambiente Docker
- `nginx/default.conf` - proxy reverso
- `android` - esqueleto do app Android

## Como executar

1. Instale dependências:
   ```bash
   npm install
   ```

2. Copie o ambiente:
   ```bash
   cp .env.example .env
   ```

3. Inicie a aplicação:
   ```bash
   npm run dev
   ```

4. Acesse:
   - painel administrativo: http://localhost:3000/admin
   - documentação Swagger: http://localhost:3000/docs
   - OpenAPI: http://localhost:3000/openapi.json
   - status da API: http://localhost:3000/api/v1/status

## Auth

O sistema usa:

- Bearer Token para usuários administrativos
- API Key para integrações externas
- hash da API Key em banco; o valor completo só é exibido na criação

## API principal

- `POST /api/v1/auth/login`
- `POST /api/v1/api-keys`
- `GET /api/v1/servers`
- `GET /api/v1/vpn/regions`
- `POST /api/v1/vpn/connect`
- `GET /api/v1/dns`
- `POST /api/v1/security/scan`
- `GET /api/v1/network/ping`
- `GET /api/v1/status`

## Segurança

- HTTPS obrigatório em produção
- JWT de curta duração + refresh token
- rate limiting
- Helmet, CSP e CORS configurável
- validação de entrada e logs de auditoria
- uso de hash para segredos

## Limitações

A VPN optimiza rota e estabilidade, mas não garante aumento físico de velocidade nem bloqueio absoluto de anúncios em todos os aplicativos. O app deve exibir claramente quais proteções estão ativas e em que camada elas operam.

## Observação

Este scaffold entrega a arquitetura, rotas e interface administrativa para uma implementação profissional em produção, com dados de exemplo e documentação de integração.
