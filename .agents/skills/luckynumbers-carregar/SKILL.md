---
name: luckynumbers-carregar
description: >-
  Carrega o contexto completo e atual do projeto Lucky Numbers (Gerador de Loterias e Suite 10 Apps).
  Use quando o usuario disser "carregar contexto", "carregar tudo", "retomar projeto",
  "continuar lucky numbers", "continuar loteria" ou no inicio de qualquer sessao de desenvolvimento.
  Le os arquivos chave e reconstroi o contexto com maxima eficiencia de tokens.
---

# luckynumbers-carregar — Procedimento de Carregamento de Contexto

## O que esta skill faz

Restaura o contexto do projeto Lucky Numbers de forma rapida e sem desperdicio de tokens,
lendo apenas a documentacao de contexto persistente e os arquivos essenciais.

## Procedimento passo a passo

### 1. Ler o contexto salvo

Leia o arquivo de contexto persistente:
`C:\Users\aliso\.gemini\config\skills\luckynumbers-context\SKILL.md`

Este arquivo contem a arquitetura, status de implementacao e proximas etapas.

### 2. Verificar os ultimos arquivos modificados

Execute um comando rapido no terminal para checar mudancas recentes:

```powershell
Get-ChildItem "c:\Users\aliso\OneDrive\Documentos\Projetos\Aplicativos\lucky-numbers" -Recurse -File |
  Where-Object { $_.FullName -notmatch 'node_modules|\.git|\.expo' } |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 5 @{N='Arquivo';E={$_.FullName.Replace('c:\Users\aliso\OneDrive\Documentos\Projetos\Aplicativos\lucky-numbers\','')}}, LastWriteTime
```

### 3. Verificar estado do servidor de desenvolvimento

Verifique se a porta `8081` ou processo Expo esta ativo:

```powershell
Get-Process -Name "node" -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, CPU
```

### 4. Reportar o estado ao usuario

Informe:
- 📱 Status das 4 abas (Home, Gerador, Salvos, Estatisticas)
- 🚀 Ultimas alteracoes feitas (ex: periodo flexivel, formulas matematicas, EventBus)
- 🎯 As 3 proximas acoes recomendadas para continuar
- Pergunte: "Continuamos de onde paramos — [acao recomendada]?"
