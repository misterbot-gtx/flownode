import { addEdge, Connection, Edge } from '@xyflow/react';

// Função para lidar com a conexão entre nós
export function handleConnect(
  params: Connection,
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>
) {
  setEdges((eds) => addEdge(params, eds));
} 