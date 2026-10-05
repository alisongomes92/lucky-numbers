---
name: luckynumbers-salvar
description: >-
  Salva o estado atual do projeto Lucky Numbers (Gerador de Loterias) no arquivo de contexto persistente.
  Use esta skill quando o usuario disser "salvar contexto", "salvar progresso", "salvar tudo",
  "atualizar contexto" ou ao encerrar uma sessao de desenvolvimento.
  Atualiza o SKILL.md do luckynumbers-context com o estado real e atual do projeto.
---

# luckynumbers-salvar — Procedimento de Salvamento de Contexto

## O que esta skill faz

Atualiza o arquivo de contexto persistente em:
`C:\Users\aliso\.gemini\config\skills\luckynumbers-context\SKILL.md`
e replica a copia local no repositorio em:
`c:\Users\aliso\OneDrive\Documentos\Projetos\Aplicativos\lucky-numbers\.agents\skills\luckynumbers-context\SKILL.md`

Este arquivo e lido automaticamente em sessoes futuras, garantindo memoria perfeita do progresso do app e economizando tempo e tokens.

## Procedimento passo a passo

### 1. Inspecionar arquivos modificados recentemente

Execute no PowerShell para listar os ultimos arquivos alterados:

```powershell
Get-ChildItem "c:\Users\aliso\OneDrive\Documentos\Projetos\Aplicativos\lucky-numbers" -Recurse -File |
  Where-Object { $_.FullName -notmatch 'node_modules|\.git|\.expo' } |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 10 @{N='Arquivo';E={$_.FullName.Replace('c:\Users\aliso\OneDrive\Documentos\Projetos\Aplicativos\lucky-numbers\','')}}, LastWriteTime
```

### 2. Verificar o status dos componentes e telas

Avalie o que foi implementado:
- `App.tsx` (rotas e navegacao)
- `src/screens/` (HomeScreen, GeneratorScreen, SavedScreen, StatsScreen)
- `src/services/` (lotteryApi, syncService)
- `src/storage/` (database, statsDatabase)
- `src/utils/` (eventBus, generator)
- `app.json` e configuracoes de build

### 3. Reescrever o SKILL.md de luckynumbers-context

Atualize:
- Timestamp no topo (`Ultima atualizacao: YYYY-MM-DD HH:MM`)
- Funcionalidades recentemente adicionadas
- Status da compilacao e testes
- Proximas acoes prioritarias (3 a 5 itens especificos)
- Decisoes de arquitetura tomadas durante a sessao

### 4. Sincronizar copia local no projeto

Copie ou reescreva o conteudo atualizado para:
`c:\Users\aliso\OneDrive\Documentos\Projetos\Aplicativos\lucky-numbers\.agents\skills\luckynumbers-context\SKILL.md`

### 5. Confirmar ao usuario

Exiba um resumo conciso contendo:
- ✅ Status das principais telas e modulos
- 📅 Timestamp do salvamento
- 🎯 As proximas acoes recomendadas para a proxima sessao
