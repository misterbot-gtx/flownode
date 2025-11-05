# 🔧 Guia de Debugging e Monitoramento - ReactFlow

Este projeto agora possui um conjunto completo de ferramentas de debugging e monitoramento para facilitar o desenvolvimento e debug do ReactFlow.

## 📋 Ferramentas Disponíveis

### 1. 🔧 Debug Panel
**Localização**: Canto superior direito da tela  
**Acesso**: Clique no indicador "🔧 Debug (X nodes, Y edges)"

#### Funcionalidades:
- **📊 Estatísticas em Tempo Real**
  - Total de nodes e edges
  - Número de grupos criados
  - Contagem de entradas de log

- **🧩 Análise de Tipos de Nodes**
  - Quantidade de cada tipo de node (startNode, textNode, etc.)
  - Breakdown visual por cores

- **🔗 Análise de Tipos de Edges**
  - Quantidade de cada tipo de edge
  - Status de conectividade

- **📝 Histórico de Nodes Recentes**
  - Últimos 5 nodes criados
  - Posição e metadados
  - ID e tipo de cada node

- **📋 Logs em Tempo Real**
  - Eventos do sistema em tempo real
  - Tipos: info, warning, error, success
  - Timestamps e dados contextuais

#### ⚡ Ações Rápidas:
- **📦 Exportar Fluxo**: Download do estado atual como JSON
- **📝 Log no Console**: Export para console do navegador
- **⚡ Teste Performance**: Métricas de performance em tempo real
- **🗑️ Limpar Logs**: Reset dos logs de debugging

### 2. ⚡ Performance Monitor
**Localização**: Canto inferior direito da tela  
**Acesso**: Clique no indicador "⚡ Performance (XX FPS)"

#### Métricas Monitoradas:
- **FPS (Frames Per Second)**
  - Verde: > 50 FPS (Excelente)
  - Amarelo: 30-50 FPS (Bom)
  - Vermelho: < 30 FPS (Atenção)

- **Render Time**
  - Tempo de renderização por frame
  - Verde: < 16ms (60 FPS)
  - Amarelo: 16-33ms (30-60 FPS)
  - Vermelho: > 33ms (< 30 FPS)

- **Contagem de Nodes/Edges**
  - Monitoramento de carga
  - Alertas para workloads pesados

- **Memory Usage** (quando disponível)
  - Uso de memória JavaScript
  - Monitoramento de vazamentos

#### Ações Disponíveis:
- **Export**: Gera relatório de performance
- **GC**: Força garbage collection (quando disponível)

### 3. 📊 Sistema de Logs Integrados

#### Eventos Automáticos:
- **Node Creation**: Quando novos nodes são criados
- **Edge Connections**: Quando conexões são estabelecidas
- **Group Operations**: Operações com grupos
- **Performance Warnings**: Alertas de performance
- **Error Tracking**: Captura automática de erros

#### Manual Logging:
```typescript
// Uso nos componentes
flow.addDebugLog('info', 'Mensagem aqui', { data: 'optional' });
flow.addDebugLog('success', 'Operação concluída');
flow.addDebugLog('warning', 'Atenção necessária');
flow.addDebugLog('error', 'Erro occurred', errorObject);
```

## 🎯 Casos de Uso Práticos

### 1. Debugging de Performance
```
1. Abrir Performance Monitor (canto inferior direito)
2. Verificar FPS e Render Time
3. Se performance estiver baixa:
   - Reduzir número de nodes visíveis
   - Verificar logs no Debug Panel
   - Exportar relatório de performance
```

### 2. Análise de Estado do Fluxo
```
1. Abrir Debug Panel (canto superior direito)
2. Verificar estatísticas gerais
3. Analisar tipos de nodes criados
4. Exportar estado atual como JSON
5. Ver logs recentes para eventos
```

### 3. Troubleshooting de Bugs
```
1. Monitorar logs em tempo real no Debug Panel
2. Verificar eventos de erro
3. Exportar dados do fluxo para análise
4. Usar Performance Monitor para identificar gargalos
5. Console.log integrado para debug profundo
```

### 4. Otimização de Fluxos Grandes
```
1. Monitorar contagem de nodes/edges
2. Verificar uso de memória
3. Identificar tipos de nodes mais utilizados
4. Analisar padrões de performance
5. Implementar estratégias de otimização
```

## 🚀 Configurações Avançadas

### Console Debugging
```typescript
// Log completo do estado
console.log('ReactFlow State:', flow.nodes, flow.edges);

// Métricas de performance
console.log('Performance:', {
  nodes: flow.nodes.length,
  edges: flow.edges.length,
  timestamp: new Date().toISOString()
});
```

### Persistência de Dados
```typescript
// Export automático do estado
const exportData = {
  version: '1.0.0',
  timestamp: new Date().toISOString(),
  nodes: flow.nodes,
  edges: flow.edges,
  metadata: {
    nodeTypes: getNodeTypeBreakdown(flow.nodes),
    performance: getCurrentPerformanceMetrics()
  }
};
```

## 📱 Controles de Interface

### Debug Panel:
- **Abrir/Fechar**: Clique no indicador
- **Limpar Logs**: Botão laranja no header
- **Exportar Dados**: Botão azul em "Ações Rápidas"

### Performance Monitor:
- **Abrir/Fechar**: Clique no indicador FPS
- **Monitoramento Contínuo**: Ativado automaticamente quando aberto
- **Garbage Collection**: Botão laranja "GC"

## 🔍 Dicas de Debugging

1. **Performance**: Mantenha FPS > 30 para fluidez
2. **Memory**: Monitore uso de memória em fluxos grandes
3. **Logs**: Use logs estruturados para rastreamento
4. **Export**: Salve estados problemáticos para análise
5. **Real-time**: Monitore eventos em tempo real durante desenvolvimento

## 📞 Suporte

Para debug avançado:
1. Use as ferramentas integradas
2. Exporte dados para análise externa
3. Monitore console do navegador
4. Verifique logs de sistema
5. Analise métricas de performance

---

**Nota**: Todas as ferramentas de debugging são removíveis em produção através da remoção dos componentes DebugPanel e PerformanceMonitor do FlowBuilder.