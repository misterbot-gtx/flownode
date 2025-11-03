# Sistema de Posicionamento Automático para Grupos

## 🎯 Problema Resolvido

**Problema Original:** Elementos adicionados aos grupos não apareciam visualmente dentro dos grupos.

## 🔧 Soluções Implementadas

### 1. Correção da Exibição de Elementos nos Grupos

#### **Causa Principal: Filtragem Incorreta**
- **Arquivo:** `src/components/flow/useFlowLogic.ts`
- **Problema:** Função `visibleNodes` filtrava todos os nós com `parentId`
- **Solução:** Removida a filtragem para permitir renderização de nós filhos

```typescript
// ANTES (problemático):
const visibleNodes = useMemo(() => {
  const filtered = nodes.filter(node => !node.parentId); // ❌ Remove nós filhos
  return filtered;
}, [nodes]);

// DEPOIS (corrigido):
const visibleNodes = useMemo(() => {
  return nodes; // ✅ Inclui todos os nós, incluindo filhos
}, [nodes]);
```

#### **Causa Secundária: Desagrupamento Automático**
- **Arquivo:** `src/components/flow/useFlowLogic.ts`
- **Problema:** Função `onNodeDragStart` removia automaticamente elementos do grupo
- **Solução:** Removido o desagrupamento automático

```typescript
// ANTES (problemático):
const onNodeDragStart = useCallback((event, node) => {
  if (node.parentId) {
    // Removia automaticamente parentId
  }
}, [nodes, setNodes]);

// DEPOIS (corrigido):
const onNodeDragStart = useCallback((event, node) => {
  if (node.parentId) {
    console.log('Nó iniciado com parentId:', node.id, 'grupo:', node.parentId);
    // ✅ NÃO remove automaticamente - mantém no grupo
  }
}, [nodes, setNodes]);
```

### 2. Sistema de Posicionamento Automático

#### **Constantes de Layout**
```typescript
const GROUP_PADDING = 16;    // Padding interno do grupo
const HEADER_HEIGHT = 60;    // Altura do header do grupo
const CHILD_SPACING = 8;     // Espaçamento entre filhos
const CHILD_HEIGHT = 80;     // Altura padrão dos filhos
const GROUP_DEFAULT_WIDTH = 280; // Largura padrão do grupo
const GROUP_MIN_HEIGHT = 120;    // Altura mínima do grupo
```

#### **Função de Posicionamento Relativo**
```typescript
const calculateChildPosition = useCallback((index: number, totalChildren: number) => {
  const padding = GROUP_PADDING;
  const headerHeight = HEADER_HEIGHT;
  
  const x = padding; // Sempre alinhado à esquerda com padding
  const y = headerHeight + (index * (CHILD_HEIGHT + CHILD_SPACING)) + padding;
  
  return { x, y };
}, []);
```

**Fórmula de Posicionamento:**
- **X:** `padding(16)` - Sempre alinhado à esquerda
- **Y:** `header(60) + index * (height(80) + spacing(8)) + padding(16)`

#### **Função de Redimensionamento Automático**
```typescript
const calculateGroupDimensions = useCallback((childCount: number) => {
  const width = GROUP_DEFAULT_WIDTH;
  const minHeight = GROUP_MIN_HEIGHT;
  
  const calculatedHeight = HEADER_HEIGHT + 
    (childCount * CHILD_HEIGHT) + 
    ((childCount - 1) * CHILD_SPACING) + 
    (GROUP_PADDING * 2);
  
  const height = Math.max(minHeight, calculatedHeight);
  return { width, height };
}, []);
```

**Fórmula de Dimensão:**
- **Largura:** `280px` (fixa)
- **Altura:** `header(60) + children*80 + (children-1)*8 + padding*2`

### 3. Criação Automática de Elementos com Posicionamento

#### **Função `addChildToGroup`**
```typescript
const addChildToGroup = useCallback((groupId, element, insertIndex) => {
  // 1. Buscar grupo atual
  const targetGroup = nodes.find(n => n.id === groupId);
  
  // 2. Calcular posição automática
  const childPosition = calculateChildPosition(finalIndex, existingChildren.length + 1);
  
  // 3. Criar nó com extent: 'parent'
  const newNode = {
    id: `${element.type}-${nodeId}`,
    type: nodeType,
    position: childPosition, // Posição relativa ao grupo
    parentId: targetGroup.id,
    extent: 'parent' as const, // 🔑 CRÍTICO: mantém posição relativa
  };
  
  // 4. Reorganizar automaticamente
  setTimeout(() => {
    reorganizeGroupChildren(groupId, newChildrenOrder);
  }, 0);
}, []);
```

### 4. Reorganização Automática

