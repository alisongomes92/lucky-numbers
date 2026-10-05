---
name: luckynumbers-context
description: >-
  Contexto completo do projeto Lucky Numbers (Gerador de Numeros da Sorte para Loterias Caixa)
  e suite de 10 apps para Play Store. Use SEMPRE que o usuario mencionar "Lucky Numbers",
  "lucky-numbers", "gerador de loteria", "app de loteria", "mega sena", "10 apps" ou quiser
  continuar o desenvolvimento. Ultima atualizacao: 2026-10-05 10:20.
---

# Lucky Numbers — Contexto do Projeto
Ultima atualizacao: 2026-10-05 10:20

## O que e

Aplicativo mobile premium para apostadores de loterias oficiais brasileiras (Mega-Sena, Lotofacil, Quina, Lotomania, Dupla Sena, Dia de Sorte, Timemania, Super Sete, Mais Milionaria).
Desenvolvido em React Native (Expo SDK 52) com foco em publicacao direta na Google Play Store como aplicativo pago (R$ 4,99) sem anuncios intrusivos.

Este e o **App #1** do plano estrategico de **10 Micro-Aplicativos** para monetizacao na Play Store.

## Localizacao

- Codigo-fonte do App: `c:\Users\aliso\OneDrive\Documentos\Projetos\Aplicativos\lucky-numbers\`
- Contexto Global: `C:\Users\aliso\.gemini\config\skills\luckynumbers-context\SKILL.md`
- Procedimento Salvar: `C:\Users\aliso\.gemini\config\skills\luckynumbers-salvar\SKILL.md`
- Procedimento Carregar: `C:\Users\aliso\.gemini\config\skills\luckynumbers-carregar\SKILL.md`
- Guia Play Store: `C:\Users\aliso\.gemini\config\skills\luckynumbers-playstore\SKILL.md`
- Plano dos 10 Apps: `plano_10_apps.md` (artifact no brain do IDE)

## Modelo de Negocio e Precificacao

- **Preco Play Store:** R$ 4,99 (compra unica - sem anuncios, foco em experiencia premium e confianca)
- **Diferenciais Competitivos (Pesquisa de Mercado):**
  - Quase todos os geradores concorrentes na Play Store estao entupidos de anuncios em video/banners e usam apenas geradores `Math.random()` genericos.
  - O **Lucky Numbers** oferece sincronizacao real com concursos historicos da Caixa via SQLite local, periodo de analise configuravel e explicacao pedagogica de 7 formulas matematicas/probabilisticas.
- **Publico-alvo:** Apostadores frequentes e casuais de loterias no Brasil (~dezenas de milhoes de apostadores).

## Stack Tecnologica

- **Framework:** React Native + Expo SDK 52 (TypeScript) — validado com `tsc --noEmit` (0 erros)
- **Navegacao:** `@react-navigation/bottom-tabs` + `@react-navigation/native` (Home, Gerador, Historico, Estatisticas)
- **Persistencia Local:** `expo-sqlite` (historico de apostas salvas + cache local de concursos da Caixa)
- **Comunicacao Reativa:** `EventBus` (`src/utils/eventBus.ts`) emitindo `ENTRY_SAVED` para atualizar a aba Salvos instantaneamente
- **Gradientes e Visual:** `expo-linear-gradient` com paleta dark mode premium (`src/theme/tokens.ts`)
- **API Externa:** API publica de resultados das Loterias Caixa com fallback e download em lote (batch)

## Estrutura de Arquivos Atual (2026-10-05)

```
lucky-numbers/
├── App.tsx                     # Entry point com Bottom Tab Navigator (4 tabs integradas)
├── app.json                    # Configuracao Expo, bundleIdentifier, dark mode, splash
├── package.json                # Dependencias Expo 52, react-navigation, sqlite, vector-icons
├── src/
│   ├── components/
│   │   ├── EntryCard.tsx       # Card de aposta salva com copiar, deletar e timestamp
│   │   ├── FrequencyBar.tsx    # Barra visual de frequencia estatistica com percentual
│   │   ├── LotteryCard.tsx     # Card de selecao de loteria na Home com gradientes oficiais
│   │   └── NumberBall.tsx      # Bolas numericas oficiais com gradientes
│   ├── data/
│   │   └── lotteries.ts        # Metadados e regras das 9 loterias oficiais brasileiras
│   ├── screens/
│   │   ├── HomeScreen.tsx      # Catalogo com busca e seletor rapido de loterias
│   │   ├── GeneratorScreen.tsx # Gerador inteligente: par/impar, soma, quentes, salvar com EventBus
│   │   ├── SavedScreen.tsx     # Historico SQLite recarregado instantaneamente por EventBus
│   │   └── StatsScreen.tsx     # Periodo flexivel (6m a tudo), quentes/frios/atrasados, 7 formulas
│   ├── services/
│   │   ├── lotteryApi.ts       # Endpoint Caixa com tratamento de rate-limit e mapeamento de concursos
│   │   └── syncService.ts      # Sincronizacao em lote com periodo em anos customizavel
│   ├── storage/
│   │   ├── database.ts         # SQLite para apostas salvas pelo usuario
│   │   └── statsDatabase.ts    # SQLite para cache de resultados historicos dos concursos
│   ├── theme/
│   │   └── tokens.ts           # Cores oficiais das 9 loterias, tipografia e tokens de design
│   └── utils/
│       ├── eventBus.ts         # Barramento de eventos global desacoplado (ENTRY_SAVED)
│       └── generator.ts        # Algoritmos combinatorios e distribuicoes balanceadas
└── .agents/skills/             # Copia local das skills no repositorio do projeto
```

## Estado Atual das Funcionalidades

1. **Catalogo Completo (Home):**
   - Suporte as 9 loterias da Caixa (Mega-Sena, Lotofacil, Quina, Lotomania, Dupla Sena, Dia de Sorte, Timemania, Super Sete, +Milionaria).

2. **Gerador Inteligente (GeneratorScreen):**
   - Geracao de 1 a 10 volantes simultaneos.
   - Filtros: equilibrio par/impar, faixa de soma combinatoria.
   - Botao Salvar corrigido e emitindo evento `ENTRY_SAVED` via `EventBus`.

3. **Historico Salvo (SavedScreen):**
   - Atualizacao em tempo real ao salvar (sem necessidade de reiniciar o app).
   - Filtro por modalidade, copiar jogos em lote e exclusao individual/total.

4. **Painel Estatistico em Tempo Real (StatsScreen):**
   - **Seletor de Periodo:** 6 meses, 1 ano, 2 anos, 3 anos, 5 anos, 10 anos ou Todo o Historico.
   - Filtros visuais: Todos, Quentes, Frios e Atrasados (com indicacao de sequencia de atraso).
   - Frequencia esperada calculada teoricamente.
   - **7 Formulas Matematicas com caixas didaticas e explicacao pratica:**
     - Analise Combinatoria Simples ($C(n,k)$)
     - Probabilidade Classica de Laplace ($P(A) = n(A)/n(\Omega)$)
     - Distribuicao Hipergeometrica
     - Lei dos Grandes Numeros
     - Falacia do Apostador (Gambler's Fallacy)
     - Desvio Padrao e Variancia
     - Entropia de Shannon

## Habilidades do Projeto (Skills)

- `luckynumbers-context`: Contexto completo do projeto (este documento).
- `luckynumbers-salvar`: Procedimento para salvar e persistir o estado do projeto ao fim da sessao.
- `luckynumbers-carregar`: Procedimento eficiente para restaurar o contexto em novas sessoes.
- `luckynumbers-playstore`: Guia detalhado de build EAS (`.aab`), ASO e publicacao a R$ 4,99.

## Portfolio dos 10 Apps (Roadmap Geral)

| # | App | Status | Preco Alvo |
|---|-----|--------|------------|
| 1 | **Lucky Numbers (Loterias & Estatisticas)** | MVP Avancado Concluido (100% Funcional) | R$ 4,99 |
| 2 | Calculadora de Combustivel (Gasolina vs Etanol) | Planejado | R$ 1,90 / Ads |
| 3 | Contador de Dias & Datas Especiais | Planejado | R$ 3,90 |
| 4 | Decisor Aleatorio (Roleta de Decisao) | Planejado | R$ 2,90 / Ads |
| 5 | Calculadora de Gorjeta & Divisao de Contas | Planejado | R$ 1,90 |
| 6 | Respiracao Guiada Anti-Ansiedade | Planejado | R$ 5,90 |
| 7 | Sons para Dormir (Ruido Branco & Natureza BR) | Planejado | Freemium |
| 8 | Regador de Plantas & Lembretes | Planejado | R$ 4,90 |
| 9 | Contador de Drinks & Alcoolimetro Social | Planejado | R$ 2,90 |
| 10| Marca D'agua em Lote para Fotos | Planejado | R$ 7,90 |

## Proximas Acoes Recomendadas

1. **Apostar nas Estatisticas:** Adicionar botao de atalho direto no `StatsScreen` ("Gerar aposta com os Quentes" ou "Gerar aposta com os Atrasados").
2. **Assets Graficos da Play Store:** Gerar icone oficial 512x512, feature graphic 1024x500 e splash screen definitiva.
3. **Build EAS de Producao:** Rodar `npx eas-cli build -p android --profile production` para gerar o primeiro pacote `.aab`.
4. **Politica de Privacidade:** Criar pagina estatica simples no GitHub Pages ou Notion para submissao no Google Play Console.
