# Android App - SecureNet

Este diretório representa um esqueleto do aplicativo Android para o cliente SecureNet.

## Funcionalidades previstas

- tela inicial com status da proteção
- conexão VPN por região
- exibição de latência e velocidade
- DNS seguro e bloqueio de domínios maliciosos
- scanner de APK e verificação de riscos
- proteção contra ameaças e histórico de eventos

## Build sugerido

- Kotlin + Compose
- Navigation component
- Hilt / Dagger para injeção de dependência
- Retrofit para consumo da API REST
- WireGuard SDK para conexão VPN

## Configuração de ambiente

```kotlin
val API_URL = "https://api.securenet.com"
val API_KEY = "GERADA_PELO_SISTEMA"
```

> Nunca armazenar chaves reais no código-fonte público.
