import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

export const TestUngroup: React.FC = () => {
  const [message, setMessage] = useState('');

  const handleTest = () => {
    // Verificar se os eventos estão funcionando
    console.log('🧪 Teste iniciado...');
    setMessage('Teste executado! Verifique o console do navegador.');
    
    // Simular evento de mouse em elemento filho
    const testElement = document.querySelector('.group-child-node') as HTMLElement;
    if (testElement) {
      console.log('✅ Elemento filho encontrado:', testElement);
      testElement.addEventListener('mousedown', (e) => {
        console.log('🖱️ MouseDown no elemento filho');
        e.stopPropagation();
      }, { once: true });
      
      testElement.addEventListener('dragstart', (e) => {
        console.log('🔄 DragStart no elemento filho');
        e.stopPropagation();
      }, { once: true });
      
      setMessage('Event listeners adicionados! Teste arrastar o elemento filho.');
    } else {
      console.log('❌ Nenhum elemento filho encontrado');
      setMessage('Nenhum elemento filho encontrado. Crie um grupo primeiro!');
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-bold mb-2">🧪 Teste de Desaninhamento</h3>
      <p className="text-sm text-gray-600 mb-4">
        Clique no botão para testar se os eventos estão funcionando corretamente.
      </p>
      <Button onClick={handleTest} className="mb-2">
        Executar Teste
      </Button>
      {message && (
        <div className="text-sm p-2 bg-blue-100 rounded">
          {message}
        </div>
      )}
    </div>
  );
};