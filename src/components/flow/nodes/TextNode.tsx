import { memo, useState, useRef } from 'react';
import { Handle, Position, NodeProps } from '@flow/react';
import { Box, Flex, Text, Textarea, useToken } from '@chakra-ui/react';

const TextNode = memo(({ data, id, selected }: NodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(
    (data.element && (data.element as any).description) || 'Clique para editar...'
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.select();
      }
    }, 0);
  };

  const handleStopEdit = () => {
    setIsEditing(false);
    if ((data as any).setNodeEditing) {
      (data as any).setNodeEditing(id, false);
    }
  };

  const handleSave = () => {
    if ((data as any).updateNodeContent) {
      (data as any).updateNodeContent(id, content);
    }
    handleStopEdit();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      handleStopEdit();
    }
  };

  // Função para selecionar todo o texto ao focar
  const handleTextareaFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    e.target.select();
  };

  // Função utilitária para quebrar o texto em linhas de até 23 caracteres
  function splitTextByLength(text: string, maxLen: number) {
    const lines: string[] = [];
    let i = 0;
    while (i < text.length) {
      lines.push(text.slice(i, i + maxLen));
      i += maxLen;
    }
    return lines;
  }

  // Cores adaptativas para modo claro/escuro
  const [gray100, gray700, gray200, gray600, gray300, blue400, blue500, white, gray800] = useToken('colors', ['gray.100', 'gray.700', 'gray.200', 'gray.600', 'gray.300', 'blue.400', 'blue.500', 'white', 'gray.800']);
  const bgColor = gray800;
  const hoverBg = gray700;
  const borderColor = gray600;
  const selectedBorderColor = blue400;
  const textColor = white;
  const textColorDark = gray300;
  const textareaBg = gray700;
  const textareaBgDark = gray800;
  const textareaBorder = gray600;
  const textareaBorderDark = gray700;

  return (
    <Box
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      minW="180px"
      minH="80px"
      p="4"
      borderRadius="md"
      bg={bgColor}
      border="2px solid"
      borderColor={selected ? selectedBorderColor : borderColor}
      boxShadow={selected ? '0 0 0 2px rgba(66, 153, 225, 0.6)' : 'none'}
      transition="all 0.2s ease"
      _hover={{ boxShadow: '0 0 0 2px rgba(66, 153, 225, 0.3)' }}
      position="relative"
      style={{ userSelect: 'none' }}
    >
      {/* Handle de entrada (top) */}
      <Handle type="target" position={Position.Top} />

      {/* Header do nó */}
      <Flex align="center" gap="2" fontWeight="bold" fontSize="md" mb="2" color={white}>
        <Text fontSize="2xl" color={white}>
          {(data.element && (data.element as any).icon) || '💬'}
        </Text>
        <Text>{(data.element && (data.element as any).label) || 'Texto'}</Text>
      </Flex>

      {/* Conteúdo editável */}
      <Box minH="60px" w="full" pt={2}>
        {isEditing ? (
          <Textarea
            ref={textareaRef}
            className='scroll'
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            autoFocus
            onFocus={handleTextareaFocus}
            minH="60px"
            p="2"
            bg={textareaBg}
            border="1px solid"
            borderColor={textareaBorder}
            rounded="md"
            resize="none"
            w="235px"
            lineHeight="1.4"
            overflow="auto"
            color={white}
            _placeholder={{ color: gray300 }}
          />
        ) : (
          <Box
            onClick={handleStartEdit}
            onDoubleClick={handleStartEdit}
            cursor="pointer"
            p="2"
            rounded="md"
            transition="background 0.2s"
            _hover={{ bg: hoverBg }}
            _focus={{ bg: hoverBg }}
            color={textColor}
            whiteSpace="pre-wrap"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
            border="1px solid"
            borderColor={gray600}
          >
            {splitTextByLength(content, 23).map((line, idx) => (
              <Text key={idx}>{line}</Text>
            ))}
          </Box>
        )}
      </Box>

      {/* Handle de saída (bottom) */}
      <Handle type="source" position={Position.Bottom} />
    </Box>
  );
});

export default TextNode;
