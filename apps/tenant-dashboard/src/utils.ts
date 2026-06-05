import { ElementSchema, ResponsiveStyles, DeviceType } from './types.js';

export const generateId = (prefix = 'el'): string => {
  return `${prefix}_${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Compiles a React-compatible inline CSS styles object by cascading styles
 * from desktop down to laptop, tablet, and mobile.
 */
export function compileStyles(styles: ResponsiveStyles | undefined, activeDevice: DeviceType): React.CSSProperties {
  const safeStyles = styles || { desktop: {} };
  const merged: Record<string, string> = { ...(safeStyles.desktop || {}) };
  
  if (activeDevice === 'laptop' || activeDevice === 'tablet' || activeDevice === 'mobile') {
    if (safeStyles.laptop) {
      Object.assign(merged, safeStyles.laptop);
    }
  }
  
  if (activeDevice === 'tablet' || activeDevice === 'mobile') {
    if (safeStyles.tablet) {
      Object.assign(merged, safeStyles.tablet);
    }
  }
  
  if (activeDevice === 'mobile') {
    if (safeStyles.mobile) {
      Object.assign(merged, safeStyles.mobile);
    }
  }

  // Filter out empty values and return CSS
  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries(merged)) {
    if (val !== undefined && val !== '') {
      result[key] = val;
    }
  }
  
  return result as React.CSSProperties;
}

/**
 * Searches the nested element tree recursively for a matching element ID.
 */
export function findElementById(elements: ElementSchema[], id: string): ElementSchema | null {
  for (const el of elements) {
    if (el.id === id) return el;
    if (el.children && el.children.length > 0) {
      const found = findElementById(el.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Traverses the node tree and updates the target node properties.
 */
export function updateElementInTree(
  elements: ElementSchema[],
  id: string,
  updater: (el: ElementSchema) => Partial<ElementSchema>
): ElementSchema[] {
  return elements.map(el => {
    if (el.id === id) {
      return { ...el, ...updater(el) } as ElementSchema;
    }
    if (el.children && el.children.length > 0) {
      return { ...el, children: updateElementInTree(el.children, id, updater) };
    }
    return el;
  });
}

/**
 * Traverses the node tree and deletes the target node.
 */
export function deleteElementFromTree(elements: ElementSchema[], id: string): ElementSchema[] {
  return elements
    .filter(el => el.id !== id)
    .map(el => {
      if (el.children && el.children.length > 0) {
        return { ...el, children: deleteElementFromTree(el.children, id) };
      }
      return el;
    });
}

/**
 * Find the parent path hierarchy of a selected node to show in breadcrumbs.
 */
export function getBreadcrumbPath(elements: ElementSchema[], targetId: string, currentPath: { id: string; type: string }[] = []): { id: string; type: string }[] | null {
  for (const el of elements) {
    const path = [...currentPath, { id: el.id, type: el.type }];
    if (el.id === targetId) return path;
    if (el.children && el.children.length > 0) {
      const found = getBreadcrumbPath(el.children, targetId, path);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Inserts a new element into the tree relative to a target element.
 */
export function insertElementInTree(
  elements: ElementSchema[],
  targetId: string,
  newElement: ElementSchema,
  position: 'above' | 'below' | 'inside'
): ElementSchema[] {
  if (position === 'inside') {
    return elements.map(el => {
      if (el.id === targetId) {
        return {
          ...el,
          children: [...(el.children || []), newElement]
        };
      }
      if (el.children && el.children.length > 0) {
        return {
          ...el,
          children: insertElementInTree(el.children, targetId, newElement, position)
        };
      }
      return el;
    });
  }

  const idx = elements.findIndex(el => el.id === targetId);
  if (idx !== -1) {
    const listCopy = [...elements];
    const insertIdx = position === 'above' ? idx : idx + 1;
    listCopy.splice(insertIdx, 0, newElement);
    return listCopy;
  }

  return elements.map(el => {
    if (el.children && el.children.length > 0) {
      return {
        ...el,
        children: insertElementInTree(el.children, targetId, newElement, position)
      };
    }
    return el;
  });
}

/**
 * Moves an existing element from its current position to a new position in the tree.
 */
export function moveElementInTree(
  elements: ElementSchema[],
  sourceId: string,
  targetId: string,
  position: 'above' | 'below' | 'inside'
): ElementSchema[] {
  if (sourceId === targetId) return elements;
  const elementToMove = findElementById(elements, sourceId);
  if (!elementToMove) return elements;

  const cleanTree = deleteElementFromTree(elements, sourceId);
  return insertElementInTree(cleanTree, targetId, elementToMove, position);
}
