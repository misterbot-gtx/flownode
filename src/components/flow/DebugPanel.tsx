import React, { useState, useCallback } from 'react';
import { Box, Text, Button, VStack, HStack, Badge, Code } from '@chakra-ui/react';
import { Node, Edge } from '@flow/react';

interface LogEntry {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: Date;
  data?: any;
}

interface DebugPanelProps {
  nodes: Node[];
  edges: Edge[];
  debugLogs: LogEntry[];
  onAddDebugLog?: (type: LogEntry['type'], message: string, data?: any) => void;
  onClearLogs?: () => void;
}

export function DebugPanel({ nodes, edges, debugLogs, onAddDebugLog, onClearLogs }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'error': return 'red';
      case 'warning': return 'orange';
      case 'success': return 'green';
      default: return 'blue';
    }
  };

  const getNodeTypeCount = () => {
    const counts: Record<string, number> = {};
    nodes.forEach(node => {
      counts[node.type || 'unknown'] = (counts[node.type || 'unknown'] || 0) + 1;
    });
    return counts;
  };

  const getEdgeCount = () => {
    const counts: Record<string, number> = {};
    edges.forEach(edge => {
      counts[edge.type || 'unknown'] = (counts[edge.type || 'unknown'] || 0) + 1;
    });
    return counts;
  };

  const exportFlowData = useCallback(() => {
    const flowData = {
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        data: edge.data
      })),
      metadata: {
        exportedAt: new Date().toISOString(),
        totalNodes: nodes.length,
        totalEdges: edges.length,
        version: '1.0.0'
      }
    };

    const dataStr = JSON.stringify(flowData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `reactflow-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    onAddDebugLog?.('success', 'Fluxo exportado com sucesso', {
      fileName: `reactflow-export-${new Date().toISOString().split('T')[0]}.json`,
      nodes: nodes.length,
      edges: edges.length
    });
  }, [nodes, edges, onAddDebugLog]);

  const clearLogs = useCallback(() => {
    onClearLogs?.();
    onAddDebugLog?.('info', 'Logs do debug panel limpos');
  }, [onClearLogs, onAddDebugLog]);

  const nodeTypeCounts = getNodeTypeCount();
  const edgeTypeCounts = getEdgeCount();

  if (!isOpen) {
    return (
      <Box
        position="fixed"
        top="4px"
        right="280px"
        zIndex={1000}
        bg="gray.800"
        color="white"
        px={3}
        py={1}
        borderRadius="md"
        fontSize="sm"
        cursor="pointer"
        onClick={() => setIsOpen(true)}
        _hover={{ bg: 'gray.700' }}
      >
        🔧 Debug ({nodes.length} nodes, {edges.length} edges)
      </Box>
    );
  }

  return (
    <Box
      position="fixed"
      top="4px"
      right="20px"
      width="400px"
      maxHeight="80vh"
      bg="gray.900"
      color="white"
      borderRadius="lg"
      border="1px solid"
      borderColor="gray.600"
      zIndex={1000}
      overflow="hidden"
      boxShadow="xl"
    >
      {/* Header */}
      <HStack justify="space-between" p={3} bg="gray.800" borderBottom="1px solid" borderColor="gray.600">
        <Text fontWeight="bold" fontSize="lg">🔧 ReactFlow Debug Panel</Text>
        <HStack>
          <Button size="xs" onClick={clearLogs} colorScheme="orange">
            Limpar Logs
          </Button>
          <Button size="xs" onClick={() => setIsOpen(false)} colorScheme="red">
            Fechar
          </Button>
        </HStack>
      </HStack>

      <Box p={3} overflowY="auto" maxHeight="calc(80vh - 60px)">
        <VStack gap={4} align="stretch">
          {/* Stats Overview */}
          <Box bg="gray.800" p={3} borderRadius="md">
            <Text fontWeight="bold" mb={2}>📊 Estatísticas</Text>
            <VStack gap={2} align="stretch">
              <HStack justify="space-between">
                <Text>Total Nodes:</Text>
                <Badge colorScheme="blue">{nodes.length}</Badge>
              </HStack>
              <HStack justify="space-between">
                <Text>Total Edges:</Text>
                <Badge colorScheme="blue">{edges.length}</Badge>
              </HStack>
              <HStack justify="space-between">
                <Text>Groups:</Text>
                <Badge colorScheme="purple">{nodes.filter(n => n.type === 'groupNode').length}</Badge>
              </HStack>
              <HStack justify="space-between">
                <Text>Log Entries:</Text>
                <Badge colorScheme="cyan">{debugLogs.length}</Badge>
              </HStack>
            </VStack>
          </Box>

          {/* Node Types */}
          <Box bg="gray.800" p={3} borderRadius="md">
            <Text fontWeight="bold" mb={2}>🧩 Tipos de Nodes</Text>
            <VStack gap={1} align="stretch">
              {Object.entries(nodeTypeCounts).map(([type, count]) => (
                <HStack key={type} justify="space-between">
                  <Code fontSize="sm" color="cyan">{type}</Code>
                  <Badge colorScheme="cyan">{count}</Badge>
                </HStack>
              ))}
            </VStack>
          </Box>

          {/* Edge Types */}
          <Box bg="gray.800" p={3} borderRadius="md">
            <Text fontWeight="bold" mb={2}>🔗 Tipos de Edges</Text>
            <VStack gap={1} align="stretch">
              {Object.entries(edgeTypeCounts).map(([type, count]) => (
                <HStack key={type} justify="space-between">
                  <Code fontSize="sm" color="yellow">{type}</Code>
                  <Badge colorScheme="yellow">{count}</Badge>
                </HStack>
              ))}
            </VStack>
          </Box>

          {/* Recent Nodes */}
          <Box bg="gray.800" p={3} borderRadius="md">
            <Text fontWeight="bold" mb={2}>📝 Nodes Recentes</Text>
            <VStack gap={2} align="stretch" maxH="150px" overflowY="auto">
              {nodes.slice(-5).reverse().map((node) => (
                <Box key={node.id} p={2} bg="gray.700" borderRadius="md">
                  <HStack justify="space-between">
                    <Text fontSize="sm" fontWeight="bold">{node.id}</Text>
                    <Badge colorScheme="blue" size="sm">{node.type}</Badge>
                  </HStack>
                  <Text fontSize="xs" color="gray.300">
                    Pos: ({Math.round(node.position.x)}, {Math.round(node.position.y)})
                  </Text>
                  {node.data?.label && (
                    <Text fontSize="xs" color="gray.400">
                      Label: {String(node.data.label)}
                    </Text>
                  )}
                </Box>
              ))}
            </VStack>
          </Box>

          {/* Live Logs */}
          <Box bg="gray.800" p={3} borderRadius="md">
            <Text fontWeight="bold" mb={2}>📋 Logs em Tempo Real</Text>
            <VStack gap={2} align="stretch" maxH="200px" overflowY="auto">
              {debugLogs.slice(0, 15).map((log) => (
                <Box key={log.id} p={2} bg="gray.700" borderRadius="md" borderLeft="3px solid" borderColor={`${getLogColor(log.type)}.400`}>
                  <HStack justify="space-between" mb={1}>
                    <Text fontSize="sm" fontWeight="bold">{log.message}</Text>
                    <Badge colorScheme={getLogColor(log.type)} size="sm">{log.type}</Badge>
                  </HStack>
                  <Text fontSize="xs" color="gray.400">
                    {log.timestamp.toLocaleTimeString()}
                  </Text>
                  {log.data && (
                    <Code fontSize="xs" mt={1} display="block" p={1} bg="gray.600" maxH="60px" overflowY="auto">
                      {JSON.stringify(log.data, null, 2).slice(0, 200)}...
                    </Code>
                  )}
                </Box>
              ))}
            </VStack>
          </Box>

          {/* Control Buttons */}
          <Box bg="gray.800" p={3} borderRadius="md">
            <Text fontWeight="bold" mb={2}>⚡ Ações Rápidas</Text>
            <VStack gap={2}>
              <Button
                size="sm"
                colorScheme="blue"
                width="full"
                onClick={exportFlowData}
              >
                📦 Exportar Fluxo
              </Button>
              <Button
                size="sm"
                colorScheme="green"
                width="full"
                onClick={() => {
                  console.log('🔧 ReactFlow State:', { nodes, edges });
                  onAddDebugLog?.('success', 'Estado salvo no console', {
                    nodes: nodes.length,
                    edges: edges.length
                  });
                }}
              >
                📝 Log no Console
              </Button>
              <Button
                size="sm"
                colorScheme="purple"
                width="full"
                onClick={() => {
                  onAddDebugLog?.('info', 'Teste de performance', {
                    timestamp: new Date().toISOString(),
                    nodesCount: nodes.length,
                    edgesCount: edges.length,
                    memoryUsage: (performance as any).memory?.usedJSHeapSize || 'N/A'
                  });
                }}
              >
                ⚡ Teste Performance
              </Button>
              <Button
                size="sm"
                colorScheme="orange"
                width="full"
                onClick={clearLogs}
              >
                🗑️ Limpar Logs
              </Button>
            </VStack>
          </Box>
        </VStack>
      </Box>
    </Box>
  );
}