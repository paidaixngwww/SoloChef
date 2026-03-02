import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Check, ShoppingCart } from 'lucide-react';
import { motion } from 'motion/react';
import { recipeStorage } from '../utils/recipeStorage';
import { Recipe } from '../types/recipe';
import { useRecipeImage } from '../hooks/useRecipeImage';
import { getTagStyle } from '../utils/recipeTagGenerator';
import { estimateNutrition, generateNutritionTips, NutritionData } from '../utils/nutritionEstimator';

export function RecipeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const imageSrc = useRecipeImage(recipe?.imageUrl || '', recipe?.id || '');

  useEffect(() => {
    if (id) {
      const recipes = recipeStorage.getAll();
      const found = recipes.find(r => r.id === id);
      setRecipe(found || null);
    }
  }, [id]);

  const handleToggleSelect = () => {
    if (recipe) {
      recipeStorage.toggleSelected(recipe.id);
      const updated = recipeStorage.getAll().find(r => r.id === recipe.id);
      if (updated) {
        setRecipe(updated);
      }
    }
  };

  if (!recipe) {
    return (
      <div className="min-h-screen px-6 py-6" style={{ backgroundColor: '#F9F7F2' }}>
        <div className="max-w-2xl mx-auto text-center py-20">
          <p style={{ color: '#81B29A' }}>菜谱不存在</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-2 rounded-xl text-white"
            style={{ backgroundColor: '#E07A5F' }}
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const freshIngredients = recipe.ingredients.filter(i => i.category === 'fresh');
  const pantryIngredients = recipe.ingredients.filter(i => i.category === 'pantry');
  const nutrition = estimateNutrition(recipe.ingredients, recipe.name);
  // 使用营养素反推的热量（蛋白质×4+脂肪×9+碳水×4+纤维×2），确保与营养素数据自洽
  const consistentCalories = nutrition.calories;
  const nutritionTips = generateNutritionTips(recipe.ingredients, nutrition, recipe.name, consistentCalories);

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#F9F7F2' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-6 py-4" style={{ backgroundColor: '#F9F7F2' }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-full transition-all hover:scale-105 active:scale-95"
            style={{ backgroundColor: 'white' }}
          >
            <ArrowLeft className="w-6 h-6" style={{ color: '#3D405B' }} />
          </button>
          <button
            onClick={handleToggleSelect}
            className="flex items-center gap-2 px-4 py-2 rounded-full transition-all hover:scale-105 active:scale-95 shadow-md"
            style={{
              backgroundColor: recipe.selected ? '#81B29A' : '#E07A5F',
            }}
          >
            {recipe.selected ? (
              <>
                <Check className="w-5 h-5 text-white" />
                <span className="text-white text-sm">已选择</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5 text-white" />
                <span className="text-white text-sm">加入购物车</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative h-64 rounded-2xl overflow-hidden mb-6 shadow-lg"
        >
          <img
            src={imageSrc}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </motion.div>

        {/* Recipe Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 mb-6 shadow-sm"
        >
          <h1 className="text-3xl mb-3" style={{ color: '#3D405B' }}>
            {recipe.name}
          </h1>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: '#E07A5F' }}
              />
              <span className="text-sm" style={{ color: '#81B29A' }}>
                {recipe.servings} 人份
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: '#81B29A' }}
              />
              <span className="text-sm" style={{ color: '#81B29A' }}>
                {recipe.ingredients.length} 种食材
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: '#F4A261' }}
              />
              <span className="text-sm" style={{ color: '#F4A261' }}>
                {consistentCalories} kcal
              </span>
            </div>
          </div>

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {recipe.tags.map((tag, idx) => {
                const style = getTagStyle(tag);
                return (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg text-sm font-medium"
                    style={{
                      backgroundColor: style.backgroundColor,
                      color: style.color,
                    }}
                  >
                    {tag}
                  </span>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Ingredients List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {/* Fresh Ingredients */}
          {freshIngredients.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: '#81B29A20' }}
                >
                  <span style={{ color: '#81B29A' }}>🥬</span>
                </div>
                <h2 className="text-lg" style={{ color: '#3D405B' }}>
                  生鲜食材
                </h2>
              </div>
              <div className="space-y-3">
                {freshIngredients.map((ingredient, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.05 }}
                    className="flex items-center justify-between py-2 border-b last:border-b-0"
                    style={{ borderColor: '#F9F7F2' }}
                  >
                    <span style={{ color: '#3D405B' }}>
                      {ingredient.name}
                    </span>
                    <span
                      className="px-3 py-1 rounded-lg text-sm"
                      style={{
                        backgroundColor: '#81B29A10',
                        color: '#81B29A',
                      }}
                    >
                      {ingredient.amount}{ingredient.unit}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Pantry Ingredients */}
          {pantryIngredients.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: '#F4A26120' }}
                >
                  <span style={{ color: '#F4A261' }}>🧂</span>
                </div>
                <h2 className="text-lg" style={{ color: '#3D405B' }}>
                  调味料
                </h2>
              </div>
              <div className="space-y-3">
                {pantryIngredients.map((ingredient, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + idx * 0.05 }}
                    className="flex items-center justify-between py-2 border-b last:border-b-0"
                    style={{ borderColor: '#F9F7F2' }}
                  >
                    <span style={{ color: '#3D405B' }}>
                      {ingredient.name}
                    </span>
                    <span
                      className="px-3 py-1 rounded-lg text-sm"
                      style={{
                        backgroundColor: '#F4A26110',
                        color: '#F4A261',
                      }}
                    >
                      {ingredient.amount}{ingredient.unit}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Nutrition Breakdown */}
        <NutritionBreakdown nutrition={nutrition} delay={0.45} />

        {/* 营养特点与建议 */}
        {nutritionTips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl p-6 mt-6 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: '#F4A26120' }}
              >
                <span style={{ color: '#F4A261' }}>💡</span>
              </div>
              <h2 className="text-lg" style={{ color: '#3D405B' }}>
                营养特点与建议
              </h2>
            </div>
            <div className="space-y-4">
              {nutritionTips.map((tip, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.55 + idx * 0.08 }}
                  className="flex gap-3"
                >
                  <span className="text-lg flex-shrink-0 mt-0.5">{tip.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-0.5" style={{ color: '#3D405B' }}>
                      {tip.title}
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: '#81B29A' }}>
                      {tip.content}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ---------- 环形图 SVG 组件 ---------- */

function DonutChart({ segments, size = 120 }: {
  segments: { value: number; color: string; label: string }[];
  size?: number;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 8;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;

  let accumulated = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* 底色环 */}
      <circle
        cx={cx} cy={cy} r={radius}
        fill="none" stroke="#F0EDE6" strokeWidth={strokeWidth}
      />
      {segments.map((seg, i) => {
        const ratio = seg.value / total;
        const dashLen = circumference * ratio;
        const dashGap = circumference - dashLen;
        const offset = circumference * (1 - accumulated) + circumference * 0.25;
        accumulated += ratio;

        return (
          <circle
            key={i}
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dashLen} ${dashGap}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.6s ease, stroke-dashoffset 0.6s ease' }}
          />
        );
      })}
    </svg>
  );
}

