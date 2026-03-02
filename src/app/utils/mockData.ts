import { Recipe } from '../types/recipe';
import { generateRecipeTags } from './recipeTagGenerator';

// 先定义基础数据，再用智能标签生成器生成标签
const baseRecipes: Omit<Recipe, 'tags'>[] = [
  {
    id: '1',
    name: '番茄炒蛋',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    servings: 1,
    calories: 245,
    selected: false,
    ingredients: [
      { name: '番茄', amount: '2', unit: '个', category: 'fresh', originalText: '番茄 2个' },
      { name: '鸡蛋', amount: '3', unit: '个', category: 'fresh', originalText: '鸡蛋 3个' },
      { name: '葱花', amount: '5', unit: 'g', category: 'fresh', originalText: '葱花 5g' },
      { name: '盐', amount: '3', unit: 'g', category: 'pantry', originalText: '盐 3g' },
      { name: '糖', amount: '5', unit: 'g', category: 'pantry', originalText: '糖 5g' },
      { name: '食用油', amount: '15', unit: 'ml', category: 'pantry', originalText: '食用油 15ml' },
    ],
  },
  {
    id: '2',
    name: '西芹百合',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    servings: 1,
    calories: 120,
    selected: false,
    ingredients: [
      { name: '西芹', amount: '150', unit: 'g', category: 'fresh', originalText: '西芹 150g' },
      { name: '百合', amount: '50', unit: 'g', category: 'fresh', originalText: '百合 50g' },
      { name: '胡萝卜', amount: '30', unit: 'g', category: 'fresh', originalText: '胡萝卜 30g' },
      { name: '蒜片', amount: '3', unit: '片', category: 'fresh', originalText: '蒜片 3片' },
      { name: '盐', amount: '2', unit: 'g', category: 'pantry', originalText: '盐 2g' },
      { name: '食用油', amount: '10', unit: 'ml', category: 'pantry', originalText: '食用油 10ml' },
    ],
  },
  {
    id: '3',
    name: '芹菜炒肉',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
    servings: 1,
    calories: 320,
    selected: false,
    ingredients: [
      { name: '芹菜', amount: '100', unit: 'g', category: 'fresh', originalText: '芹菜 100g' },
      { name: '猪肉', amount: '150', unit: 'g', category: 'fresh', originalText: '猪肉 150g' },
      { name: '姜丝', amount: '5', unit: 'g', category: 'fresh', originalText: '姜丝 5g' },
      { name: '蒜末', amount: '5', unit: 'g', category: 'fresh', originalText: '蒜末 5g' },
      { name: '生抽', amount: '10', unit: 'ml', category: 'pantry', originalText: '生抽 10ml' },
      { name: '料酒', amount: '5', unit: 'ml', category: 'pantry', originalText: '料酒 5ml' },
      { name: '盐', amount: '2', unit: 'g', category: 'pantry', originalText: '盐 2g' },
      { name: '食用油', amount: '15', unit: 'ml', category: 'pantry', originalText: '食用油 15ml' },
    ],
  },
  {
    id: '4',
    name: '香菇青菜',
    imageUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800',
    servings: 1,
    calories: 95,
    selected: false,
    ingredients: [
      { name: '小白菜', amount: '200', unit: 'g', category: 'fresh', originalText: '小白菜 200g' },
      { name: '香菇', amount: '3', unit: '朵', category: 'fresh', originalText: '香菇 3朵' },
      { name: '蒜末', amount: '5', unit: 'g', category: 'fresh', originalText: '蒜末 5g' },
      { name: '生抽', amount: '5', unit: 'ml', category: 'pantry', originalText: '生抽 5ml' },
      { name: '蚝油', amount: '5', unit: 'ml', category: 'pantry', originalText: '蚝油 5ml' },
      { name: '食用油', amount: '10', unit: 'ml', category: 'pantry', originalText: '食用油 10ml' },
    ],
  },
  {
    id: '5',
    name: '麻婆豆腐',
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    servings: 1,
    calories: 285,
    selected: false,
    ingredients: [
      { name: '嫩豆腐', amount: '1', unit: '盒', category: 'fresh', originalText: '嫩豆腐 1盒' },
      { name: '猪肉末', amount: '80', unit: 'g', category: 'fresh', originalText: '猪肉末 80g' },
      { name: '葱姜蒜', amount: '10', unit: 'g', category: 'fresh', originalText: '葱姜蒜 10g' },
      { name: '豆瓣酱', amount: '15', unit: 'g', category: 'pantry', originalText: '豆瓣酱 15g' },
      { name: '生抽', amount: '10', unit: 'ml', category: 'pantry', originalText: '生抽 10ml' },
      { name: '花椒粉', amount: '2', unit: 'g', category: 'pantry', originalText: '花椒粉 2g' },
      { name: '食用油', amount: '15', unit: 'ml', category: 'pantry', originalText: '食用油 15ml' },
      { name: '淀粉', amount: '5', unit: 'g', category: 'pantry', originalText: '淀粉 5g' },
    ],
  },
  {
    id: '6',
    name: '蒜蓉西兰花',
    imageUrl: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800',
    servings: 1,
    calories: 110,
    selected: false,
    ingredients: [
      { name: '西兰花', amount: '200', unit: 'g', category: 'fresh', originalText: '西兰花 200g' },
      { name: '大蒜', amount: '4', unit: '瓣', category: 'fresh', originalText: '大蒜 4瓣' },
      { name: '盐', amount: '2', unit: 'g', category: 'pantry', originalText: '盐 2g' },
      { name: '蚝油', amount: '5', unit: 'ml', category: 'pantry', originalText: '蚝油 5ml' },
      { name: '食用油', amount: '10', unit: 'ml', category: 'pantry', originalText: '食用油 10ml' },
    ],
  },
];

// 为每道菜谱自动生成智能标签
export const mockRecipes: Recipe[] = baseRecipes.map(r => ({
  ...r,
  tags: generateRecipeTags(r.name, r.ingredients, r.calories),
}));
