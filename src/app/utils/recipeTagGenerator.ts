import { Ingredient } from '../types/recipe';

/* ---------- 标签配色方案 ---------- */

export interface TagStyle {
  backgroundColor: string;
  color: string;
}

/** 标签分类及其对应颜色 */
const TAG_COLORS: Record<string, TagStyle> = {
  // 烹饪方式 — 柿子红系
  '炒菜': { backgroundColor: '#E07A5F18', color: '#E07A5F' },
  '油炸': { backgroundColor: '#E07A5F18', color: '#E07A5F' },
  '煎': { backgroundColor: '#E07A5F18', color: '#E07A5F' },
  '蒸': { backgroundColor: '#E07A5F18', color: '#E07A5F' },
  '煮': { backgroundColor: '#E07A5F18', color: '#E07A5F' },
  '汤品': { backgroundColor: '#E07A5F18', color: '#E07A5F' },
  '红烧': { backgroundColor: '#E07A5F18', color: '#E07A5F' },
  '凉拌': { backgroundColor: '#E07A5F18', color: '#E07A5F' },
  '烤': { backgroundColor: '#E07A5F18', color: '#E07A5F' },
  '卤': { backgroundColor: '#E07A5F18', color: '#E07A5F' },
  '焖': { backgroundColor: '#E07A5F18', color: '#E07A5F' },
  '沙拉': { backgroundColor: '#E07A5F18', color: '#E07A5F' },

  // 热量等级 — 琥珀黄系
  '低卡': { backgroundColor: '#81B29A18', color: '#81B29A' },
  '适中': { backgroundColor: '#F4A26118', color: '#F4A261' },
  '高热量': { backgroundColor: '#E07A5F20', color: '#E07A5F' },

  // 食材特征 — 鼠尾草绿系
  '纯素': { backgroundColor: '#81B29A18', color: '#81B29A' },
  '荤菜': { backgroundColor: '#3D405B18', color: '#3D405B' },
  '海鲜': { backgroundColor: '#4A90D918', color: '#4A90D9' },
  '蛋奶': { backgroundColor: '#F4A26118', color: '#F4A261' },

  // 风味/菜系 — 各色
  '川辣': { backgroundColor: '#E0453518', color: '#E04535' },
  '清淡': { backgroundColor: '#81B29A18', color: '#81B29A' },
  '下饭': { backgroundColor: '#F4A26118', color: '#F4A261' },
  '家常': { backgroundColor: '#3D405B15', color: '#6B6F8A' },

  // 便捷度 — 绿色系
  '快手': { backgroundColor: '#81B29A18', color: '#81B29A' },
};

/** 默认标签样式（兜底） */
const DEFAULT_TAG_STYLE: TagStyle = {
  backgroundColor: '#F9F7F2',
  color: '#81B29A',
};

export function getTagStyle(tag: string): TagStyle {
  return TAG_COLORS[tag] || DEFAULT_TAG_STYLE;
}

/* ---------- 智能标签生成 ---------- */

/** 肉类 / 海鲜关键词 */
const MEAT_KEYWORDS = [
  '猪肉', '排骨', '牛肉', '牛腩', '羊肉', '鸡肉', '鸡胸', '鸡腿', '鸡翅',
  '鸭肉', '肉末', '肉丝', '肉片', '五花肉', '培根', '火腿', '香肠', '午餐肉',
];
const SEAFOOD_KEYWORDS = ['虾', '虾仁', '大虾', '鱼', '三文鱼', '鲈鱼', '带鱼', '蟹', '蛤蜊', '贝', '海鲜', '鱿鱼', '章鱼'];
const EGG_DAIRY_KEYWORDS = ['鸡蛋', '蛋', '牛奶', '酸奶', '奶酪', '芝士'];

/**
 * 检测烹饪方式标签（从菜名推断）
 */
