import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Plus, ShoppingCart, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RecipeCard } from '../components/RecipeCard';
import { EmptyState } from '../components/EmptyState';
import { recipeStorage } from '../utils/recipeStorage';
import { removeImage } from '../utils/imageStorage';
import { estimateCalories, isCalorieTrustworthy } from '../utils/calorieEstimator';
import { generateRecipeTags } from '../utils/recipeTagGenerator';
import { mockRecipes } from '../utils/mockData';
import { Recipe } from '../types/recipe';

export function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const selectedCount = recipes.filter(r => r.selected).length;
  const totalIngredientTypes = new Set(
    recipes
      .filter(r => r.selected)
      .flatMap(r => r.ingredients.map(i => i.name))
  ).size;

  useEffect(() => {
    // Initialize with mock data if empty
    let stored = recipeStorage.getAll();
    if (stored.length === 0) {
      recipeStorage.save(mockRecipes);
      stored = mockRecipes;
    }

    // 卡路里算法版本：升级时强制重算所有菜谱的热量
    const CAL_VERSION = 'v2_cooking_method';
    const calVer = localStorage.getItem('solochef_cal_version');
    const forceRecalc = calVer !== CAL_VERSION;

    // 标签方案版本：升级时为所有菜谱重新生成智能标签
    const TAG_VERSION = 'v2_smart_tags';
    const tagVer = localStorage.getItem('solochef_tag_version');
    const forceRegenTags = tagVer !== TAG_VERSION;

    let updated = false;
    for (const r of stored) {
      if (r.ingredients.length > 0 && (forceRecalc || !r.calories || !isCalorieTrustworthy(r.calories))) {
        const cal = estimateCalories(r.ingredients, r.name);
        if (cal > 0) {
          r.calories = cal;
          recipeStorage.update(r.id, { calories: cal });
          updated = true;
        }
      }
      // 标签迁移：重新生成智能标签
      if (forceRegenTags) {
        const newTags = generateRecipeTags(r.name, r.ingredients, r.calories);
        r.tags = newTags;
        recipeStorage.update(r.id, { tags: newTags });
        updated = true;
      }
      // 修复已失效的 blob URL → 替换为占位图
      if (r.imageUrl && r.imageUrl.startsWith('blob:')) {
        r.imageUrl = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800';
        recipeStorage.update(r.id, { imageUrl: r.imageUrl });
        updated = true;
      }
    }
    if (forceRecalc) localStorage.setItem('solochef_cal_version', CAL_VERSION);
    if (forceRegenTags) localStorage.setItem('solochef_tag_version', TAG_VERSION);
    if (updated) stored = recipeStorage.getAll();
    setRecipes(stored);
  }, []);

  const handleToggleSelect = (id: string) => {
    recipeStorage.toggleSelected(id);
    setRecipes(recipeStorage.getAll());
  };

  const handleDelete = (id: string) => {
    removeImage(id).catch(() => {});
    recipeStorage.remove(id);
    setRecipes(recipeStorage.getAll());
  };

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <header className="sticky top-0 z-10 px-6 py-6" style={{ backgroundColor: '#F9F7F2' }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl tracking-tight" style={{ color: '#3D405B' }}>
                SoloChef
              </h1>
              <p className="text-sm mt-1" style={{ color: '#81B29A' }}>
                一人食，不将就
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/about"
                className="inline-flex w-12 h-12 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95 flex-shrink-0"
                style={{ backgroundColor: '#81B29A' }}
              >
                <HelpCircle className="w-6 h-6 text-white" />
              </Link>
              <motion.div
                className="flex-shrink-0"
                animate={recipes.length === 0 ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                transition={recipes.length === 0 ? { repeat: Infinity, duration: 2 } : { duration: 0.2 }}
              >
                <Link
                  to="/add"
                  className="inline-flex w-12 h-12 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95 shadow-md"
                  style={{ backgroundColor: '#E07A5F' }}
                >
                  <Plus className="w-6 h-6 text-white" />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </header>

      {/* Recipe Grid */}
      <div className="max-w-4xl mx-auto px-6">
        {recipes.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Stats Bar */}
            <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
              <div className="flex items-center justify-around text-center">
                <div>
                  <div className="text-2xl mb-1" style={{ color: '#E07A5F' }}>
                    {recipes.length}
                  </div>
                  <div className="text-xs" style={{ color: '#81B29A' }}>
                    总菜谱
                  </div>
                </div>
                <div className="w-px h-8" style={{ backgroundColor: '#F9F7F2' }} />
                <div>
                  <div className="text-2xl mb-1" style={{ color: '#81B29A' }}>
                    {selectedCount}
                  </div>
                  <div className="text-xs" style={{ color: '#81B29A' }}>
                    已选择
                  </div>
                </div>
                <div className="w-px h-8" style={{ backgroundColor: '#F9F7F2' }} />
                <div>
                  <div className="text-2xl mb-1" style={{ color: '#F4A261' }}>
                    {totalIngredientTypes}
                  </div>
                  <div className="text-xs" style={{ color: '#81B29A' }}>
                    种食材
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recipes.map(recipe => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onToggleSelect={handleToggleSelect}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Floating Bottom Bar */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 px-6 py-4"
            style={{ backgroundColor: '#F9F7F2' }}
          >
            <div className="max-w-4xl mx-auto">
              <Link
                to="/shopping-list"
                className="flex items-center justify-between px-6 py-4 rounded-2xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: '#E07A5F' }}
              >
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-6 h-6 text-white" />
                  <div className="text-white">
                    <div className="font-medium">已选 {selectedCount} 道菜</div>
                    <div className="text-sm opacity-90">
                      预计食材种类：{totalIngredientTypes} 种
                    </div>
                  </div>
                </div>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-white text-2xl"
                >
                  →
                </motion.div>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}