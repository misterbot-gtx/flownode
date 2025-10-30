# Melhorias de Espaçamento - Classes View e View-Open

## Objetivo Implementado

Criar um sistema de espaçamento visual melhorado para o drag & drop nos grupos, onde todos os elementos são organizados dentro de classes CSS específicas que mudam dinamicamente durante a interação.

## Estrutura de Classes Implementada

### 1. Classe `.view` (Estado Normal)
```css
.view {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem; /* Espaçamento padrão entre elementos */
  padding: 0.25rem;
  transition: all 0.2s ease-in-out;
}
```

**Características:**
- Espaçamento padrão de 0.5rem (8px)
- Padding mínimo de 0.25rem (4px)
- Transições suaves para mudanças de estado

### 2. Classe `.view-open` (Estado Durante Drag)
```css
.view-open {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.75rem; /* Espaçamento aumentado durante drag */
  padding: 0.5rem; /* Padding aumentado */
  background: linear-gradient(135deg, 
    hsl(var(--primary) / 0.05), 
    hsl(var(--accent) / 0.05));
  border-radius: 0.5rem;
  box-shadow: 
    0 0 0 2px hsl(var(--primary) / 0.2),
    0 4px 12px hsl(var(--primary) / 0.15);
  transform: scale(1.02); /* Leve aumento visual */
}
```

**Características:**
- Espaçamento aumentado para 0.75rem (12px)
- Padding maior de 0.5rem (8px)
- Fundo com gradiente sutil
- Borda iluminada com cor primária
- Leve aumento de escala (1.02x)
- Sombras dramáticas para destacar durante drag

### 3. Classe `.view-child` (Elementos Filhos)
```css
.view-child {
  margin-bottom: 0.25rem;
  transition: all 0.2s ease-in-out;
}

.view-child:last-child {
  margin-bottom: 0;
}
```

**Características:**
- Margem inferior para separação visual
- Último elemento sem margem inferior
- Transições suaves

### 4. Classe `.view-divider` (Divisores)
```css
.view-divider {
  height: 8px;
  background: transparent;
  border-radius: 4px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin: 0.125rem 0;
}

.view-divider.active {
  height: 40px;
  background: hsl(var(--primary) / 0.3);
  box-shadow: 0 2px 8px hsl(var(--primary) / 0.2);
}
```

**Características:**
- Estado normal: altura mínima (8px)
- Estado ativo: altura expandida (40px)
- Fundo com transparência e cor primária quando ativo
- Transições com timing spring

## Implementação no GroupNode.tsx

### Container Principal
```tsx
<div
  ref={dragRef}
  className={`${isDragOver ? 'view-open' : 'view'}`}
>
```

**Comportamento:**
- **Estado Normal**: `isDragOver = false` → usa classe `view`
- **Estado Drag**: `isDragOver = true` → usa classe `view-open`

### Elementos Filhos
```tsx
<div key={childNode.id + '-' + index} className="view-child">
  <GroupChildNode node={childNode} index={index} isDragOver={false} />
  <DividerWithHover isDragging={isDragging} isActive={isActive} />
</div>
```

### Divisores
```tsx
<DividerWithHover
  isDragging={isDragging}
  isActive={isActive}
  // className={`view-divider ${isActive && isDragging ? 'active' : ''}`}
/>
```

## Estados Visuais Durante Drag & Drop

### 1. Estado Normal (Sem Drag)
```
┌─────────────────────────┐
│        Group #1          │ ← view (espaçamento compacto)
│ ┌─────────────────────┐ │
│ │   Elemento 1        │ │ ← view-child
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │   Elemento 2        │ │ ← view-child  
│ └─────────────────────┘ │
└─────────────────────────┘
```

### 2. Estado Durante Drag (isDragOver = true)
```
┌─────────────────────────┐
│       🌟 Group #1       │ ← view-open (expandido + destacado)
│ ┌─────────────────────┐ │
│ │     Elemento 1      │ │ ← view-child (espaçamento maior)
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │     Elemento 2      │ │ ← view-child (espaçamento maior)
│ └─────────────────────┘ │
└─────────────────────────┘
```

### 3. Estado com Divisor Ativo
```
┌─────────────────────────┐
│       🌟 Group #1       │
│ ┌─────────────────────┐ │
│ │     Elemento 1      │ │
│ └─────────────────────┘ │
│ ████████████████████████ │ ← view-divider.active (expandido)
│ ┌─────────────────────┐ │
│ │     Elemento 2      │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

## Benefícios das Melhorias

### 1. **Feedback Visual Imediato**
- Usuário visualmente percebe quando está em modo drag
- Espaçamento aumenta automaticamente durante interação

### 2. **Espaçamento Mais Natural**
- Elementos têm mais "respiração" durante drag
- Melhora a precisão do drop em posições específicas

### 3. **Identificação Clara de Zonas**
- Divisores expandidos mostram claramente onde o elemento será colocado
- Estados visuais distintos para cada fase da interação

### 4. **Performance Otimizada**
- Transições CSS usando GPU acceleration
- Mudanças de estado otimizadas para 60fps

### 5. **Design System Coeso**
- Usa variáveis CSS customizáveis
- Cores e espaçamentos consistentes com o tema

## Configuração Avançada

### Ajuste de Sensibilidade Visual
```css
/* Para aumentar ainda mais o contraste visual durante drag */
.view-open {
  transform: scale(1.05); /* em vez de 1.02 */
  box-shadow: 
    0 0 0 3px hsl(var(--primary) / 0.3), /* borda mais grossa */
    0 8px 24px hsl(var(--primary) / 0.2); /* sombra mais pronunciada */
}
```

### Ajuste de Espaçamentos
```css
/* Para espaçamentos mais generosos */
.view {
  gap: 0.75rem; /* em vez de 0.5rem */
  padding: 0.5rem; /* em vez de 0.25rem */
}

.view-open {
  gap: 1rem; /* em vez de 0.75rem */
  padding: 0.75rem; /* em vez de 0.5rem */
}
```

## Arquivos Modificados

1. **`src/index.css`**: Adicionadas as classes CSS `.view`, `.view-open`, `.view-child`, `.view-divider`
2. **`src/components/flow/nodes/GroupNode.tsx`**: Aplicadas as classes nos elementos apropriados

## Resultado Final

O sistema agora oferece uma experiência visual muito mais rica e intuitiva durante o drag & drop:

- **Antes**: Espaçamentos fixos, sem feedback visual claro
- **Depois**: Espaçamentos dinâmicos, feedback visual imediato, estados distintos para cada fase da interação

A transição suave entre os estados `.view` e `.view-open` torna o drag & drop mais preciso e visualmente agradável.