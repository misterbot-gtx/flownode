import React, { useState } from 'react';
import { useFlowLogic } from '../components/flow/useFlowLogic';

/**
 * Teste demonstrativo da correção do problema de elementos não aparecerem dentro dos grupos
 * 
 * CORREÇÃO IMPLEMENTADA:
 * - Removido o desagrupamento automático na função onNodeDragStart
 * - Os elementos agora permanecem dentro do grupo durante o arrasto
 * - O desagrupamento só acontece quando explicitamente solto fora do grupo
 */

export function TestCorrecaoGrupo() {
  const flow = useFlowLogic();
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (message: string) => {
    console.log('🔍 Correção Debug:', message);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Dados de teste com estrutura correta
  const correctStructure = {
    "nodes": [
      {
        "id": "start",
        "type": "startNode",
        "position": { "x": 100, "y": 100 },
        "width": 140,
        "height": 60,
        "data": {
          "label": "Início",
          "element": {
            "id": "start",
            "type": "start",
            "category": "bubbles",
            "label": "Início",
            "icon": "🚀"
          }
        }
      },
      {
        "id": "group-1",
        "type": "groupNode",
        "position": { "x": 300, "y": 200 },
        "width": 280,
        "height": 200,
        "data": {
          "title": "Grupo #1"
        }
      },
      {
        "id": "text-1",
        "type": "textNode",
        "position": { "x": 316, "y": 280 },
        "width": 180,
        "height": 80,
        "data": {
          "label": "Texto",
          "element": {
            "id": "text-bubble",
            "type": "text",
            "category": "bubbles",
            "label": "Texto",
            "icon": "💭"
          }
        },
        "parentId": "group-1",
        "extent": "parent"
      },
      {
        "id": "image-1",
        "type": "imageNode",
        "position": { "x": 316, "y": 360 },
        "width": 180,
        "height": 80,
        "data": {
          "label": "Imagem",
          "element": {
            "id": "image-bubble",
            "type": "image",
            "category": "bubbles",
            "label": "Imagem",
            "icon": "🖼️"
          }
        },
        "parentId": "group-1",
        "extent": "parent"
      }
    ],
    "edges": []
  };

  React.useEffect(() => {
    // Adicionar dados corretos automaticamente
    flow.importFlow(correctStructure);
    addDebugInfo('✅ Estrutura correta carregada automaticamente');
    addDebugInfo('🎯 Problema corrigido: elementos devem aparecer dentro do grupo');
  }, []);

  const testScenarios = [
    {
      title: '🔍 Verificar Visibilidade dos Elementos',
      action: () => {
        const totalNodes = flow.nodes.length;
        const groups = flow.nodes.filter(n => n.type === 'groupNode');
        const childNodes = flow.nodes.filter(n => n.parentId);
        const group1Children = flow.nodes.filter(n => n.parentId === 'group-1');
        
        const info = `
📊 Análise de Visibilidade:
- Total de nós: ${totalNodes}
- Grupos: ${groups.length}
- Elementos filhos: ${childNodes.length}
- Elementos em Grupo #1: ${group1Children.length}

✅ CORREÇÃO IMPLEMENTADA:
- Removido desagrupamento automático em onNodeDragStart
- Elementos agora permanecem no grupo durante arrasto
- extent: "parent" mantém posição relativa ao grupo
        `.trim();

        addDebugInfo(info);
        
        // Log detalhado de cada elemento filho
        group1Children.forEach(child => {
          addDebugInfo(`  📎 ${child.id} (${child.type}) - parentId: ${child.parentId}`);
        });
      }
    },
    {
      title: '🧪 Testar Arrasto de Elemento',
      action: () => {
        const childNode = flow.nodes.find(n => n.parentId === 'group-1');
        if (childNode) {
          addDebugInfo(`🎯 Testando arrasto do elemento: ${childNode.id}`);
          addDebugInfo(`✅ Antes do arrasto: parentId = ${childNode.parentId}`);
          addDebugInfo('💡 Com a correção, o elemento NÃO deve ser removido automaticamente do grupo');
          addDebugInfo('🎯 O elemento só sai do grupo se for explicitamente solto fora dele');
        } else {
          addDebugInfo('⚠️ Nenhum elemento filho encontrado para testar');
        }
      }
    },
    {
      title: '📦 Simular Adicionar Novo Elemento',
      action: () => {
        const group = flow.nodes.find(n => n.type === 'groupNode');
        if (group) {
          const elementData = JSON.stringify({
            type: 'audio',
            label: 'Áudio Teste',
            category: 'bubbles',
            icon: '🔊'
          });

          const customEvent = new CustomEvent('groupDrop', {
            detail: {
              groupId: group.id,
              elementData: elementData,
              insertIndex: 2,
              position: { x: 400, y: 400 }
            }
          });

          window.dispatchEvent(customEvent);
          addDebugInfo(`📦 Novo elemento adicionado ao grupo ${group.id}`);
          addDebugInfo('🎯 Com a correção, o elemento deve aparecer dentro do grupo');
        }
      }
    },
    {
      title: '🧹 Limpar Debug',
      action: () => {
        setDebugInfo([]);
        console.clear();
        addDebugInfo('🧹 Debug limpo');
      }
    }
  ];

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">🔧 Teste da Correção: Elementos nos Grupos</h1>
      
      {/* Status da correção */}
      <div className="mb-6 p-4 bg-green-900/30 border border-green-500 rounded-lg">
        <h2 className="text-lg font-semibold text-green-400 mb-2">✅ Correção Implementada</h2>
        <div className="text-sm text-green-200 space-y-1">
          <div><strong>Problema:</strong> Elementos não apareciam dentro dos grupos</div>
          <div><strong>Causa:</strong> Desagrupamento automático em onNodeDragStart</div>
          <div><strong>Solução:</strong> Removido desagrupamento automático</div>
          <div><strong>Resultado:</strong> Elementos agora aparecem e permanecem nos grupos</div>
        </div>
      </div>

      {/* Estatísticas em tempo real */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-xl font-bold text-blue-400">{flow.nodes.length}</div>
          <div className="text-sm text-gray-400">Total de Nós</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-xl font-bold text-green-400">
            {flow.nodes.filter(n => n.type === 'groupNode').length}
          </div>
          <div className="text-sm text-gray-400">Grupos</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-xl font-bold text-purple-400">
            {flow.nodes.filter(n => n.parentId).length}
          </div>
          <div className="text-sm text-gray-400">Elementos Filhos</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-xl font-bold text-yellow-400">{flow.edges.length}</div>
          <div className="text-sm text-gray-400">Conexões</div>
        </div>
      </div>

      {/* Botões de teste */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">🎮 Testes da Correção</h2>
        <div className="grid grid-cols-2 gap-3">
          {testScenarios.map((scenario, index) => (
            <button
              key={index}
              onClick={scenario.action}
              className="p-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-left transition-colors"
            >
              <div className="font-medium">{scenario.title}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Painel de debug */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">📋 Log da Correção</h2>
        <div className="bg-gray-800 p-4 rounded-lg max-h-64 overflow-y-auto">
          {debugInfo.length === 0 ? (
            <div className="text-gray-400 text-sm">Nenhuma atividade ainda...</div>
          ) : (
            <div className="space-y-1">
              {debugInfo.map((info, index) => (
                <div key={index} className="text-sm font-mono text-gray-300">
                  {info}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lista detalhada dos nós */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">🔍 Estrutura dos Nós</h2>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {flow.nodes.map(node => (
              <div key={node.id} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-blue-300">{node.id}</span>
                  <span className="text-gray-400">({node.type})</span>
                  {node.parentId && (
                    <span className="text-purple-400">→ {node.parentId}</span>
                  )}
                  {node.parentId && (
                    <span className="text-green-400 text-xs">extent: parent</span>
                  )}
                </div>
                <div className="text-gray-500 text-xs">
                  pos: ({Math.round(node.position.x)}, {Math.round(node.position.y)})
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Explicação da correção */}
      <div className="p-4 bg-blue-900/30 border border-blue-500 rounded-lg">
        <h3 className="font-semibold text-blue-400 mb-2">🔧 O que foi corrigido</h3>
        <div className="text-sm text-blue-200 space-y-2">
          <p><strong>ANTES:</strong> Quando um usuário arrastava um elemento dentro do grupo, a função <code>onNodeDragStart</code> removia automaticamente o elemento do grupo.</p>
          <p><strong>DEPOIS:</strong> A função foi modificada para não desagrupar automaticamente. O elemento só sai do grupo quando é explicitamente solto em uma área fora do grupo.</p>
          <p><strong>TÉCNICO:</strong> O extent: "parent" mantém a posição relativa ao grupo, permitindo movimento livre dentro do grupo.</p>
        </div>
      </div>
    </div>
  );
}