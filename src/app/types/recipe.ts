export interface Ingredient {
  name: string;
  amount: string;
  unit: string;
  category: 'fresh' | 'pantry';
  originalText: string;
}

export interface Recipe {
  id: string;
  name: string;
  imageUrl: string;
  ingredients: Ingredient[];
  servings: number;
  calories?: number;
  source?: string;
  tags?: string[];
  selected?: boolean;
}

export interface MergedIngredient extends Ingredient {
  recipes: string[]; // recipe names that use this ingredient
}
