# Documentação: Desaninhamento de Nós Filhos nos Grupos

## Problema Original

Quando um elemento estava dentro de um grupo, qualquer interação de clique ou arrasto sobre esse elemento disparava o comportamento do grupo inteiro — ou seja, o grupo era selecionado e movido, em vez do elemento individual.

## Solução Implementada

### Arquivos Principais

1. **`src/components/flow/useFlowLogic.ts`** - Lógica principal dos handlers
2. **`src/components/flow/FlowBuilder.tsx`** - Conexão dos handlers ao ReactFlow
3. **`src/components/flow/nodes/GroupNode.tsx`** - Primeiro teste com eventos DOM
4. **`src/index.css`** - Estilos CSS para feedback visual
5. **`src/components/flow/UngroupExample.tsx`** - Exemplo de implementação

### Comportamento Implementado

#### 1. **Desaninhamento Imediato**
- Ao clicar e segurar um elemento filho, ele é imediatamente desaninhado do grupo (`parentId` removido)
- Elemento segue o cursor livremente sem restrições do grupo

#### 2. **Prevenção de Propagação**
- `stopPropagation()` nos handlers previne que o grupo seja selecionado ou movido
- Permite interação direta com elementos filhos

#### 3. **Feedback Visual**
- **Durante o arrasto**: Elemento é renderizado com sombra dupla e indicador visual
- **Fora do grupo**: Borda vermelha e classe CSS `.node-dragging-outside`
- **Sobreposição global**: Radial gradient para indicar estado especial

#### 4. **Detecção de Limites**
- Monitoramento contínuo dos bounds DOM do grupo original
- Comparação com bounds do nó durante o arrasto
- Feedback visual baseado na posição relativa

#### 5. **Resultado Final**
- **Soltar fora do grupo**: Nó se torna raiz independente (`parentId: undefined`)
- **Soltar dentro do grupo**: Nó permanece como filho

### Estados de Controle

```typescript
const [draggedChildNodeId, setDraggedChildNodeId] = useState<string | null>(null);
const [originalParentId, setOriginalParentId] = useState<string | undefined>(undefined);
const [isDraggingOutsideGroup, setIsDraggingOutsideGroup] = useState(false);
```

### Handlers Principais

#### `onNodeDragStart`
1. Remove `parentId` imediatamente
2. Salva estados de controle
3. Impede propagação para o grupo

#### `onNodeDrag`
1. Monitora bounds do grupo original
2. Detecta colisão usando `getBoundingClientRect()`
3. Atualiza feedback visual

#### `onNodeDragStop`
1. Limpa todos os estados
2. Remove feedback visual
3. Confirma resultado final

### Estilos CSS Implementados

```css
.node-dragging-outside {
  animation: groupWarning 0.3s ease-in-out infinite alternate;
  border: 3px solid #ef4444;
}

@keyframes groupWarning {
  0% { box-shadow: 0 0 15px rgba(239, 68, 68, 0.6); }
  100% { box-shadow: 0 0 25px rgba(239, 68, 68, 0.9); }
}

.global-drag-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  background: radial-gradient(circle at center, transparent 40%, rgba(239, 68, 68, 0.1) 100%);
  z-index: 9999;
}
```

## Como Usar

### Implementação Completa

```typescript
import { createUngroupHandlers } from './UngroupExample';

const FlowComponent = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [draggedChildNodeId, setDraggedChildNodeId] = useState<string | null>(null);
  const [originalParentId, setOriginalParentId] = useState<string | undefined>(undefined);
  const [isDraggingOutsideGroup, setIsDraggingOutsideGroup] = useState(false);

  const handlers = createUngroupHandlers({
    setNodes,
    draggedChildNodeId,
    setDraggedChildNodeId,
    originalParentId,
    setOriginalParentId,
    isDraggingOutsideGroup,
    setIsDraggingOutsideGroup,
  });

  return (
    <ReactFlow
      nodes={nodes}
      onNodesChange={setNodes}
      onNodeDragStart={handlers.onNodeDragStart}
      onNodeDrag={handlers.onNodeDrag}
      onNodeDragStop={handlers.onNodeDragStop}
      // ... outras props
    />
  );
};
```

### Via Hook Customizado (Recomendado)

```typescript
import { useFlowLogic } from './useFlowLogic';

const FlowComponent = () => {
  const {
    nodes,
    setNodes,
    draggedChildNodeId,
    originalParentId,
    isDraggingOutsideGroup,
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,
  } = useFlowLogic();

  return (
    <ReactFlow
      nodes={nodes}
      onNodesChange={setNodes}
      onNodeDragStart={onNodeDragStart}
      onNodeDrag={onNodeDrag}
      onNodeDragStop={onNodeDragStop}
    />
  );
};
```

## Teste de Funcionamento

1. **Criação**: Adicione um grupo com nós filhos (`parentId` definido)
2. **Clique**: Clique em um nó filho - deve ser selecionado individualmente
3. **Arraste**: Arraste o nó - deve seguir o cursor livremente
4. **Saída**: Ao sair dos limites do grupo, indicador visual vermelho aparece
5. **Soltar**: Ao soltar fora do grupo, o nó se torna independente

## Benefícios da Solução

- ✅ **Interação Individual**: Elementos filhos podem ser manipulados independentemente
- ✅ **Feedback Visual Claro**: Usuário sempre sabe o que vai acontecer
- ✅ **Comportamento Intuitivo**: Seguir princípios de UX esperados
- ✅ **Integração Nativa**: Usa handlers built-in do React Flow
- ✅ **Performance**: CSS e DOM otimizados para não afetar performance
- ✅ **Manutenibilidade**: Código bem estruturado e documentado

## Notas Técnicas

- **Z-index**: Elemento arrastado é renderizado acima dos outros nós
- **StopPropagation**: Impede bubbling para elementos pai
- **Bounds Checking**: Verificação precisa de colisão DOM
- **Estado Controlado**: Feedback visual sincronizado com lógica de negócio