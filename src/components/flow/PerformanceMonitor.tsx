import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, Button, HStack, VStack, Badge } from '@chakra-ui/react';
import { Node, Edge } from '@flow/react';

interface PerformanceMonitorProps {
  nodes: Node[];
  edges: Edge[];
  onPerformanceUpdate?: (metrics: PerformanceMetrics) => void;
}

interface PerformanceMetrics {
  nodeCount: number;
  edgeCount: number;
  memoryUsage: number;
  renderTime: number;
  timestamp: number;
}

export function PerformanceMonitor({ nodes, edges, onPerformanceUpdate }: PerformanceMonitorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    nodeCount: 0,
    edgeCount: 0,
    memoryUsage: 0,
    renderTime: 0,
    timestamp: Date.now()
  });

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const fpsRef = useRef(0);

  useEffect(() => {
    const measurePerformance = () => {
      const now = performance.now();
      frameCountRef.current++;
      
      if (now - lastTimeRef.current >= 1000) {
        fpsRef.current = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current));
        frameCountRef.current = 0;
        lastTimeRef.current = now;

        // Calculate memory usage if available
        const memoryInfo = (performance as any).memory;
        const memoryUsage = memoryInfo ? Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024) : 0;

        const newMetrics: PerformanceMetrics = {
          nodeCount: nodes.length,
          edgeCount: edges.length,
          memoryUsage,
          renderTime: 1000 / fpsRef.current,
          timestamp: Date.now()
        };

        setMetrics(newMetrics);
        onPerformanceUpdate?.(newMetrics);
      }

      if (isVisible) {
        requestAnimationFrame(measurePerformance);
      }
    };

    if (isVisible) {
      requestAnimationFrame(measurePerformance);
    }
  }, [nodes.length, edges.length, isVisible, onPerformanceUpdate]);

  if (!isVisible) {
    return (
      <Box
        position="fixed"
        bottom="20px"
        right="20px"
        bg="gray.800"
        color="white"
        px={3}
        py={2}
        borderRadius="md"
        fontSize="sm"
        cursor="pointer"
        onClick={() => setIsVisible(true)}
        _hover={{ bg: 'gray.700' }}
        zIndex={999}
      >
        ⚡ Performance ({fpsRef.current} FPS)
      </Box>
    );
  }

  return (
    <Box
      position="fixed"
      bottom="20px"
      right="20px"
      width="300px"
      bg="gray.900"
      color="white"
      borderRadius="lg"
      border="1px solid"
      borderColor="gray.600"
      zIndex={999}
      overflow="hidden"
      boxShadow="xl"
    >
      {/* Header */}
      <HStack justify="space-between" p={3} bg="gray.800" borderBottom="1px solid" borderColor="gray.600">
        <Text fontWeight="bold">⚡ Performance Monitor</Text>
        <Button size="xs" onClick={() => setIsVisible(false)} colorScheme="red">
          Fechar
        </Button>
      </HStack>

      {/* Metrics */}
      <Box p={3}>
        <VStack gap={2} align="stretch">
          <HStack justify="space-between">
            <Text fontSize="sm">FPS:</Text>
            <Badge 
              colorScheme={fpsRef.current > 50 ? 'green' : fpsRef.current > 30 ? 'yellow' : 'red'}
              fontSize="sm"
            >
              {fpsRef.current}
            </Badge>
          </HStack>

          <HStack justify="space-between">
            <Text fontSize="sm">Render Time:</Text>
            <Badge 
              colorScheme={metrics.renderTime < 16 ? 'green' : metrics.renderTime < 33 ? 'yellow' : 'red'}
              fontSize="sm"
            >
              {metrics.renderTime.toFixed(1)}ms
            </Badge>
          </HStack>

          <HStack justify="space-between">
            <Text fontSize="sm">Nodes:</Text>
            <Badge colorScheme="blue" fontSize="sm">
              {metrics.nodeCount}
            </Badge>
          </HStack>

          <HStack justify="space-between">
            <Text fontSize="sm">Edges:</Text>
            <Badge colorScheme="purple" fontSize="sm">
              {metrics.edgeCount}
            </Badge>
          </HStack>

          {metrics.memoryUsage > 0 && (
            <HStack justify="space-between">
              <Text fontSize="sm">Memory:</Text>
              <Badge 
                colorScheme={metrics.memoryUsage < 50 ? 'green' : metrics.memoryUsage < 100 ? 'yellow' : 'red'}
                fontSize="sm"
              >
                {metrics.memoryUsage}MB
              </Badge>
            </HStack>
          )}
        </VStack>

        {/* Performance Summary */}
        <Box mt={3} p={2} bg="gray.800" borderRadius="md">
          <Text fontSize="xs" color="gray.400" mb={1}>Performance Summary:</Text>
          <Text fontSize="xs">
            {fpsRef.current > 50 ? '🟢 Excellent' : 
             fpsRef.current > 30 ? '🟡 Good' : '🔴 Needs Attention'}
          </Text>
          <Text fontSize="xs" color="gray.400">
            {metrics.nodeCount > 100 ? 'Many nodes' : 
             metrics.nodeCount > 50 ? 'Moderate nodes' : 'Light workload'}
          </Text>
        </Box>

        {/* Actions */}
        <HStack mt={3} gap={2}>
          <Button 
            size="xs" 
            colorScheme="blue" 
            flex={1}
            onClick={() => {
              console.log('📊 Performance Report:', {
                fps: fpsRef.current,
                renderTime: metrics.renderTime,
                nodeCount: metrics.nodeCount,
                edgeCount: metrics.edgeCount,
                memoryUsage: metrics.memoryUsage,
                timestamp: new Date().toISOString()
              });
            }}
          >
            Export
          </Button>
          <Button 
            size="xs" 
            colorScheme="orange" 
            flex={1}
            onClick={() => {
              // Force garbage collection if available
              if ((window as any).gc) {
                (window as any).gc();
              }
            }}
          >
            GC
          </Button>
        </HStack>
      </Box>
    </Box>
  );
}