/* ---------- 营养素拆分栏目 ---------- */

function NutritionBreakdown({ nutrition, delay }: { nutrition: NutritionData; delay: number }) {
  const items = [
    { label: '蛋白质', value: nutrition.protein, unit: 'g', color: '#E07A5F', calPerGram: 4 },
    { label: '脂肪', value: nutrition.fat, unit: 'g', color: '#F4A261', calPerGram: 9 },
    { label: '碳水', value: nutrition.carbs, unit: 'g', color: '#81B29A', calPerGram: 4 },
    { label: '膳食纤维', value: nutrition.fiber, unit: 'g', color: '#3D405B', calPerGram: 2 },
  ];

  const totalCal = items.reduce((s, it) => s + it.value * it.calPerGram, 0);
  const segments = items
    .filter(it => it.value > 0)
    .map(it => ({
      value: it.value * it.calPerGram,
      color: it.color,
      label: it.label,
    }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl p-6 mt-4 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: '#E07A5F20' }}
        >
          <span style={{ color: '#E07A5F' }}>📊</span>
        </div>
        <h2 className="text-lg" style={{ color: '#3D405B' }}>
          营养素拆分
        </h2>
      </div>

      <div className="flex items-center gap-6">
        {/* 环形图 */}
        <div className="relative flex-shrink-0">
          <DonutChart segments={segments} size={120} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold" style={{ color: '#3D405B' }}>
              {nutrition.calories}
            </span>
            <span className="text-xs" style={{ color: '#81B29A' }}>kcal</span>
          </div>
        </div>

        {/* 详细数据 */}
        <div className="flex-1 space-y-3">
          {items.map((item) => {
            const calContribution = item.value * item.calPerGram;
            const pct = totalCal > 0 ? Math.round((calContribution / totalCal) * 100) : 0;
            return (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm" style={{ color: '#3D405B' }}>
                      {item.label}
                    </span>
                  </div>
                  <span className="text-sm font-medium" style={{ color: item.color }}>
                    {item.value}{item.unit}
                    <span className="text-xs opacity-60 ml-1">{pct}%</span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#F0EDE6' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: item.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: delay + 0.2, duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