#### **Função `reorganizeGroupChildren`**
```typescript
const reorganizeGroupChildren = useCallback((groupId, newChildrenOrder) => {
  updateChildrenPositions(groupId, newChildrenOrder);
  resizeGroup(groupId, newChildrenOrder);
}, [updateChildrenPositions, resizeGroup]);
```

#### **Atualização de Posições**
```typescript
const updateChildrenPositions = useCallback((groupId, childNodes) => {
  setNodes((nds) => {
    const updatedNodes = [...nds];
    
    childNodes.forEach((child, index) => {
      const newPosition = calculateChildPosition(index, childNodes.length);
      
      const childIndex = updatedNodes.findIndex(n => n.id === child.id);
      if (childIndex !== -1) {
        updatedNodes[childIndex] = {
          ...updatedNodes[childIndex],
          position: newPosition,
        };
      }
    });
    
    return updatedNodes;
  });
}, [calculateChildPosition, setNodes]);
```

## 📋 Estrutura de Dados Correta

### **Grupo com Elementos**
```typescript
{
  "id": "group-1",
  "type": "groupNode",
  "position": { "x": 300, "y": 200 },
  "width": 280,
  "height": 226,
  "data": { "title": "Grupo de Teste" }
}
```

### **Elemento Filho com Posição Relativa**
```typescript
{
  "id": "texto-1",
  "type": "textNode",
  "position": { "x": 16, "y": 76 }, // Posição relativa ao grupo
  "parentId": "group-1",
  "extent": "parent" as const, // 🔑 Mantém posição relativa
  "data": {
    "label": "Texto",
    "element": { /* dados do elemento */ }
  }
}
```

## 🎯 Benefícios do Sistema

### **1. Posicionamento Automático**
- ✅ Elementos são posicionados automaticamente ao serem adicionados
- ✅ Layout consistente com padding e espaçamento
- ✅ Alinhamento perfeito à esquerda com indentação

### **2. Redimensionamento Inteligente**
- ✅ Grupo se ajusta automaticamente ao número de filhos
- ✅ Altura mínima garantida para grupos vazios
- ✅ Cálculo preciso baseado no conteúdo

### **3. Manutenção da Posição Relativa**
- ✅ `extent: 'parent'` mantém posição relativa ao mover o grupo
- ✅ Filhos acompanham o grupo quando arrastado
- ✅ Posições absolutas calculadas automaticamente

### **4. Reorganização Automática**
- ✅ Posições recalculadas ao adicionar/remover filhos
- ✅ Espaçamento preservado entre elementos
- ✅ Ordem visual respeitada

### **5. Controle de Desagrupamento**
- ✅ Elementos só saem do grupo quando explicitamente arrastados para fora
- ✅ Feedback visual durante o arrasto
- ✅ Remoção automática quando solto fora do grupo

## 🧪 Testes Implementados

### **1. Teste de Correção (`test-correcao-grupo.tsx`)**
- Valida que elementos aparecem nos grupos
- Verifica estrutura de dados com `parentId` e `extent: 'parent'`
- Testa funcionalidades de arrasto e reorganização

### **2. Teste de Posicionamento (`test-posicionamento-automatico.tsx`)**
- Demonstra cálculo automático de posições
- Verifica redimensionamento automático
- Testa funções de posicionamento individualmente

## 📁 Arquivos Modificados

### **Principais**
- `src/components/flow/useFlowLogic.ts` - Lógica principal e funções de posicionamento
- `src/components/flow/nodes/GroupNode.tsx` - Componente do grupo com área de drop

### **Testes**
- `src/test/test-correcao-grupo.tsx` - Teste de correção básica
- `src/test/test-posicionamento-automatico.tsx` - Teste de funcionalidades avançadas

### **Documentação**
- `src/docs/sistema-posicionamento-automatico.md` - Este documento

## 🚀 Como Usar

### **Adicionar Elemento ao Grupo**
```typescript
// O sistema já funciona automaticamente ao arrastar elementos para o grupo
// Posicionamento e redimensionamento são calculados automaticamente
```

### **Criar Grupo com Dimensões Automáticas**
```typescript
flow.createGroup(); // Cria grupo com dimensões baseadas em filhos (0 inicialmente)
```

### **Reorganizar Elementos**
```typescript
// Arrastar e soltar elementos dentro do grupo
// Sistema recalcula posições automaticamente
```

### **Mover Grupo Completo**
```typescript
// Arrastar o grupo move todos os elementos вместе
// extent: 'parent' mantém posicionamento relativo
```

## ✨ Resultado Final

O sistema agora oferece:
1. **Exibição correta** de elementos dentro dos grupos
2. **Posicionamento automático** com layout profissional
3. **Redimensionamento inteligente** baseado no conteúdo
4. **Manutenção de posições relativas** durante movimentos
5. **Reorganização automática** ao modificar estrutura
6. **Controle preciso** de desagrupamento

Todos os requisitos foram atendidos com uma solução robusta e extensível.