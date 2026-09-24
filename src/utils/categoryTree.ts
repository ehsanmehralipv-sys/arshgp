import { WCCategory, WCProduct } from '../types';

export interface HierarchicalCategory extends WCCategory {
  depth: number;
  displayName: string;
  pathName: string;
  childIds: number[];
  allDescendantIds: number[];
}

/**
 * Builds a hierarchical flattened list of all categories including parents and subcategories.
 * Extracts categories from both the categories array and any categories attached to products.
 */
export function buildHierarchicalCategories(
  rawCategories: WCCategory[],
  products: WCProduct[]
): HierarchicalCategory[] {
  const categoryMap = new Map<number, WCCategory>();

  // 1. Add all from rawCategories
  if (Array.isArray(rawCategories)) {
    for (const cat of rawCategories) {
      if (cat && cat.id) {
        categoryMap.set(cat.id, { ...cat });
      }
    }
  }

  // 2. Discover any additional categories from product items
  if (Array.isArray(products)) {
    for (const p of products) {
      if (Array.isArray(p.categories)) {
        for (const pCat of p.categories) {
          if (pCat && pCat.id && !categoryMap.has(pCat.id)) {
            categoryMap.set(pCat.id, {
              id: pCat.id,
              name: pCat.name,
              slug: pCat.slug,
              parent: (pCat as any).parent || 0,
              count: 0,
            });
          }
        }
      }
    }
  }

  // 3. Count products for each category in current product list
  const productCountMap = new Map<number, number>();
  if (Array.isArray(products)) {
    for (const p of products) {
      if (Array.isArray(p.categories)) {
        for (const c of p.categories) {
          if (c && c.id) {
            productCountMap.set(c.id, (productCountMap.get(c.id) || 0) + 1);
          }
        }
      }
    }
  }

  // Update counts in categoryMap
  categoryMap.forEach((cat, id) => {
    const liveCount = productCountMap.get(id);
    if (liveCount !== undefined) {
      cat.count = liveCount;
    }
  });

  // 4. Build Parent -> Children relations
  const childrenMap = new Map<number, number[]>();
  categoryMap.forEach((cat) => {
    const parentId = cat.parent && categoryMap.has(cat.parent) ? cat.parent : 0;
    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, []);
    }
    childrenMap.get(parentId)!.push(cat.id);
  });

  // Helper to compute all descendants recursively
  function getDescendants(catId: number): number[] {
    const directChildren = childrenMap.get(catId) || [];
    const all = [...directChildren];
    for (const childId of directChildren) {
      all.push(...getDescendants(childId));
    }
    return all;
  }

  const result: HierarchicalCategory[] = [];

  // Recursive tree walker
  function walk(catId: number, depth: number, parentPath: string) {
    const cat = categoryMap.get(catId);
    if (!cat) return;

    const currentPath = parentPath ? `${parentPath} > ${cat.name}` : cat.name;
    const directChildren = childrenMap.get(catId) || [];
    const allDescendants = getDescendants(catId);

    // Visual indentation for dropdown
    const prefix = depth === 0 
      ? '' 
      : depth === 1 
        ? '└─ ' 
        : `${'  '.repeat(depth - 1)}└── `;

    result.push({
      ...cat,
      depth,
      displayName: `${prefix}${cat.name}`,
      pathName: currentPath,
      childIds: directChildren,
      allDescendantIds: allDescendants,
    });

    // Walk children sorted by name
    const sortedChildren = [...directChildren].sort((a, b) => {
      const nameA = categoryMap.get(a)?.name || '';
      const nameB = categoryMap.get(b)?.name || '';
      return nameA.localeCompare(nameB, 'fa');
    });

    for (const childId of sortedChildren) {
      walk(childId, depth + 1, currentPath);
    }
  }

  // Walk all root categories (parent === 0 or parent not in map)
  const rootIds = childrenMap.get(0) || [];
  rootIds.sort((a, b) => {
    const nameA = categoryMap.get(a)?.name || '';
    const nameB = categoryMap.get(b)?.name || '';
    return nameA.localeCompare(nameB, 'fa');
  });

  for (const rootId of rootIds) {
    walk(rootId, 0, '');
  }

  // If any categories were orphaned/missed, add them at depth 0
  const processedIds = new Set(result.map((r) => r.id));
  categoryMap.forEach((cat, id) => {
    if (!processedIds.has(id)) {
      result.push({
        ...cat,
        depth: 0,
        displayName: cat.name,
        pathName: cat.name,
        childIds: [],
        allDescendantIds: [],
      });
    }
  });

  return result;
}
