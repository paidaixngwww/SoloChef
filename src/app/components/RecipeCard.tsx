import { motion } from 'motion/react';
import { Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Recipe } from '../types/recipe';
import { useRecipeImage } from '../hooks/useRecipeImage';
import { getTagStyle } from '../utils/recipeTagGenerator';

interface RecipeCardProps {
  recipe: Recipe;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function RecipeCard({ recipe, onToggleSelect, onDelete }: RecipeCardProps) {
  const navigate = useNavigate();
  const freshCount = recipe.ingredients.filter(i => i.category === 'fresh').length;
  const imageSrc = useRecipeImage(recipe.imageUrl, recipe.id);

  const handleCardClick = () => {
    navigate(`/recipe/${recipe.id}`);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={handleCardClick}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow group relative cursor-pointer"
    >
      {/* Delete Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(recipe.id);
        }}
        className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:scale-110 active:scale-95"
      >
        <Trash2 className="w-4 h-4" style={{ color: '#E07A5F' }} />
      </button>

      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageSrc}
          alt={recipe.name}
          className="w-full h-full object-cover"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg mb-1" style={{ color: '#3D405B' }}>
              {recipe.name}
            </h3>
            <p className="text-sm" style={{ color: '#81B29A' }}>
              {freshCount} 种食材 · {recipe.servings} 人份
              {recipe.calories && (
                <span style={{ color: '#F4A261' }}> · {recipe.calories} kcal</span>
              )}
            </p>
          </div>
          {/* Checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(recipe.id);
            }}
            className="flex-shrink-0 ml-3 w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center"
            style={{
              borderColor: recipe.selected ? '#81B29A' : '#E07A5F',
              backgroundColor: recipe.selected ? '#81B29A' : 'transparent',
            }}
          >
            {recipe.selected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-white"
              >
                ✓
              </motion.div>
            )}
          </button>
        </div>

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {recipe.tags.map((tag, idx) => {
              const style = getTagStyle(tag);
              return (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md text-xs font-medium"
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

        {/* Key Ingredients Preview */}
        <div className="mt-3 pt-3 border-t" style={{ borderColor: '#F9F7F2' }}>
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1 text-xs flex-1" style={{ color: '#81B29A' }}>
              {recipe.ingredients.slice(0, 4).map((ing, idx) => (
                <span key={idx}>
                  {ing.name}
                  {idx < Math.min(3, recipe.ingredients.length - 1) && ' ·'}
                </span>
              ))}
              {recipe.ingredients.length > 4 && (
                <span>· +{recipe.ingredients.length - 4}</span>
              )}
            </div>
            <div 
              className="text-xs opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0"
              style={{ color: '#E07A5F' }}
            >
              查看详情 →
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}