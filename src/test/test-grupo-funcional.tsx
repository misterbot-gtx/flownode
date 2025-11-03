import React, { useState } from 'react';
import { useFlowLogic } from '../components/flow/useFlowLogic';

/**
 * Arquivo de teste para verificar se a adição de componentes aos grupos está funcionando
 */

export function TestGrupoFuncional() {
  const flow = useFlowLogic();
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (message: string) => {
    console.log('🔍 Debug:', message);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Adicionar listeners para debug
  React.useEffect(() => {
    const handleGroupDrop = (event: any) => {
      addDebugInfo(`📦 groupDrop recebido: ${event.detail.groupId}`);
    };

    const handleRemoveFromGroup = (event: any) => {
      addDebugInfo(`🗑️ removeFromGroup recebido: ${event.detail.elementId}`);
    };

    window.addEventListener('groupDrop', handleGroupDrop);
    window.addEventListener('removeFromGroup', handleRemoveFromGroup);

    return () => {
      window.removeEventListener('groupDrop', handleGroupDrop);
      window.removeEventListener('removeFromGroup', handleRemoveFromGroup);
    };
  }, []);

  const testScenarios = [
    {
      title: 'Teste 1: Criar Grupo Vazio',
      action: () => {
        flow.createGroup();
        addDebugInfo('✅ Grupo vazio criado');
      }
    },
    {
      title: 'Teste 2: Adicionar Elemento ao Grupo Existente',
      action: () => {
        const groups = flow.nodes.filter(n => n.type === 'groupNode');
        if (groups.length === 0) {
          addDebugInfo('⚠️ Nenhum grupo existe. Crie um grupo primeiro.');
          return;
        }

        // Simular drop de elemento na sidebar sobre um grupo
        const group = groups[0];
        const elementData = JSON.stringify({
          type: 'texto',
          label: 'Texto de Teste',
          category: 'bubbles',
          icon: '💭'
        });

        const customEvent = new CustomEvent('groupDrop', {
          detail: {
            groupId: group.id,
            elementData: elementData,
            insertIndex: 0,
            position: { x: 400, y: 400 }
          }
        });

        window.dispatchEvent(customEvent);
        addDebugInfo(`📦 Elemento adicionado ao grupo ${group.id}`);
      }
    },
    {
      title: 'Teste 3: Verificar Estado Atual',
      action: () => {
        const totalNodes = flow.nodes.length;
        const groups = flow.nodes.filter(n => n.type === 'groupNode');
        const childNodes = flow.nodes.filter(n => n.parentId);
        
        const info = `
📊 Estado Atual:
- Total de nós: ${totalNodes}
- Grupos: ${groups.length}
- Elementos filhos: ${childNodes.length}
- Conexões: ${flow.edges.length}
        `.trim();

        addDebugInfo(info);
      }
    },
    {
      title: 'Teste 4: Limpar Debug',
      action: () => {
        setDebugInfo([]);
        console.clear();
        addDebugInfo('🧹 Debug limpo');
      }
    }
  ];

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">🧪 Teste de Funcionalidade de Grupos</h1>
      
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
        <h2 className="text-lg font-semibold mb-3">🎮 Cenários de Teste</h2>
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
        <h2 className="text-lg font-semibold mb-3">📋 Log de Debug</h2>
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
        <h2 className="text-lg font-semibold mb-3">🔍 Detalhes dos Nós</h2>
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
                </div>
                <div className="text-gray-500 text-xs">
                  pos: ({Math.round(node.position.x)}, {Math.round(node.position.y)})
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Instruções */}
      <div className="p-4 bg-yellow-900/30 border border-yellow-500 rounded-lg">
        <h3 className="font-semibold text-yellow-400 mb-2">📖 Como Testar</h3>
        <ol className="text-sm text-yellow-200 space-y-1 list-decimal list-inside">
          <li>Clique em "Criar Grupo Vazio" para criar um grupo de teste</li>
          <li>Clique em "Adicionar Elemento ao Grupo Existente" para adicionar um elemento</li>
          <li>Use "Verificar Estado Atual" para ver as estatísticas atualizadas</li>
          <li>Observe o log de debug para ver os eventos sendo disparados</li>
          <li>Se algo não funcionar, verifique o console do navegador</li>
        </ol>
      </div>
    </div>
  );
}