function detectCookingMethod(recipeName: string): string | null {
  const name = recipeName;
  if (/炸|酥|香酥|干炸|软炸|椒盐/.test(name)) return '油炸';
  if (/煎|锅贴|铁板/.test(name)) return '煎';
  if (/红烧/.test(name)) return '红烧';
  if (/卤/.test(name)) return '卤';
  if (/焖|干锅/.test(name)) return '焖';
  if (/烤|烧烤/.test(name)) return '烤';
  if (/汤|炖|煲|羹|粥/.test(name)) return '汤品';
  if (/蒸|清蒸|粉蒸/.test(name)) return '蒸';
  if (/煮|白灼|水煮/.test(name)) return '煮';
  if (/凉拌|拌/.test(name)) return '凉拌';
  if (/沙拉/.test(name)) return '沙拉';
  if (/炒|爆/.test(name)) return '炒菜';
  return null;
}

/**
 * 检测热量等级标签
 */
function detectCalorieLevel(calories?: number): string | null {
  if (!calories || calories <= 0) return null;
  if (calories < 200) return '低卡';
  if (calories <= 400) return '适中';
  return '高热量';
}

/**
 * 检测食材特征标签（纯素/荤菜/海鲜/蛋奶）
 */
function detectIngredientType(ingredients: Ingredient[]): string {
  const names = ingredients.map(i => i.name);
  const hasMeat = names.some(n => MEAT_KEYWORDS.some(k => n.includes(k)));
  const hasSeafood = names.some(n => SEAFOOD_KEYWORDS.some(k => n.includes(k)));
  const hasEggDairy = names.some(n => EGG_DAIRY_KEYWORDS.some(k => n.includes(k)));

  if (hasSeafood) return '海鲜';
  if (hasMeat) return '荤菜';
  if (hasEggDairy) return '蛋奶';
  return '纯素';
}

/**
 * 检测风味/菜系标签
 */
function detectFlavor(recipeName: string, ingredients: Ingredient[]): string | null {
  const name = recipeName;
  const ingNames = ingredients.map(i => i.name).join(',');

  // 川菜辣味
  if (/麻婆|麻辣|辣子|水煮|宫保|鱼香|回锅|担担|口水/.test(name)) return '川辣';
  if (/辣椒|豆瓣酱|花椒|辣/.test(ingNames) && /辣|麻/.test(name)) return '川辣';

  // 清淡
  if (/清蒸|白灼|百合|沙拉|蒸|凉拌/.test(name)) return '清淡';
  
  // 下饭
  if (/红烧|糖醋|干锅|酱|卤|焖|回锅/.test(name)) return '下饭';

  return '家常';
}

/**
 * 检测便捷度标签
 */
function detectConvenience(ingredients: Ingredient[]): string | null {
  const freshCount = ingredients.filter(i => i.category === 'fresh').length;
  if (freshCount <= 3) return '快手';
  return null;
}

/**
 * 为一道菜谱智能生成标签（2~4个）
 */
export function generateRecipeTags(
  recipeName: string,
  ingredients: Ingredient[],
  calories?: number,
): string[] {
  const tags: string[] = [];

  // 1. 烹饪方式（优先级最高）
  const cooking = detectCookingMethod(recipeName);
  if (cooking) tags.push(cooking);

  // 2. 食材特征
  const ingType = detectIngredientType(ingredients);
  tags.push(ingType);

  // 3. 热量等级
  const calLevel = detectCalorieLevel(calories);
  if (calLevel) tags.push(calLevel);

  // 4. 风味/菜系（如果还没有3个则补充）
  if (tags.length < 4) {
    const flavor = detectFlavor(recipeName, ingredients);
    if (flavor && !tags.includes(flavor)) tags.push(flavor);
  }

  // 5. 便捷度（如果食材少则加）
  if (tags.length < 4) {
    const convenience = detectConvenience(ingredients);
    if (convenience && !tags.includes(convenience)) tags.push(convenience);
  }

  // 最多保留 4 个标签
  return tags.slice(0, 4);
}
