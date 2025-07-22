import { Handle, Position } from '@xyflow/react';
import { Box, Text, Flex, Icon } from '@chakra-ui/react';
import { MdOutlineFlag } from 'react-icons/md';

interface StartNodeData {
  label: string;
}

function StartNode({ data }: { data: StartNodeData }) {
  return (
    <Box
      padding='5px 20px'
      border='1px solid #333'
      borderRadius='5px'
      bg='var(--chakra-colors-gray-950)'
      textAlign='center'
      minWidth='150px'
      boxShadow='0px 2px 5px rgba(0,0,0,0.1)'
      color='white'
      position='relative'
    >
      <Flex alignItems='center' justifyContent='center'>
        <Icon as={MdOutlineFlag} mr='8px' />
        <Text fontWeight='bold'>{data.label}</Text>
      </Flex>
      <Handle style={{height: 5, backgroundColor: 'var(--chakra-colors-gray-700)'}} type="source" position={Position.Right} />
    </Box>
  );
}

export default StartNode; 