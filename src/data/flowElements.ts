import { FlowElement } from '@/types/flow';

export const FLOW_ELEMENTS: FlowElement[] = [
  // Bubbles
  {
    id: 'text-bubble',
    type: 'textBubble',
    category: 'bubbles',
    label: 'Texto',
    icon: '💭',
    description: 'Exibe uma mensagem de texto'
  },
  {
    id: 'image-bubble',
    type: 'imageBubble',
    category: 'bubbles',
    label: 'Imagem',
    icon: '🖼️',
    description: 'Exibe uma imagem'
  },
  {
    id: 'video-bubble',
    type: 'videoBubble',
    category: 'bubbles',
    label: 'Vídeo',
    icon: '🎥',
    description: 'Reproduz um vídeo'
  },
  {
    id: 'audio-bubble',
    type: 'audioBubble',
    category: 'bubbles',
    label: 'Áudio',
    icon: '🎵',
    description: 'Reproduz um áudio'
  },

  // Inputs
  {
    id: 'text-input',
    type: 'textInput',
    category: 'inputs',
    label: 'Texto',
    icon: '📝',
    description: 'Campo de entrada de texto'
  },
  {
    id: 'number-input',
    type: 'numberInput',
    category: 'inputs',
    label: 'Número',
    icon: '#️⃣',
    description: 'Campo de entrada numérica'
  },
  {
    id: 'email-input',
    type: 'emailInput',
    category: 'inputs',
    label: 'Email',
    icon: '📧',
    description: 'Campo de entrada de email'
  },
  {
    id: 'website-input',
    type: 'websiteInput',
    category: 'inputs',
    label: 'Website',
    icon: '🌐',
    description: 'Campo de entrada de URL'
  },
  {
    id: 'date-input',
    type: 'dateInput',
    category: 'inputs',
    label: 'Data',
    icon: '📅',
    description: 'Seletor de data'
  },
  {
    id: 'phone-input',
    type: 'phoneInput',
    category: 'inputs',
    label: 'Telefone',
    icon: '📞',
    description: 'Campo de entrada de telefone'
  },
  {
    id: 'button-input',
    type: 'buttonInput',
    category: 'inputs',
    label: 'Botão',
    icon: '🔘',
    description: 'Botão de ação'
  },
  {
    id: 'image-selection',
    type: 'imageSelection',
    category: 'inputs',
    label: 'Seleção de Imagem',
    icon: '🖱️',
    description: 'Seletor de imagem'
  },
  {
    id: 'rating-input',
    type: 'ratingInput',
    category: 'inputs',
    label: 'Avaliação',
    icon: '⭐',
    description: 'Sistema de avaliação'
  },
  {
    id: 'cards-input',
    type: 'cardsInput',
    category: 'inputs',
    label: 'Cards',
    icon: '🃏',
    description: 'Seleção por cards'
  },

  // Condicionais
  {
    id: 'variable',
    type: 'variable',
    category: 'conditionals',
    label: 'Variável',
    icon: '📊',
    description: 'Define uma variável'
  },
  {
    id: 'condition',
    type: 'condition',
    category: 'conditionals',
    label: 'Condição',
    icon: '🔀',
    description: 'Lógica condicional'
  },
  {
    id: 'redirect',
    type: 'redirect',
    category: 'conditionals',
    label: 'Redirecionamento',
    icon: '↩️',
    description: 'Redireciona para outro fluxo'
  },
  {
    id: 'script',
    type: 'script',
    category: 'conditionals',
    label: 'Script',
    icon: '📜',
    description: 'Executa código personalizado'
  },
  {
    id: 'typebot',
    type: 'typebot',
    category: 'conditionals',
    label: 'Typebot',
    icon: '🤖',
    description: 'Integração com typebot'
  },
  {
    id: 'wait',
    type: 'wait',
    category: 'conditionals',
    label: 'Espera',
    icon: '⏳',
    description: 'Pausa na execução'
  }
];

export const ELEMENT_CATEGORIES = {
  bubbles: {
    label: 'Bubbles',
    color: 'category-bubble',
    elements: FLOW_ELEMENTS.filter(el => el.category === 'bubbles')
  },
  inputs: {
    label: 'Inputs',
    color: 'category-input', 
    elements: FLOW_ELEMENTS.filter(el => el.category === 'inputs')
  },
  conditionals: {
    label: 'Condicionais',
    color: 'category-conditional',
    elements: FLOW_ELEMENTS.filter(el => el.category === 'conditionals')
  }
};