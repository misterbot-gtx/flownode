import { useRef, useCallback } from 'react';

export interface UseSidebarDragPreviewOptions<Payload = any> {
  render?: (payload: Payload) => HTMLElement;
  className?: string;
}

export function useSidebarDragPreview<Payload = any>(options?: UseSidebarDragPreviewOptions<Payload>) {
  const previewRef = useRef<HTMLElement | null>(null);
  const listenersRef = useRef<{
    dragover?: (ev: DragEvent) => void;
    mousemove?: (ev: MouseEvent) => void;
    drop?: () => void;
    dragend?: () => void;
    cleanup?: () => void;
    mousedown?: () => void;
    pointerdown?: () => void;
    keydown?: (ev: KeyboardEvent) => void;
  } | null>(null);

  const stopPreview = useCallback(() => {
    if (previewRef.current) {
      const el = previewRef.current as any;
      if (el._dragOverHandler) {
        window.removeEventListener('dragover', el._dragOverHandler);
        document.body.removeEventListener('dragover', el._dragOverHandler);
        document.removeEventListener('dragover', el._dragOverHandler);
      }
      if (el._mouseMoveHandler) {
        window.removeEventListener('mousemove', el._mouseMoveHandler);
      }
      if (previewRef.current.parentElement) {
        previewRef.current.parentElement.removeChild(previewRef.current);
      }
      previewRef.current = null;
    }

    document.body.style.userSelect = '';
    document.documentElement.style.overflow = '';

    if (listenersRef.current) {
      const { drop, dragend, cleanup, mousedown, pointerdown, keydown } = listenersRef.current;
      if (drop) window.removeEventListener('drop', drop);
      if (dragend) window.removeEventListener('dragend', dragend);
      if (cleanup) window.removeEventListener('forceSidebarPreviewCleanup' as any, cleanup);
      if (mousedown) window.removeEventListener('mousedown', mousedown);
      if (pointerdown) window.removeEventListener('pointerdown', pointerdown);
      if (keydown) window.removeEventListener('keydown', keydown);
      listenersRef.current = null;
    }
  }, []);

  const startPreview = useCallback((startEvent: DragEvent, payload?: Payload) => {
    stopPreview();

    document.body.style.userSelect = 'none';
    document.documentElement.style.overflow = 'hidden';

    const el = options?.render ? options.render(payload as Payload) : document.createElement('div');
    if (!options?.render) {
      el.textContent = '';
    }
    el.style.position = 'fixed';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '9999';
    el.style.left = '-9999px';
    el.style.top = '-9999px';
    if (options?.className) {
      el.className = options.className;
    } else if (!options?.render) {
      el.className = 'dragging-previews';
    }

    const updatePosition = (x: number, y: number) => {
      const rect = el.getBoundingClientRect();
      const ox = rect.width / 20;
      const oy = rect.height / 2;
      el.style.left = `${x - ox}px`;
      el.style.top = `${y - oy}px`;
    };

    document.body.appendChild(el);
    previewRef.current = el;

    const dragOverHandler = (ev: DragEvent) => {
      if (typeof ev.clientX === 'number' && typeof ev.clientY === 'number') {
        updatePosition(ev.clientX, ev.clientY);
      }
    };
    window.addEventListener('dragover', dragOverHandler);
    document.body.addEventListener('dragover', dragOverHandler);
    document.addEventListener('dragover', dragOverHandler);

    const mouseMoveHandler = (ev: MouseEvent) => {
      if (typeof ev.clientX === 'number' && typeof ev.clientY === 'number') {
        updatePosition(ev.clientX, ev.clientY);
      }
    };
    window.addEventListener('mousemove', mouseMoveHandler);

    (el as any)._dragOverHandler = dragOverHandler;
    (el as any)._mouseMoveHandler = mouseMoveHandler;

    const handleGlobalDropOrEnd = () => {
      stopPreview();
    };
    window.addEventListener('drop', handleGlobalDropOrEnd);
    window.addEventListener('dragend', handleGlobalDropOrEnd);

    const forceCleanup = () => stopPreview();
    const onMouseDown = () => forceCleanup();
    const onPointerDown = () => forceCleanup();
    const onEsc = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') forceCleanup();
    };
    window.addEventListener('forceSidebarPreviewCleanup' as any, forceCleanup);
    window.addEventListener('mousedown', onMouseDown, { once: true } as any);
    window.addEventListener('pointerdown', onPointerDown, { once: true } as any);
    window.addEventListener('keydown', onEsc);

    listenersRef.current = {
      drop: handleGlobalDropOrEnd,
      dragend: handleGlobalDropOrEnd,
      cleanup: forceCleanup,
      mousedown: onMouseDown,
      pointerdown: onPointerDown,
      keydown: onEsc,
    };

    updatePosition(startEvent.clientX, startEvent.clientY);
  }, [options, stopPreview]);

  return { startPreview, stopPreview };
}