# Nova Lógica de Drag & Drop com Sensibilidade de 20%

## Problema Resolvido

A lógica anterior tinha uma zona morta onde era difícil detectar quando o objeto deveria mudar para o bloco de cima ou de baixo. Isso acontecia porque a detecção só acontecia quando o mouse cruzava exatamente o meio de cada item.

## Nova Solução: Zona de Sensibilidade de 20%

### Como Funciona

1. **Divisão da Área**: Cada item no grupo é dividido em zonas
   - **Zona Central (60%)**: Área central onde não há mudança de posição
   - **Zona Superior (20%)**: Os primeiros 20% do item - indica possível movimento para cima
   - **Zona Inferior (20%)**: Os últimos 20% do item - indica possível movimento para baixo

2. **Cálculo da Sensibilidade**:
   ```typescript
   const sensitivityZone = itemHeight * 0.2; // 20% da altura do item
   const positionInItem = offsetY % itemHeight;
   
   if (positionInItem < sensitivityZone) {
     // Zona superior - pode mover para o item anterior
     newIndex = Math.max(0, baseIndex - 1);
   } else if (positionInItem > itemHeight - sensitivityZone) {
     // Zona inferior - pode mover para o próximo item
     newIndex = Math.min(localChildNodes.length, baseIndex + 1);
   }
   ```

3. **Logs Detalhados**: Agora os logs mostram informações sobre a zona de sensibilidade:
   ```
   🔄 Nó filho 'node-123' mudou posição para cima (zona superior - 20%) no grupo 'Group #1' (índice: 2 → 1)
   📦 Elemento 'Texto' mudou posição para baixo (zona inferior - 20%) no grupo 'Group #1' (índice: 1 → 2)
   ```

## Benefícios da Nova Lógica

### 1. **Maior Responsividade**
- Mudanças de posição são detectadas mais facilmente
- Não é necessário levar o mouse até o centro exato do item

### 2. **Experiência do Usuário Melhorada**
- Movimentos mais naturais e intuitivos
- Menos "pulos" inesperados na interface

### 3. **Debugging Facilitado**
- Logs mostram exatamente em qual zona a mudança aconteceu
- Informações detalhadas sobre índices anteriores e novos

## Exemplos de Funcionamento

### Cenário 1: Movimento para Cima
```
Antes: Mouse na posição Y=150 (meio do item 2)
Depois: Mouse na posição Y=130 (zona superior do item 2)
Resultado: Mudança para posição 1 com log "zona superior - 20%"
```

### Cenário 2: Movimento para Baixo
```
Antes: Mouse na posição Y=180 (meio do item 2)  
Depois: Mouse na posição Y=195 (zona inferior do item 2)
Resultado: Mudança para posição 3 com log "zona inferior - 20%"
```

### Cenário 3: Grupo Vazio
```
Situação: Grupo sem elementos
Comportamento: Qualquer drop é posicionado na índice 0
Log: "será posicionado no início do grupo (grupo vazio)"
```

## Logs Implementados

### 1. **Logs de Debug Básico**
```typescript
console.log('🎯 GROUPDRAGOVER:', title, 'isDragOver:', isDragOver);
console.log('📋 DataTransfer types:', types);
console.log('🔍 Debug info:', { draggedNodeId, elementData, localChildNodesCount });
```

### 2. **Logs de Posição com Sensibilidade**
```typescript
console.log('🎯 SENSITIVITY DEBUG:', {
  offsetY, itemHeight, baseIndex, positionInItem,
  sensitivityZone: sensitivityZone.toFixed(2),
  newIndex, previousIndex, isPositionChange
});
```

### 3. **Logs de Mudança de Posição**
```typescript
// Para nós filhos
console.log(`🔄 Nó filho '${draggedNodeId}' mudou posição ${direction} ${zoneInfo} no grupo '${title}' (índice: ${previousIndex} → ${newIndex})`);

// Para elementos da sidebar  
console.log(`📦 Elemento '${element.label}' mudou posição ${direction} ${zoneInfo} no grupo '${title}' (índice: ${previousIndex} → ${newIndex})`);
```

## Configuração da Sensibilidade

A sensibilidade pode ser ajustada facilmente modificando o valor `0.2` na linha:
```typescript
const sensitivityZone = itemHeight * 0.2; // 20% - ajustável
```

**Valores sugeridos:**
- `0.15` (15%): Sensibilidade moderada
- `0.2` (20%): **Configuração atual** - Balanceada
- `0.25` (25%): Alta sensibilidade
- `0.3` (30%): Muito alta sensibilidade

## Teste da Funcionalidade

Para testar a nova lógica:

1. Abra o console do navegador (F12)
2. Crie um grupo ou arraste elementos para formar grupos com múltiplos itens
3. Arraste um elemento sobre o grupo
4. Mova o mouse lentamente pelos itens
5. Observe como a mudança de posição acontece nos primeiros e últimos 20% de cada item
6. Verifique os logs detalhados no console

## Arquivos Modificados

- `src/components/flow/nodes/GroupNode.tsx`: Implementação da nova lógica de sensibilidade
- `src/components/flow/useFlowLogic.ts`: Logs de debug global (mantidos para monitoramento)

A nova lógica torna a experiência de drag & drop muito mais suave e responsiva, eliminando a "zona morta" da implementação anterior.