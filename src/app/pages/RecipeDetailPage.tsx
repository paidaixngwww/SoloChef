import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Check, ShoppingCart } from 'lucide-react';
import { motion } from 'motion/react';
import { recipeStorage } from '../utils/recipeStorage';
import { Recipe } from '../types/recipe';
import { useRecipeImage } from '../hooks/useRecipeImage';

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
            {recipe.calories && (
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: '#F4A261' }}
                />
                <span className="text-sm" style={{ color: '#F4A261' }}>
                  {recipe.calories} kcal
                </span>
              </div>
            )}
          </div>

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {recipe.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-lg text-sm"
                  style={{
                    backgroundColor: '#F9F7F2',
                    color: '#81B29A',
                  }}
                >
                  {tag}
                </span>
              ))}
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

        {/* AI Tip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-4 mt-6 shadow-sm"
        >
          <div className="flex gap-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1">
              <p className="text-sm mb-1" style={{ color: '#3D405B' }}>
                <strong>AI 提示</strong>
              </p>
              <p className="text-sm" style={{ color: '#81B29A' }}>
                此菜谱已自动转换为 {recipe.servings} 人份。如需调整份量，可在购物清单页面查看合并后的总用量。
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
