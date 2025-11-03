import React, { useState } from 'react';
import { useFlowLogic } from '../components/flow/useFlowLogic';

/**
 * Teste demonstrativo do sistema de posicionamento automático dos grupos
 * 
 * FUNCIONALIDADES IMPLEMENTADAS:
 * - Posicionamento relativo automático dos filhos
 * - Redimensionamento automático do grupo
 * - Extent: "parent" para manter posição relativa
 * - Desagrupamento apenas ao soltar fora do grupo
 * - Reorganização automática via drag-and-drop
 */

export function TestPosicionamentoAutomatico() {
  const flow = useFlowLogic();
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (message: string) => {
    console.log('🔧 Posicionamento Debug:', message);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Dados de teste com posicionamento relativo correto
  const testStructure = {
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
        "width": 280,  // largura padrão
        "height": 226, // altura calculada: header(60) + 2 filhos(160) + padding(32) + espacos(8)
        "data": {
          "title": "Grupo de Teste"
        }
      },
      {
        "id": "texto-1",
        "type": "textNode",
        "position": { "x": 16, "y": 76 }, // posição relativa: padding(16) + header(60)
        "width": 180,
        "height": 80,
        "data": {
          "label": "Texto",
          "element": {
            "id": "text-bubble",
            "type": "texto",
            "category": "bubbles",
            "label": "Texto",
            "icon": "💭"
          }
        },
        "parentId": "group-1",
        "extent": "parent" // 🔑 CRÍTICO: mantém posição relativa
      },
      {
        "id": "imagem-1",
        "type": "imageNode",
        "position": { "x": 16, "y": 164 }, // posição relativa: padding(16) + header(60) + filho1(80) + espaco(8)
        "width": 180,
        "height": 80,
        "data": {
          "label": "Imagem",
          "element": {
            "id": "image-bubble",
            "type": "imagem",
            "category": "bubbles",
            "label": "Imagem",
            "icon": "🖼️"
          }
        },
        "parentId": "group-1",
        "extent": "parent" // 🔑 CRÍTICO: mantém posição relativa
      }
    ],
    "edges": []
  };

  React.useEffect(() => {
    // Carregar estrutura de teste
    flow.importFlow(testStructure);
    addDebugInfo('✅ Estrutura de teste carregada');
    addDebugInfo('🎯 Demonstração: Posicionamento automático ativo');
  }, []);

  const testScenarios = [
    {
      title: '🔍 Verificar Posicionamento Relativo',
      action: () => {
        const group = flow.nodes.find(n => n.type === 'groupNode');
        const children = flow.nodes.filter(n => n.parentId === group?.id);
        
        const info = `
📊 Análise de Posicionamento Relativo:
- Grupo: ${group?.id} em (${Math.round(group?.position.x || 0)}, ${Math.round(group?.position.y || 0)})
- Filhos: ${children.length}

🎯 POSIÇÕES RELATIVAS (devem ser relativas ao grupo):
        `.trim();

        addDebugInfo(info);
        
        children.forEach((child, index) => {
          const absoluteX = group!.position.x + child.position.x;
          const absoluteY = group!.position.y + child.position.y;
          addDebugInfo(`  📎 ${child.id}:`);
          addDebugInfo(`     Posição relativa: (${child.position.x}, ${child.position.y})`);
          addDebugInfo(`     Posição absoluta: (${Math.round(absoluteX)}, ${Math.round(absoluteY)})`);
          addDebugInfo(`     extent: ${child.extent || 'N/A'}`);
        });
      }
    },
    {
      title: '➕ Adicionar Novo Elemento Automaticamente',
      action: () => {
        const group = flow.nodes.find(n => n.type === 'groupNode');
        if (group) {
          const elementData = JSON.stringify({
            type: 'audio',
            label: 'Áudio Automático',
            category: 'bubbles',
            icon: '🔊'
          });

          const customEvent = new CustomEvent('groupDrop', {
            detail: {
              groupId: group.id,
              elementData: elementData,
              insertIndex: 1, // Inserir entre os existentes
              position: { x: 400, y: 400 }
            }
          });

          window.dispatchEvent(customEvent);
          addDebugInfo('📦 Novo elemento adicionado com posição automática');
          addDebugInfo('🎯 Sistema calculou: padding(16) + header(60) + index(1) * (80+8) + padding(16)');
        }
      }
    },
    {
      title: '📏 Verificar Redimensionamento Automático',
      action: () => {
        const group = flow.nodes.find(n => n.type === 'groupNode');
        const children = flow.nodes.filter(n => n.parentId === group?.id);
        
        if (group) {
          const expectedHeight = 60 + (children.length * 80) + ((children.length - 1) * 8) + (16 * 2);
          const expectedWidth = 280;
          
          addDebugInfo(`📏 Cálculo de Dimensões do Grupo:`);
          addDebugInfo(`  Altura atual: ${Math.round(group.height || 0)}px`);
          addDebugInfo(`  Altura calculada: ${expectedHeight}px`);
          addDebugInfo(`  Fórmula: header(60) + ${children.length}*filhos(80) + ${Math.max(0, children.length-1)}*espaços(8) + padding(32)`);
          addDebugInfo(`  ✅ Corresponde: ${Math.abs((group.height || 0) - expectedHeight) < 5 ? 'SIM' : 'NÃO'}`);
        }
      }
    },
    {
      title: '🧪 Testar Funções de Posicionamento',
      action: () => {
        if (flow.calculateGroupDimensions && flow.calculateChildPosition) {
          const dim2 = flow.calculateGroupDimensions(2);
          const pos0 = flow.calculateChildPosition(0, 3);
          const pos1 = flow.calculateChildPosition(1, 3);
          const pos2 = flow.calculateChildPosition(2, 3);
          
          addDebugInfo('🧪 Teste das Funções de Posicionamento:');
          addDebugInfo(`  calculateGroupDimensions(2): width=${dim2.width}, height=${dim2.height}`);
          addDebugInfo(`  calculateChildPosition(0, 3): x=${pos0.x}, y=${pos0.y}`);
          addDebugInfo(`  calculateChildPosition(1, 3): x=${pos1.x}, y=${pos1.y}`);
          addDebugInfo(`  calculateChildPosition(2, 3): x=${pos2.x}, y=${pos2.y}`);
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
      <h1 className="text-2xl font-bold mb-6">🔧 Sistema de Posicionamento Automático</h1>
      
      {/* Status das funcionalidades */}
      <div className="mb-6 p-4 bg-blue-900/30 border border-blue-500 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-400 mb-2">✅ Funcionalidades Implementadas</h2>
        <div className="text-sm text-blue-200 space-y-1">
          <div><strong>Posicionamento Relativo:</strong> Filhos posicionados automaticamente com padding e espaçamento</div>
          <div><strong>Redimensionamento Automático:</strong> Grupo se ajusta ao número de filhos</div>
          <div><strong>extent: "parent":</strong> Mantém posição relativa ao mover o grupo</div>
          <div><strong>Reorganização:</strong> Posições recalculadas ao adicionar/remover filhos</div>
          <div><strong>Desagrupamento Controlado:</strong> Só remove do grupo ao soltar fora</div>
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
          <div className="text-sm text-gray-400">Filhos com extent:parent</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-xl font-bold text-yellow-400">{flow.edges.length}</div>
          <div className="text-sm text-gray-400">Conexões</div>
        </div>
      </div>

      {/* Botões de teste */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">🎮 Testes de Posicionamento</h2>
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
        <h2 className="text-lg font-semibold mb-3">📋 Log de Testes</h2>
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
        <h2 className="text-lg font-semibold mb-3">🔍 Detalhes do Posicionamento</h2>
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
                  {node.extent === 'parent' && (
                    <span className="text-green-400 text-xs">extent:parent</span>
                  )}
                </div>
                <div className="text-gray-500 text-xs">
                  pos: ({Math.round(node.position.x)}, {Math.round(node.position.y)})
                  {node.width && node.height && (
                    <span> | size: {Math.round(node.width)}×{Math.round(node.height)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Explicação técnica */}
      <div className="p-4 bg-green-900/30 border border-green-500 rounded-lg">
        <h3 className="font-semibold text-green-400 mb-2">🔧 Como Funciona o Posicionamento Automático</h3>
        <div className="text-sm text-green-200 space-y-2">
          <p><strong>Cálculo de Posição:</strong> <code>pos.y = padding(16) + header(60) + index * (height(80) + spacing(8))</code></p>
          <p><strong>Cálculo de Dimensão:</strong> <code>height = header(60) + children*80 + (children-1)*8 + padding*2</code></p>
          <p><strong>Extent Parent:</strong> Mantém posição relativa ao grupo, mesmo quando o grupo é movido</p>
          <p><strong>Reorganização:</strong> Posições são recalculadas automaticamente ao adicionar/remover filhos</p>
        </div>
      </div>
    </div>
  );
}