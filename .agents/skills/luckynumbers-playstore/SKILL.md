---
name: luckynumbers-playstore
description: >-
  Guia e procedimentos para publicacao do aplicativo Lucky Numbers na Google Play Store a R$ 4,99.
  Use quando o usuario perguntar sobre "publicar na play store", "gerar apk", "gerar aab",
  "build eas", "aso", "precificar aplicativo", "conta google play console" ou "politica de privacidade".
---

# luckynumbers-playstore — Guia de Publicacao na Google Play Store

## Visao Geral

- **App:** Lucky Numbers — Gerador Inteligente de Loterias & Estatisticas Oficiais
- **Preco:** R$ 4,99 (Aplicativo Pago, sem publicidade intrusiva)
- **Formato obrigatorio:** Android App Bundle (`.aab`) assinado via EAS Build

---

## 1. Configuracao do `app.json` para Producao

Certifique-se de que o `app.json` contenha:
```json
{
  "expo": {
    "name": "Lucky Numbers: Loterias & Estatísticas",
    "slug": "lucky-numbers",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#0A0E17"
    },
    "android": {
      "package": "com.alison.luckynumbers",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/android-icon-foreground.png",
        "backgroundColor": "#0A0E17"
      },
      "permissions": ["INTERNET", "ACCESS_NETWORK_STATE"]
    }
  }
}
```

---

## 2. Gerando o Pacote de Producao (`.aab`) com EAS Build

### Passo 1: Instalar e autenticar o EAS CLI
```powershell
npx -y eas-cli login
```

### Passo 2: Configurar o projeto no Expo/EAS
```powershell
npx -y eas-cli build:configure
```

### Passo 3: Gerar o arquivo `eas.json` com perfil de producao:
```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### Passo 4: Executar o build na nuvem (gera o .aab sem precisar de Android Studio local)
```powershell
npx -y eas-cli build --platform android --profile production
```

---

## 3. Checklist de Requisitos Google Play Console

1. **Conta de Desenvolvedor Google Play:**
   - Taxa unica de $25 USD.
   - Perfil de pagamentos (Merchant Profile) configurado para receber o valor das vendas de R$ 4,99.
2. **Assets Graficos Obrigatorios:**
   - Icone de alta resolucao: 512 x 512 px (PNG 32-bit com transparencia).
   - Grafico de Recursos (Feature Graphic): 1024 x 500 px (sem texto pequeno, destaque visual premium).
   - Screenshots do App: Minimo 2 capturas de tela (resolucao minima 1080 x 1920 ou 1080 x 2400).
3. **Politica de Privacidade:**
   - Obrigatoria para qualquer app na Play Store. Pode ser hospedada gratuitamente no GitHub Pages ou Notion.
   - Deve declarar que o app consulta a API publica das loterias e armazena os dados localmente no dispositivo (SQLite) sem coletar dados sensiveis.
4. **Classificacao de Conteudo:**
   - Questionario do IARC: Marcar como simulador/gerador de numeros, nao casino com dinheiro real dentro do app. Classificacao indicativa recomendada: Livre ou 12+.

---

## 4. Estrategia de ASO (App Store Optimization)

- **Titulo (max 30 caracteres):** `Lucky Numbers: Gerador Loterias`
- **Descricao Curta (max 80 caracteres):** `Gerador inteligente para Mega-Sena, Lotofácil e Quina com estatísticas reais.`
- **Descricao Longa:** Destacar:
  - Totalmente sem anuncios e sem assinaturas (pagamento unico).
  - 9 loterias oficiais brasileiras suportadas.
  - Sincronizacao em tempo real de resultados dos concursos.
  - Filtros inteligentes (par/impar, soma, quentes, frios, atrasados).
  - Formulas matematicas e probabilidade explicadas de forma didatica.
  - Historico local dos seus palpites salvos no dispositivo.
