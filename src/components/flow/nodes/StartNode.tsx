import { Handle, Position, NodeProps } from '@xyflow/react';
import { Box, Text, Flex, Icon, useToken } from '@chakra-ui/react';
import { MdOutlineFlag } from 'react-icons/md';

interface StartNodeData {
  label: string;
}

function StartNode({ data, selected }: NodeProps) {
  // Cores adaptativas para modo claro/escuro
  const [gray100, gray700, gray200, gray600, gray300, blue400, blue500, white, gray800] = useToken('colors', ['gray.100', 'gray.700', 'gray.200', 'gray.600', 'gray.300', 'blue.400', 'blue.500', 'white', 'gray.800']);
  
  const bgColor = 'var(--chakra-colors-gray-950)';
  const borderColor = selected ? blue400 : gray600;
  const boxShadow = selected ? '0 0 0 2px rgba(66, 153, 225, 0.6)' : '0px 2px 5px rgba(0,0,0,0.1)';
  const iconColor = selected ? blue400 : gray300;

  return (
    <Box
      padding='5px 20px'
      border='2px solid'
      borderColor={borderColor}
      borderRadius='8px'
      bg={bgColor}
      textAlign='center'
      minWidth='150px'
      boxShadow={boxShadow}
      color={white}
      position='relative'
      transition='all 0.2s ease'
      _hover={{
        boxShadow: selected
          ? '0 0 0 2px rgba(66, 153, 225, 0.8)'
          : '0 0 0 2px rgba(66, 153, 225, 0.3)'
      }}
    >
      <Flex alignItems='center' justifyContent='center'>
        <Icon
          as={MdOutlineFlag}
          mr='8px'
          color={iconColor}
          transition='color 0.2s ease'
        />
        <Text
          fontWeight='bold'
          color={selected ? blue400 : white}
          transition='color 0.2s ease'
        >
          {data.label}
        </Text>
      </Flex>
      <Handle
        style={{
          height: 5,
          backgroundColor: selected ? blue400 : 'var(--chakra-colors-gray-700)',
          border: selected ? '2px solid #3b82f6' : '2px solid #ffffff',
          transition: 'all 0.2s ease'
        }}
        type="source"
        position={Position.Right}
      />
    </Box>
  );
}

export default StartNode; 