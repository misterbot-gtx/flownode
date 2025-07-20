# Documentação dos Elementos de Fluxo

Este documento descreve todos os elementos disponíveis para construção de fluxos no projeto, suas categorias, objetivos e funcionalidades.

---

## Objetivo

Fornecer uma referência clara dos elementos que podem ser utilizados no construtor visual de fluxos, detalhando suas categorias, ícones, descrições e finalidades.

---

## Categorias de Elementos

### 1. **Bubbles**
Elementos para exibição de conteúdo ao usuário.

| ID             | Tipo         | Label   | Ícone | Descrição                  |
|----------------|--------------|---------|-------|----------------------------|
| text-bubble    | textBubble   | Texto   | 💬    | Exibe uma mensagem de texto|
| image-bubble   | imageBubble  | Imagem  | 🖼️    | Exibe uma imagem           |
| video-bubble   | videoBubble  | Vídeo   | 🎥    | Reproduz um vídeo          |
| audio-bubble   | audioBubble  | Áudio   | 🎵    | Reproduz um áudio          |

---

### 2. **Inputs**
Elementos para coleta de informações do usuário.

| ID               | Tipo            | Label              | Ícone | Descrição                   |
|------------------|-----------------|--------------------|-------|-----------------------------|
| text-input       | textInput       | Texto              | 📝    | Campo de entrada de texto   |
| number-input     | numberInput     | Número             | #️⃣    | Campo de entrada numérica   |
| email-input      | emailInput      | Email              | 📧    | Campo de entrada de email   |
| website-input    | websiteInput    | Website            | 🌐    | Campo de entrada de URL     |
| date-input       | dateInput       | Data               | 📅    | Seletor de data             |
| phone-input      | phoneInput      | Telefone           | 📞    | Campo de entrada de telefone|
| button-input     | buttonInput     | Botão              | 🔘    | Botão de ação               |
| image-selection  | imageSelection  | Seleção de Imagem  | 🖱️    | Seletor de imagem           |
| rating-input     | ratingInput     | Avaliação          | ⭐    | Sistema de avaliação        |
| cards-input      | cardsInput      | Cards              | 🃏    | Seleção por cards           |

---

### 3. **Condicionais**
Elementos para lógica, controle de fluxo e integrações.

| ID           | Tipo        | Label            | Ícone | Descrição                        |
|--------------|-------------|------------------|-------|-----------------------------------|
| variable     | variable    | Variável         | 📊    | Define uma variável               |
| condition    | condition   | Condição         | 🔀    | Lógica condicional                |
| redirect     | redirect    | Redirecionamento | ↩️    | Redireciona para outro fluxo      |
| script       | script      | Script           | 📜    | Executa código personalizado      |
| typebot      | typebot     | Typebot          | 🤖    | Integração com typebot            |
| wait         | wait        | Espera           | ⏳    | Pausa na execução                 |

---

## Cores das Categorias

- **Bubbles:** `category-bubble`
- **Inputs:** `category-input`
- **Condicionais:** `category-conditional`

---

## Observações

- Os elementos são definidos no arquivo `src/data/flowElements.ts`.
- Cada elemento possui: `id`, `type`, `category`, `label`, `icon` e `description`.
- As categorias são utilizadas para organizar e estilizar os elementos no construtor visual.
