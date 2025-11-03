# Correção da Estrutura de Grupos no React Flow

## Problema Anterior

O sistema armazenava os nós filhos dentro da propriedade `data` do nó de grupo:

```json
{
  "id": "group-1",
  "type": "groupNode",
  "data": {
    "title": "Grupo #1",
    "childNodes": [ /* array de nós filhos aqui */ ]
  }
}
```

**Problemas causados:**
- Os nós filhos não são reconhecidos pelo React Flow
- Não é possível arrastá-los, conectá-los ou removê-los corretamente
- O agrupamento é apenas visual, sem hierarquia real

## Solução Implementada

Agora todos os nós (pais e filhos) estão no array raiz `nodes`, seguindo as regras do React Flow para subflows.

### Estrutura Correta

```json
{
  "nodes": [
    { "id": "group-1", "type": "groupNode", "position": { "x": 559, "y": 372 }, "data": { "title": "Grupo #1" } },
    { "id": "textBubble-3", "type": "textNode", "position": { "x": 16, "y": 80 }, "parentId": "group-1", "extent": "parent", "data": { ... } },
    { "id": "imageBubble-2", "type": "imageNode", "position": { "x": 16, "y": 168 }, "parentId": "group-1", "extent": "parent", "data": { ... } }
  ]
}
```

### Regras Implementadas

1. **Todos os nós no array raiz**: Pais e filhos estão no mesmo nível do array `nodes`
2. **Ordem correta**: O nó pai (`group-1`) vem ANTES dos seus filhos no array
3. **Propriedades dos filhos**:
   - `parentId: "group-1"` - vincula ao grupo pai
   - `position` - posição relativa ao grupo (ex: `{ x: 16, y: 80 }`)
   - `extent: "parent"` - permite movimento independente dentro do grupo
4. **Dados limpos do grupo**: O `data` do grupo contém apenas metadados como `title`

## Modificações Realizadas

### 1. useFlowLogic.ts

#### processedNodes
- Remove `childNodes`, `childNodesIds` e `_updateTimestamp` dos dados do grupo
- Retorna apenas nós visíveis (sem parentId) no array raiz

#### exportFlow
- Exporta `nodes` completo (todos os nós, não apenas processedNodes)
- Inclui todos os nós filhos no array raiz

#### importFlow
- Processa todos os nós do export
- Remove childNodes dos dados do grupo
- Garante que nós com parentId tenham `extent: 'parent'`

#### Funções de criação de nós
- Adiciona `extent: 'parent' as const` para todos os nós criados com parentId

### 2. GroupNode.tsx

#### useReactFlow
- Usa `useReactFlow()` para acessar a API do React Flow
- Busca nós filhos dinamicamente baseado no `parentId`

#### useEffect para atualização de filhos
- Filtra nós com `node.parentId === id`
- Ordena por posição (Y, depois X)
- Atualiza estado local com nós filhos

#### LocalChildNodes
- Inicializa como array vazio
- É preenchido dinamicamente via React Flow API

## Benefícios da Nova Estrutura

1. **Hierarquia real**: React Flow reconhece a estrutura de grupos
2. **Funcionalidades nativas**: Arrastar, conectar, remover funcionam corretamente
3. **Movimento independente**: Nós filhos podem ser movidos dentro do grupo
4. **Estrutura compatível**: Segue as diretrizes oficiais do React Flow
5. **Export/Import corretos**: Dados são salvos e carregados na estrutura válida

## Como Usar

### Criar um grupo com elementos
1. Arraste elementos da sidebar para o canvas
2. Os elementos são automaticamente agrupados
3. Cada elemento filho terá `parentId` e `extent: 'parent'`

### Mover elementos dentro do grupo
1. Arraste um elemento filho - ele se move independentemente
2. O movimento é restrito aos limites do grupo
3. Solte para confirmar nova posição

### Remover elementos do grupo
1. Arraste um elemento filho para fora do grupo
2. O elemento é automaticamente desagrupado
3. `parentId` é removido e posição se torna absoluta

### Export/Import
- Use os botões "Export" e "Import" no DevTools
- Os arquivos seguirão a estrutura correta do React Flow
- Todos os grupos e elementos são preservados

## Exemplo de Arquivo Correto

Veja `src/examples/correct-structure.json` para um exemplo completo da estrutura correta.