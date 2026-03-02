import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Copy, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MergeAnimation } from '../components/MergeAnimation';
import { recipeStorage } from '../utils/recipeStorage';
import { mergeIngredients } from '../utils/ingredientMerger';
import { MergedIngredient } from '../types/recipe';
import { toast } from 'sonner';

export function ShoppingListPage() {
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState<MergedIngredient[]>([]);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [showPantry, setShowPantry] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<MergedIngredient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate AI processing with animation
    setTimeout(() => {
      const recipes = recipeStorage.getAll();
      const merged = mergeIngredients(recipes);
      setIngredients(merged);
      setIsLoading(false);
    }, 2000);
  }, []);

  const freshIngredients = ingredients.filter(i => i.category === 'fresh');
  const pantryIngredients = ingredients.filter(i => i.category === 'pantry');

  const handleToggleCheck = (name: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(name)) {
      newChecked.delete(name);
    } else {
      newChecked.add(name);
    }
    setCheckedItems(newChecked);
  };

  const handleCopyToClipboard = () => {
    const text = ingredients
      .map(i => `${i.name} ${i.amount}${i.unit}`)
      .join('\n');
    
    navigator.clipboard.writeText(text).then(() => {
      toast.success('采购清单已复制');
    });
  };

  const handleShowSource = (ingredient: MergedIngredient) => {
    setSelectedIngredient(ingredient);
  };

  if (isLoading) {
    return <MergeAnimation />;
  }

  if (ingredients.length === 0) {
    return (
      <div className="min-h-screen px-6 py-6" style={{ backgroundColor: '#F9F7F2' }}>
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-full transition-colors hover:bg-white/50 mb-8"
          >
            <ArrowLeft className="w-6 h-6" style={{ color: '#3D405B' }} />
          </button>
          <div className="text-center py-20">
            <p style={{ color: '#81B29A' }}>还没有选择菜谱</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-6" style={{ backgroundColor: '#F9F7F2' }}>
      <div className="max-w-2xl mx-auto pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-full transition-colors hover:bg-white/50"
            >
              <ArrowLeft className="w-6 h-6" style={{ color: '#3D405B' }} />
            </button>
            <div>
              <h2 className="text-2xl" style={{ color: '#3D405B' }}>采购清单</h2>
              <p className="text-sm mt-1" style={{ color: '#81B29A' }}>
                {checkedItems.size}/{ingredients.length} 已购买
              </p>
            </div>
          </div>
          <button
            onClick={handleCopyToClipboard}
            className="p-3 rounded-full transition-all hover:scale-105 active:scale-95 shadow-md"
            style={{ backgroundColor: '#E07A5F' }}
          >
            <Copy className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Fresh Ingredients */}
        <div className="mb-6">
          <h3 className="text-sm mb-3 px-1" style={{ color: '#81B29A' }}>
            生鲜食材 (需要购买)
          </h3>
          <div className="space-y-2">
            {freshIngredients.map(ingredient => (
              <IngredientItem
                key={ingredient.name}
                ingredient={ingredient}
                checked={checkedItems.has(ingredient.name)}
                onToggle={() => handleToggleCheck(ingredient.name)}
                onShowSource={() => handleShowSource(ingredient)}
              />
            ))}
          </div>
        </div>

        {/* Pantry Ingredients (Collapsible) */}
        <div>
          <button
            onClick={() => setShowPantry(!showPantry)}
            className="flex items-center justify-between w-full text-sm mb-3 px-1 transition-colors hover:opacity-70"
            style={{ color: '#3D405B' }}
          >
            <span>粮油调味 (检查库存)</span>
            <div className="flex items-center gap-1">
              <span className="text-xs" style={{ color: '#81B29A' }}>
                {pantryIngredients.length} 项
              </span>
              {showPantry ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </button>
          <AnimatePresence>
            {showPantry && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-2 overflow-hidden"
              >
                {pantryIngredients.map(ingredient => (
                  <IngredientItem
                    key={ingredient.name}
                    ingredient={ingredient}
                    checked={checkedItems.has(ingredient.name)}
                    onToggle={() => handleToggleCheck(ingredient.name)}
                    onShowSource={() => handleShowSource(ingredient)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Source Modal */}
      <AnimatePresence>
        {selectedIngredient && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setSelectedIngredient(null)}
            />
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 z-50 shadow-2xl"
            >
              <div className="max-w-2xl mx-auto">
                <div className="flex items-start gap-3 mb-4">
                  <Info className="w-5 h-5 flex-shrink-0 mt-1" style={{ color: '#81B29A' }} />
                  <div className="flex-1">
                    <h3 className="mb-2" style={{ color: '#3D405B' }}>
                      {selectedIngredient.name} 用于：
                    </h3>
                    <ul className="space-y-1 text-sm" style={{ color: '#81B29A' }}>
                      {selectedIngredient.recipes.map((recipe, idx) => (
                        <li key={idx}>• {recipe}</li>
                      ))}
                    </ul>
                    <p className="mt-3 text-sm" style={{ color: '#3D405B' }}>
                      记得买够份量，别买少了
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedIngredient(null)}
                  className="w-full py-3 rounded-xl text-white transition-all hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: '#E07A5F' }}
                >
                  知道了
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

interface IngredientItemProps {
  ingredient: MergedIngredient;
  checked: boolean;
  onToggle: () => void;
  onShowSource: () => void;
}

function IngredientItem({ ingredient, checked, onToggle, onShowSource }: IngredientItemProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative"
    >
      <div
        className={`bg-white rounded-xl p-4 shadow-sm transition-all ${
          checked ? 'opacity-50' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onToggle}
            className="flex-shrink-0 w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center"
            style={{
              borderColor: checked ? '#81B29A' : '#E07A5F',
              backgroundColor: checked ? '#81B29A' : 'transparent',
            }}
          >
            {checked && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-white text-sm"
              >
                ✓
              </motion.div>
            )}
          </button>
          <div className="flex-1">
            <div
              className={`flex items-baseline gap-2 ${checked ? 'line-through' : ''}`}
              style={{ color: '#3D405B' }}
            >
              <span>{ingredient.name}</span>
              <span className="text-sm" style={{ color: '#81B29A' }}>
                {ingredient.amount}{ingredient.unit}
              </span>
            </div>
            {ingredient.recipes.length > 1 && (
              <div className="text-xs mt-1" style={{ color: '#81B29A' }}>
                {ingredient.recipes.length} 道菜用到
              </div>
            )}
          </div>
          <button
            onClick={onShowSource}
            className="flex-shrink-0 p-2 rounded-full transition-colors hover:bg-gray-100"
          >
            <Info className="w-4 h-4" style={{ color: '#81B29A' }} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}