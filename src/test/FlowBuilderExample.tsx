// FlowBuilderExample.tsx - Exemplo de uso do Flow Builder
// Este arquivo demonstra como usar o FlowBuilderCore em um projeto

import React, { useState } from 'react';
import FlowBuilder, { 
  Typebot, 
  exportTypebot, 
  importTypebot,
  validateTypebot,
  createId 
} from './FlowBuilderCore';

// ============================================================================
// EXEMPLO DE USO BÁSICO
// ============================================================================

export const BasicFlowBuilderExample: React.FC = () => {
  const [typebot, setTypebot] = useState<Typebot>({
    id: 'example-flow',
    name: 'Exemplo de Flow',
    version: '1.0.0',
    groups: [
      {
        id: 'group_1',
        title: 'Início',
        graphCoordinates: { x: 100, y: 100 },
        blocks: [
          {
            id: 'block_1',
            type: 'text',
            groupId: 'group_1',
            graphCoordinates: { x: 0, y: 0 },
            options: {
              content: 'Olá! Bem-vindo ao nosso flow.',
            },
          },
        ],
      },
    ],
    edges: [],
    events: [],
    variables: [],
    settings: {},
    theme: {},
  });

  const handleSave = (updatedTypebot: Typebot) => {
    console.log('Flow salvo:', updatedTypebot);
    setTypebot(updatedTypebot);
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <FlowBuilder
        initialTypebot={typebot}
        onSave={handleSave}
        readOnly={false}
      />
    </div>
  );
};

// ============================================================================
// EXEMPLO COM FUNÇÕES AVANÇADAS
// ============================================================================

