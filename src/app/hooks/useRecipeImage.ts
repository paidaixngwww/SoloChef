import { useState, useEffect } from 'react';
import { getImage } from '../utils/imageStorage';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800';

/**
 * 根据 recipe.imageUrl 解析出实际可用的图片 src
 * - indexeddb://xxx  → 从 IndexedDB 加载
 * - blob:xxx        → 已失效，使用占位图
 * - https://xxx     → 直接使用
 */
export function useRecipeImage(imageUrl: string, recipeId: string): string {
  const [src, setSrc] = useState<string>(() => {
    if (imageUrl.startsWith('indexeddb://')) return '';
    if (imageUrl.startsWith('blob:')) return PLACEHOLDER;
    return imageUrl || PLACEHOLDER;
  });

  useEffect(() => {
    if (!imageUrl.startsWith('indexeddb://')) {
      // blob URL 已失效，使用占位图
      if (imageUrl.startsWith('blob:')) {
        setSrc(PLACEHOLDER);
      } else {
        setSrc(imageUrl || PLACEHOLDER);
      }
      return;
    }

    let cancelled = false;
    const id = imageUrl.replace('indexeddb://', '');
    getImage(id).then(dataUrl => {
      if (!cancelled) {
        setSrc(dataUrl || PLACEHOLDER);
      }
    }).catch(() => {
      if (!cancelled) setSrc(PLACEHOLDER);
    });

    return () => { cancelled = true; };
  }, [imageUrl, recipeId]);

  return src;
}
