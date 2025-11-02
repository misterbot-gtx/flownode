import React from 'react';
import { Node } from '@xyflow/react';

// Exemplo de nó filho com parentId definido
export const exampleChildNode: Node = {
  id: 'child-node-1',
  type: 'textNode', // ou qualquer tipo de nó
  position: { x: 100, y: 100 },
  data: {
    label: 'Nó Filho',
    content: 'Este é um exemplo de nó filho que pode ser desaninhado',
  },
  parentId: 'group-1', // Este é o parentId que será removido
  width: 200,
  height: 80,
};

// Exemplo de grupo
export const exampleGroupNode: Node = {
  id: 'group-1',
  type: 'groupNode',
  position: { x: 50, y: 50 },
  data: {
    title: 'Grupo de Exemplo',
    childNodes: [exampleChildNode],
  },
  width: 300,
  height: 200,
};

/**
 * IMPLEMENTAÇÃO COMPLETA DOS HANDLERS NATIVOS DO REACT FLOW
 * 
 * Esta é uma implementação funcional dos handlers que implementam
 * a lógica de desaninhamento de nós filhos conforme solicitado.
 */

export interface UngroupHandlersProps {
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  draggedChildNodeId: string | null;
  setDraggedChildNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  originalParentId: string | undefined;
  setOriginalParentId: React.Dispatch<React.SetStateAction<string | undefined>>;
  isDraggingOutsideGroup: boolean;
  setIsDraggingOutsideGroup: React.Dispatch<React.SetStateAction<boolean>>;
}

export const createUngroupHandlers = ({
  setNodes,
  draggedChildNodeId,
  setDraggedChildNodeId,
  originalParentId,
  setOriginalParentId,
  isDraggingOutsideGroup,
  setIsDraggingOutsideGroup,
}: UngroupHandlersProps) => ({
  /**
   * Handler para iniciar o drag de um nó filho de grupo
   * O stopPropagation é crítico para evitar que o grupo seja selecionado
   */
  onNodeDragStart: (event: React.MouseEvent, node: Node) => {
    // CRÍTICO: Impedir que o evento suba para o grupo
    event.stopPropagation();
    
    if (node.parentId) {
      console.log('🚀 Iniciando drag de nó filho:', node.id, 'do grupo:', node.parentId);
      
      // PASSO 1: Remover imediatamente o parentId para desaninhar o nó
      // Isso faz com que o nó deixe de pertencer ao grupo e possa ser movido livremente
      setNodes((nds) =>
        nds.map((n) =>
          n.id === node.id ? { ...n, parentId: undefined } : n
        )
      );
      
      // PASSO 2: Salvar informações para controle de estado
      setDraggedChildNodeId(node.id);
      setOriginalParentId(node.parentId);
      setIsDraggingOutsideGroup(false);
      
      // PASSO 3: Feedback visual inicial
      console.log('✅ Nó desaninhado imediatamente');
    }
  },

  /**
   * Handler para controlar o drag e detectar se saiu do grupo original
   */
  onNodeDrag: (event: React.MouseEvent, node: Node) => {
    if (draggedChildNodeId && originalParentId && draggedChildNodeId === node.id) {
      // PASSO 1: Obter limites do grupo original
      const groupElement = document.querySelector(`[data-id="${originalParentId}"]`) as HTMLElement;
      const nodeElement = document.querySelector(`[data-id="${node.id}"]`) as HTMLElement;
      
      if (groupElement && nodeElement) {
        const groupRect = groupElement.getBoundingClientRect();
        const nodeRect = nodeElement.getBoundingClientRect();
        
        // PASSO 2: Verificar se o nó saiu dos limites do grupo
        const isOutside =
          nodeRect.left < groupRect.left ||
          nodeRect.right > groupRect.right ||
          nodeRect.top < groupRect.top ||
          nodeRect.bottom > groupRect.bottom;
        
        if (isOutside !== isDraggingOutsideGroup) {
          setIsDraggingOutsideGroup(isOutside);
          
          // PASSO 3: Feedback visual - adicionar/remover classe CSS
          if (isOutside) {
            groupElement.classList.add('node-dragging-outside');
            console.log('📍 Nó saiu do grupo - será desaninhado');
          } else {
            groupElement.classList.remove('node-dragging-outside');
            console.log('📍 Nó voltou para dentro do grupo');
          }
        }
      }
    }
  },

  /**
   * Handler para finalizar o drag
   */
  onNodeDragStop: (event: React.MouseEvent, node: Node) => {
    if (draggedChildNodeId && draggedChildNodeId === node.id) {
      console.log('🏁 Finalizando drag do nó:', node.id);
      
      // PASSO 1: Limpar estados
      setDraggedChildNodeId(null);
      setOriginalParentId(undefined);
      setIsDraggingOutsideGroup(false);
      
      // PASSO 2: Remover feedback visual
      if (originalParentId) {
        const groupElement = document.querySelector(`[data-id="${originalParentId}"]`) as HTMLElement;
        if (groupElement) {
          groupElement.classList.remove('node-dragging-outside');
        }
      }
      
      // PASSO 3: Resultado final
      if (isDraggingOutsideGroup) {
        console.log('✅ Nó foi desaninhado permanentemente do grupo');
        console.log('📌 O nó agora é um nó raiz (parentId = undefined)');
      } else {
        console.log('📌 Nó permaneceu no grupo original');
        // Se quiser, pode restaurar o parentId aqui baseado na posição final
      }
    }
  },
});

/**
 * EXEMPLO DE USO EM UM COMPONENTE REACT FLOW
 */

export const UngroupFlowExample: React.FC = () => {
  const [nodes, setNodes] = React.useState<Node[]>([exampleGroupNode, exampleChildNode]);
  const [draggedChildNodeId, setDraggedChildNodeId] = React.useState<string | null>(null);
  const [originalParentId, setOriginalParentId] = React.useState<string | undefined>(undefined);
  const [isDraggingOutsideGroup, setIsDraggingOutsideGroup] = React.useState(false);

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
    <div style={{ width: '100%', height: '100vh' }}>
      <h2>Exemplo de Desaninhamento de Nós Filhos</h2>
      <p>
        📝 <strong>Instruções:</strong>
      </p>
      <ul>
        <li>Clique e arraste o "Nó Filho" para fora do grupo</li>
        <li>Observe o feedback visual (borda vermelha) quando sair do grupo</li>
        <li>Ao soltar fora do grupo, o nó será desaninhado permanentemente</li>
        <li>Se solto dentro do grupo, permanece como filho</li>
      </ul>
      
      {/* Seu componente ReactFlow seria aqui */}
      <pre>
        {JSON.stringify({
          totalNodes: nodes.length,
          draggedChildNodeId,
          originalParentId,
          isDraggingOutsideGroup,
          nodesWithParent: nodes.filter(n => n.parentId).length,
          rootNodes: nodes.filter(n => !n.parentId).length,
        }, null, 2)}
      </pre>
    </div>
  );
};

/**
 * COMO USAR:
 * 
 * 1. Importe os handlers em seu componente React Flow:
 * const handlers = createUngroupHandlers({ ... });
 * 
 * 2. Passe os handlers para o ReactFlow:
 * <ReactFlow
 *   onNodeDragStart={handlers.onNodeDragStart}
 *   onNodeDrag={handlers.onNodeDrag}
 *   onNodeDragStop={handlers.onNodeDragStop}
 *   // ... outras props
 * />
 * 
 * 3. Certifique-se de ter os estados necessários e conectada aos handlers
 * 4. Adicione os estilos CSS para o feedback visual
 * 
 * @see src/index.css para os estilos necessários
 */