export const AdvancedFlowBuilderExample: React.FC = () => {
  const [typebot, setTypebot] = useState<Typebot | null>(null);
  const [jsonData, setJsonData] = useState<string>('');

  // Função para criar um flow de exemplo
  const createExampleFlow = () => {
    const exampleTypebot: Typebot = {
      id: createId(),
      name: 'Flow de Exemplo',
      version: '1.0.0',
      groups: [
        {
          id: createId(),
          title: 'Boas-vindas',
          graphCoordinates: { x: 50, y: 50 },
          blocks: [
            {
              id: createId(),
              type: 'text',
              groupId: 'group_1',
              graphCoordinates: { x: 0, y: 0 },
              options: {
                content: 'Olá! Como posso ajudá-lo hoje?',
              },
            },
            {
              id: createId(),
              type: 'choice',
              groupId: 'group_1',
              graphCoordinates: { x: 0, y: 60 },
              options: {
                items: [
                  { id: createId(), content: 'Suporte' },
                  { id: createId(), content: 'Vendas' },
                  { id: createId(), content: 'Outros' },
                ],
              },
            },
          ],
        },
        {
          id: createId(),
          title: 'Suporte',
          graphCoordinates: { x: 400, y: 50 },
          blocks: [
            {
              id: createId(),
              type: 'text',
              groupId: 'group_2',
              graphCoordinates: { x: 0, y: 0 },
              options: {
                content: 'Nossa equipe de suporte entrará em contato em breve.',
              },
            },
          ],
        },
      ],
      edges: [
        {
          id: createId(),
          from: { blockId: 'choice_block', itemId: 'support_item' },
          to: { groupId: 'group_2' },
        },
      ],
      events: [],
      variables: [
        {
          id: createId(),
          name: 'userName',
          value: '',
        },
      ],
      settings: {
        isClosed: false,
        isArchived: false,
      },
      theme: {
        general: {
          font: 'Inter',
          background: { type: 'color', content: '#ffffff' },
        },
      },
    };

    setTypebot(exampleTypebot);
  };

  // Função para exportar flow
  const handleExport = () => {
    if (!typebot) return;
    
    const exported = exportTypebot(typebot);
    setJsonData(exported);
    
    // Criar arquivo para download
    const blob = new Blob([exported], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${typebot.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Função para importar flow
  const handleImport = () => {
    if (!jsonData) return;
    
    const imported = importTypebot(jsonData);
    if (imported) {
      setTypebot(imported);
      alert('Flow importado com sucesso!');
    } else {
      alert('Erro ao importar flow. Verifique o formato do JSON.');
    }
  };

  // Função para validar JSON
  const handleValidate = () => {
    if (!jsonData) return;
    
    try {
      const data = JSON.parse(jsonData);
      const isValid = validateTypebot(data);
      
      if (isValid) {
        alert('JSON válido!');
      } else {
        alert('JSON inválido!');
      }
    } catch {
      alert('JSON malformado!');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Exemplo Avançado do Flow Builder</h1>
      
      {/* Controles */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={createExampleFlow}>Criar Flow de Exemplo</button>
        <button onClick={handleExport} disabled={!typebot}>Exportar</button>
        <button onClick={handleImport} disabled={!jsonData}>Importar</button>
        <button onClick={handleValidate} disabled={!jsonData}>Validar JSON</button>
      </div>

      {/* Área de JSON */}
      <div style={{ marginBottom: '20px' }}>
        <h3>JSON do Flow:</h3>
        <textarea
          value={jsonData}
          onChange={(e) => setJsonData(e.target.value)}
          style={{ 
            width: '100%', 
            height: '200px', 
            fontFamily: 'monospace',
            fontSize: '12px'
          }}
          placeholder="Cole o JSON do flow aqui..."
        />
      </div>

      {/* Flow Builder */}
      {typebot && (
        <div style={{ height: '600px', border: '1px solid #ccc' }}>
          <FlowBuilder
            initialTypebot={typebot}
            onSave={(updatedTypebot) => {
              console.log('Flow atualizado:', updatedTypebot);
              setTypebot(updatedTypebot);
            }}
            readOnly={false}
          />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// EXEMPLO DE INTEGRAÇÃO COM REACT
// ============================================================================

export const ReactIntegrationExample: React.FC = () => {
  const [flows, setFlows] = useState<Typebot[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<Typebot | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Função para criar novo flow
  const createNewFlow = () => {
    const newFlow: Typebot = {
      id: createId(),
      name: `Novo Flow ${flows.length + 1}`,
      version: '1.0.0',
      groups: [],
      edges: [],
      events: [],
      variables: [],
      settings: {},
      theme: {},
    };

    setFlows(prev => [...prev, newFlow]);
    setSelectedFlow(newFlow);
    setIsEditing(true);
  };

  // Função para deletar flow
  const deleteFlow = (flowId: string) => {
    setFlows(prev => prev.filter(flow => flow.id !== flowId));
    if (selectedFlow?.id === flowId) {
      setSelectedFlow(null);
      setIsEditing(false);
    }
  };

  // Função para salvar flow
  const handleSaveFlow = (updatedFlow: Typebot) => {
    setFlows(prev => prev.map(flow => 
      flow.id === updatedFlow.id ? updatedFlow : flow
    ));
    setSelectedFlow(updatedFlow);
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar com lista de flows */}
      <div style={{ 
        width: '250px', 
        backgroundColor: '#f5f5f5', 
        padding: '20px',
        borderRight: '1px solid #ddd'
      }}>
        <h2>Meus Flows</h2>
        
        <button 
          onClick={createNewFlow}
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          + Novo Flow
        </button>

        {flows.map(flow => (
          <div 
            key={flow.id}
            style={{
              padding: '10px',
              marginBottom: '10px',
              backgroundColor: selectedFlow?.id === flow.id ? '#e3f2fd' : 'white',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={() => {
              setSelectedFlow(flow);
              setIsEditing(true);
            }}
          >
            <div style={{ fontWeight: 'bold' }}>{flow.name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {flow.groups.length} grupos, {flow.edges.length} conexões
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteFlow(flow.id);
              }}
              style={{
                marginTop: '5px',
                padding: '2px 6px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '2px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              Deletar
            </button>
          </div>
        ))}
      </div>

      {/* Área principal */}
      <div style={{ flex: 1 }}>
        {selectedFlow && isEditing ? (
          <FlowBuilder
            initialTypebot={selectedFlow}
            onSave={handleSaveFlow}
            readOnly={false}
          />
        ) : (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            fontSize: '18px',
            color: '#666'
          }}>
            {selectedFlow ? (
              <div>
                <h2>{selectedFlow.name}</h2>
                <p>Clique em "Editar" para modificar este flow</p>
                <button onClick={() => setIsEditing(true)}>
                  Editar Flow
                </button>
              </div>
            ) : (
              <div>
                <h2>Bem-vindo ao Flow Builder</h2>
                <p>Selecione um flow da lista ou crie um novo</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// EXEMPLO DE CUSTOMIZAÇÃO
// ============================================================================

export const CustomFlowBuilderExample: React.FC = () => {
  const [customTheme, setCustomTheme] = useState({
    primaryColor: '#2196f3',
    secondaryColor: '#f50057',
    backgroundColor: '#ffffff',
    textColor: '#333333',
  });

  const [typebot, setTypebot] = useState<Typebot>({
    id: 'custom-flow',
    name: 'Flow Customizado',
    version: '1.0.0',
    groups: [],
    edges: [],
    events: [],
    variables: [],
    settings: {},
    theme: customTheme,
  });

  return (
    <div>
      <div style={{ padding: '20px', backgroundColor: '#f8f9fa' }}>
        <h2>Customização de Tema</h2>
        
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label>Cor Primária:</label>
            <input
              type="color"
              value={customTheme.primaryColor}
              onChange={(e) => setCustomTheme(prev => ({
                ...prev,
                primaryColor: e.target.value
              }))}
            />
          </div>
          
          <div>
            <label>Cor Secundária:</label>
            <input
              type="color"
              value={customTheme.secondaryColor}
              onChange={(e) => setCustomTheme(prev => ({
                ...prev,
                secondaryColor: e.target.value
              }))}
            />
          </div>
          
          <div>
            <label>Cor de Fundo:</label>
            <input
              type="color"
              value={customTheme.backgroundColor}
              onChange={(e) => setCustomTheme(prev => ({
                ...prev,
                backgroundColor: e.target.value
              }))}
            />
          </div>
        </div>
      </div>

      <div style={{ height: '600px' }}>
        <FlowBuilder
          initialTypebot={{
            ...typebot,
            theme: customTheme
          }}
          onSave={(updatedTypebot) => {
            console.log('Flow customizado salvo:', updatedTypebot);
            setTypebot(updatedTypebot);
          }}
          readOnly={false}
        />
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL DE EXEMPLO
// ============================================================================

export const FlowBuilderExamples: React.FC = () => {
  const [currentExample, setCurrentExample] = useState<'basic' | 'advanced' | 'integration' | 'custom'>('basic');

  return (
    <div>
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #ddd'
      }}>
        <h1>Flow Builder - Exemplos de Uso</h1>
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button 
            onClick={() => setCurrentExample('basic')}
            style={{
              padding: '8px 16px',
              backgroundColor: currentExample === 'basic' ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Básico
          </button>
          
          <button 
            onClick={() => setCurrentExample('advanced')}
            style={{
              padding: '8px 16px',
              backgroundColor: currentExample === 'advanced' ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Avançado
          </button>
          
          <button 
            onClick={() => setCurrentExample('integration')}
            style={{
              padding: '8px 16px',
              backgroundColor: currentExample === 'integration' ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Integração React
          </button>
          
          <button 
            onClick={() => setCurrentExample('custom')}
            style={{
              padding: '8px 16px',
              backgroundColor: currentExample === 'custom' ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Customização
          </button>
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        {currentExample === 'basic' && <BasicFlowBuilderExample />}
        {currentExample === 'advanced' && <AdvancedFlowBuilderExample />}
        {currentExample === 'integration' && <ReactIntegrationExample />}
        {currentExample === 'custom' && <CustomFlowBuilderExample />}
      </div>
    </div>
  );
};

export default FlowBuilderExamples; 