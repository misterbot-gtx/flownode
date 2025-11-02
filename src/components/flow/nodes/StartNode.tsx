import { Handle, Position, NodeProps } from '@xyflow/react';
import { Box, Text, Flex, Icon } from '@chakra-ui/react';
import { MdOutlineFlag } from 'react-icons/md';
import { useState } from 'react';

interface StartNodeData {
  label: string;
}

function StartNode({ data, selected }: NodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const nodeData = data as unknown as StartNodeData;

  return (
    <Box
      padding='5px 20px'
      borderWidth='1px'
      borderStyle='solid'
      borderColor={
        selected
          ? 'var(--chakra-colors-blue-400)'
          : isHovered
          ? 'var(--chakra-colors-blue-500)'
          : 'var(--chakra-colors-blue-600)'
      }
      borderRadius='5px'
      bg={selected ? 'var(--chakra-colors-blue-900)' : 'var(--chakra-colors-blue-950)'}
      textAlign='center'
      minWidth='150px'
      boxShadow={
        selected
          ? '0px 0px 15px rgba(59, 130, 246, 0.3), 0px 2px 5px rgba(0,0,0,0.2)'
          : isHovered
          ? '0px 3px 8px rgba(59, 130, 246, 0.15)'
          : '0px 2px 5px rgba(0,0,0,0.1)'
      }
      color='white'
      position='relative'
      transition='all 0.2s ease'
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Flex alignItems='center' justifyContent='center'>
        <Icon as={MdOutlineFlag} mr='8px' color={selected ? 'var(--chakra-colors-blue-200)' : 'var(--chakra-colors-blue-300)'} />
        <Text fontWeight='bold' color={selected ? 'var(--chakra-colors-blue-50)' : 'white'}>
          {nodeData.label}
        </Text>
      </Flex>
      <Handle
        style={{
          height: 5,
          backgroundColor: selected ? 'var(--chakra-colors-blue-300)' : 'var(--chakra-colors-blue-400)',
          borderColor: selected ? 'var(--chakra-colors-blue-200)' : 'var(--chakra-colors-blue-300)',
          borderWidth: '1px',
          borderStyle: 'solid',
          transition: 'all 0.2s ease'
        }}
        type="source"
        position={Position.Right}
      />
    </Box>
  );
}

export default StartNode; 