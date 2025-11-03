import React from 'react';
import { useFlowLogic } from '../components/flow/useFlowLogic';

/**
 * Exemplo de como a estrutura correta funciona após as correções
 * 
 * ANTES (incorreto):
 * - Nós filhos armazenados em groupNode.data.childNodes
 * - Não reconhecidos pelo React Flow
 * - Sem hierarquia real
 * 
 * DEPOIS (correto):
 * - Todos os nós no array raiz nodes
 * - parentId vincula filhos aos pais
 * - extent: 'parent' permite movimento independente
 * - Segue especificações oficiais do React Flow
 */

export function DemoEstruturaCorreta() {
  const { nodes, edges, exportFlow, importFlow } = useFlowLogic();

  // Exemplo de estrutura correta que será exportada
  const exemploEstruturaCorreta = {
    nodes: [
      // Nó pai (grupo) SEMPRE vem PRIMEIRO
      {
        id: "group-1",
        type: "groupNode",
        position: { x: 400, y: 200 },
        data: { title: "Meu Grupo" },
        // SEM childNodes, childNodesIds no data
      },
      
      // Nós filhos no mesmo array raiz
      {
        id: "text-1",
        type: "textNode",
        position: { x: 416, y: 280 }, // Posição RELATIVA ao grupo
        data: { label: "Texto", element: { type: "texto", label: "Texto" } },
        parentId: "group-1",          // Vincula ao grupo pai
        extent: "parent",             // Permite movimento independente
      },
      
      {
        id: "image-1", 
        type: "imageNode",
        position: { x: 416, y: 368 }, // Posição RELATIVA ao grupo
        data: { label: "Imagem", element: { type: "imagem", label: "Imagem" } },
        parentId: "group-1",          // Vincula ao grupo pai
        extent: "parent",             // Permite movimento independente
      }
    ],
    
    edges: [
      {
        id: "edge-group-1-text-1",
        source: "group-1",
        target: "text-1",
        type: "custom"
      }
    ]
  };

  // Demonstrações das funcionalidades
  const demonstracoes = [
    {
      titulo: "✅ Criar Grupo",
      descricao: "Arraste elementos da sidebar para criar grupos automaticamente",
      codigo: "Cada elemento terá parentId e extent: 'parent'"
    },
    {
      titulo: "✅ Mover Elementos",
      descricao: "Arraste elementos filhos dentro do grupo",
      codigo: "Movimento érestrito aos limites do grupo"
    },
    {
      titulo: "✅ Remover do Grupo", 
      descricao: "Arraste elemento para fora do grupo",
      codigo: "parentId é removido automaticamente"
    },
    {
      titulo: "✅ Export/Import",
      descricao: "Arquivos seguem estrutura correta do React Flow",
      codigo: "Todos os nós no array raiz, incluindo filhos"
    },
    {
      titulo: "✅ Hierarquia Real",
      descricao: "React Flow reconhece a estrutura de grupos",
      codigo: "Suporte nativo para subflows"
    }
  ];

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">🎯 Demonstração: Estrutura Correta de Grupos</h1>
      
      {/* Resumo das correções */}
      <div className="mb-8 p-4 bg-blue-900/30 border border-blue-500 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">📋 Resumo das Correções</h2>
        <ul className="text-sm space-y-1">
          <li>• Removidos childNodes de groupNode.data</li>
          <li>• Todos os nós (pais e filhos) no array raiz</li>
          <li>• parentId vincula filhos aos pais</li>
          <li>• extent: 'parent' permite movimento independente</li>
          <li>• Export/Import seguem estrutura React Flow</li>
        </ul>
      </div>

      {/* Estatísticas atuais */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-400">{nodes.length}</div>
          <div className="text-sm text-gray-400">Total de Nós</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-400">
            {nodes.filter(n => n.type === 'groupNode').length}
          </div>
          <div className="text-sm text-gray-400">Grupos</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-400">
            {nodes.filter(n => n.parentId).length}
          </div>
          <div className="text-sm text-gray-400">Elementos Filhos</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-400">{edges.length}</div>
          <div className="text-sm text-gray-400">Conexões</div>
        </div>
      </div>

      {/* Demonstrações */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">🚀 Funcionalidades Implementadas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {demonstracoes.map((demo, index) => (
            <div key={index} className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold text-green-400 mb-2">{demo.titulo}</h3>
              <p className="text-sm text-gray-300 mb-2">{demo.descricao}</p>
              <code className="text-xs bg-gray-900 p-2 rounded block text-blue-300">
                {demo.codigo}
              </code>
            </div>
          ))}
        </div>
      </div>

      {/* Exemplo de estrutura */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">📄 Exemplo de Estrutura Correta</h2>
        <div className="bg-gray-800 p-4 rounded-lg overflow-auto max-h-96">
          <pre className="text-xs text-gray-300">
            {JSON.stringify(exemploEstruturaCorreta, null, 2)}
          </pre>
        </div>
      </div>

      {/* Lista de nós atuais */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">📊 Estado Atual do Flow</h2>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">🗂️ Nós ({nodes.length})</h3>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {nodes.map(node => (
                  <div key={node.id} className="flex justify-between text-sm">
                    <span className="font-mono">{node.id}</span>
                    <div className="flex gap-2">
                      <span className="text-gray-400">({node.type})</span>
                      {node.parentId && (
                        <span className="text-blue-400">filho de {node.parentId}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">🔗 Conexões ({edges.length})</h3>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {edges.map(edge => (
                  <div key={edge.id} className="flex justify-between text-sm">
                    <span className="font-mono">{edge.source}</span>
                    <span className="text-gray-400">→</span>
                    <span className="font-mono">{edge.target}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-4">
        <button
          onClick={() => {
            console.log('🎯 Estrutura atual:', { nodes, edges });
            alert('Verifique o console para detalhes da estrutura');
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          🔍 Verificar Estrutura
        </button>
        
        <button
          onClick={exportFlow}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          📤 Exportar Flow
        </button>
      </div>

      {/* Dicas de uso */}
      <div className="mt-8 p-4 bg-yellow-900/30 border border-yellow-500 rounded-lg">
        <h3 className="font-semibold text-yellow-400 mb-2">💡 Dicas de Uso</h3>
        <ul className="text-sm text-yellow-200 space-y-1">
          <li>• Arraste elementos da sidebar para o canvas</li>
          <li>• Elementos são automaticamente agrupados</li>
          <li>• Mova elementos filhos dentro do grupo</li>
          <li>• Arraste para fora para remover do grupo</li>
          <li>• Use DevTools para exportar/importar</li>
        </ul>
      </div>
    </div>
  );
}