import React, { useState } from 'react';
import { useFlowLogic } from '../components/flow/useFlowLogic';

// Mock data similar ao export
const mockFlowData = {
  "nodes": [
    {
      "id": "start",
      "type": "startNode",
      "position": {
        "x": 400,
        "y": 100
      },
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
      },
      "measured": {
        "width": 140,
        "height": 60
      }
    },
    {
      "id": "group-1",
      "type": "groupNode",
      "position": {
        "x": 666,
        "y": 255
      },
      "data": {
        "title": "Grupo #1",
        "nodes": [],
        "childNodes": [
          {
            "id": "imageBubble-2",
            "type": "imageNode",
            "position": {
              "x": 682,
              "y": 335
            },
            "data": {
              "label": "Imagem",
              "element": {
                "id": "image-bubble",
                "type": "imageBubble",
                "category": "bubbles",
                "label": "Imagem",
                "icon": "🖼️",
                "description": "Exibe uma imagem"
              }
            },
            "parentId": "group-1"
          },
          {
            "id": "videoBubble-3",
            "type": "textNode",
            "position": {
              "x": 682,
              "y": 423
            },
            "data": {
              "label": "Vídeo",
              "element": {
                "id": "video-bubble",
                "type": "videoBubble",
                "category": "bubbles",
                "label": "Vídeo",
                "icon": "🎥",
                "description": "Reproduz um vídeo"
              }
            },
            "parentId": "group-1"
          },
          {
            "id": "audioBubble-4",
            "type": "audioNode",
            "position": {
              "x": 682,
              "y": 511
            },
            "data": {
              "label": "Áudio",
              "element": {
                "id": "audio-bubble",
                "type": "audioBubble",
                "category": "bubbles",
                "label": "Áudio",
                "icon": "🎵",
                "description": "Reproduz um áudio"
              }
            },
            "parentId": "group-1"
          },
          {
            "id": "textBubble-1",
            "type": "textNode",
            "position": {
              "x": 682,
              "y": 599
            },
            "data": {
              "label": "Texto",
              "element": {
                "id": "text-bubble",
                "type": "textBubble",
                "category": "bubbles",
                "label": "Texto",
                "icon": "💭",
                "description": "Exibe uma mensagem de texto"
              },
              "width": 180,
              "height": 80,
              "tempHeightZero": true
            },
            "parentId": "group-1"
          }
        ],
        "childNodesIds": [
          "imageBubble-2",
          "videoBubble-3",
          "audioBubble-4",
          "textBubble-1"
        ],
        "_updateTimestamp": 1762133067401
      },
      "measured": {
        "width": 280,
        "height": 401
      }
    }
  ],
  "edges": [
    {
      "id": "edge-start-group-1",
      "source": "start",
      "target": "group-1",
      "type": "custom",
      "style": {
        "stroke": "#ffffff",
        "strokeWidth": 0.5,
        "strokeDasharray": "7 5",
        "animation": "dashdraw 1s linear infinite",
        "cursor": "pointer"
      }
    }
  ],
  "exportedAt": "2025-11-03T01:24:34.091Z",
  "version": "1.0.0"
};

export function ImportTest() {
  const { importFlow, nodes, edges } = useFlowLogic();
  const [importStatus, setImportStatus] = useState<string>('');

  const handleTestImport = async () => {
    setImportStatus('Testando importação...');
    
    try {
      console.log('🧪 Iniciando teste de importação');
      console.log('📄 Dados de teste:', mockFlowData);
      
      const result = importFlow(mockFlowData);
      
      if (result) {
        setImportStatus('✅ Importação realizada com sucesso!');
        console.log('📊 Estado após importação:', {
          nodesCount: nodes.length,
          edgesCount: edges.length,
          nodes: nodes.map(n => ({
            id: n.id,
            type: n.type,
            parentId: n.parentId,
            position: n.position
          })),
          edges: edges.map(e => ({
            id: e.id,
            source: e.source,
            target: e.target,
            type: e.type
          }))
        });
      } else {
        setImportStatus('❌ Falha na importação');
      }
    } catch (error) {
      console.error('❌ Erro durante o teste:', error);
      setImportStatus(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">🧪 Teste de Importação de Flow</h1>
      
      <div className="mb-6">
        <button
          onClick={handleTestImport}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg mr-4"
        >
          🔄 Testar Importação
        </button>
        
        <div className="mt-4">
          <strong>Status:</strong> {importStatus}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">📊 Estado Atual</h3>
          <div className="bg-gray-800 p-4 rounded">
            <div><strong>Nós ({nodes.length}):</strong></div>
            <ul className="text-sm">
              {nodes.map(node => (
                <li key={node.id} className="ml-4">
                  • {node.id} ({node.type})
                  {node.parentId && ` - Filho de: ${node.parentId}`}
                </li>
              ))}
            </ul>
            
            <div className="mt-4"><strong>Conexões ({edges.length}):</strong></div>
            <ul className="text-sm">
              {edges.map(edge => (
                <li key={edge.id} className="ml-4">
                  • {edge.source} → {edge.target}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">📋 Dados de Teste</h3>
          <div className="bg-gray-800 p-4 rounded text-xs overflow-auto max-h-96">
            <pre>{JSON.stringify(mockFlowData, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}