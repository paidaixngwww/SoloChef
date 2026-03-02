import { Recipe, MergedIngredient } from '../types/recipe';

// Synonym mapping for common ingredients
const synonyms: Record<string, string> = {
  '西红柿': '番茄',
  '土豆': '马铃薯',
  '洋葱': '圆葱',
  '老抽': '酱油',
  '生抽': '酱油',
};

const normalize = (name: string): string => {
  const cleaned = name.trim().toLowerCase();
  return synonyms[cleaned] || cleaned;
};

export const mergeIngredients = (recipes: Recipe[]): MergedIngredient[] => {
  const merged: Record<string, MergedIngredient> = {};

  recipes.forEach(recipe => {
    if (!recipe.selected) return;

    recipe.ingredients.forEach(ingredient => {
      const normalizedName = normalize(ingredient.name);
      
      if (!merged[normalizedName]) {
        merged[normalizedName] = {
          ...ingredient,
          name: ingredient.name,
          recipes: [recipe.name],
        };
      } else {
        merged[normalizedName].recipes.push(recipe.name);
        // Simple amount addition (in real app, would handle unit conversion)
        const currentAmount = parseFloat(merged[normalizedName].amount) || 0;
        const addAmount = parseFloat(ingredient.amount) || 0;
        if (currentAmount && addAmount) {
          merged[normalizedName].amount = (currentAmount + addAmount).toString();
        } else {
          merged[normalizedName].originalText += ` + ${ingredient.originalText}`;
        }
      }
    });
  });

  return Object.values(merged).sort((a, b) => {
    // Sort by category first (fresh before pantry)
    if (a.category !== b.category) {
      return a.category === 'fresh' ? -1 : 1;
    }
    return a.name.localeCompare(b.name, 'zh-CN');
  });
};
