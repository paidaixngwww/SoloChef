import { Recipe } from '../types/recipe';

const STORAGE_KEY = 'solochef_recipes';

export const recipeStorage = {
  getAll: (): Recipe[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  save: (recipes: Recipe[]): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
  },

  add: (recipe: Recipe): void => {
    const recipes = recipeStorage.getAll();
    recipes.push(recipe);
    recipeStorage.save(recipes);
  },

  update: (id: string, updates: Partial<Recipe>): void => {
    const recipes = recipeStorage.getAll();
    const index = recipes.findIndex(r => r.id === id);
    if (index !== -1) {
      recipes[index] = { ...recipes[index], ...updates };
      recipeStorage.save(recipes);
    }
  },

  remove: (id: string): void => {
    const recipes = recipeStorage.getAll();
    recipeStorage.save(recipes.filter(r => r.id !== id));
  },

  toggleSelected: (id: string): void => {
    const recipes = recipeStorage.getAll();
    const recipe = recipes.find(r => r.id === id);
    if (recipe) {
      recipe.selected = !recipe.selected;
      recipeStorage.save(recipes);
    }
  },
};
