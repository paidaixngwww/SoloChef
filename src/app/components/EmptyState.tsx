import { Link } from 'react-router';
import { ChefHat, Plus, Info } from 'lucide-react';
import { motion } from 'motion/react';

export function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto text-center py-16 px-6"
    >
      {/* Icon */}
      <div 
        className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
        style={{ backgroundColor: '#E07A5F20' }}
      >
        <ChefHat className="w-12 h-12" style={{ color: '#E07A5F' }} />
      </div>

      {/* Text */}
      <h2 className="text-2xl mb-3" style={{ color: '#3D405B' }}>
        欢迎来到 SoloChef
      </h2>
      <p className="mb-8" style={{ color: '#81B29A' }}>
        一人食智能采购清单<br/>
        让独居生活更从容
      </p>

      {/* Actions */}
      <div className="space-y-3">
        <Link
          to="/add"
          className="flex items-center justify-center gap-2 w-full py-4 rounded-xl text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md"
          style={{ backgroundColor: '#E07A5F' }}
        >
          <Plus className="w-5 h-5" />
          添加第一个菜谱
        </Link>
        
        <Link
          to="/about"
          className="flex items-center justify-center gap-2 w-full py-4 rounded-xl border-2 transition-all hover:bg-white active:scale-[0.98]"
          style={{ borderColor: '#81B29A', color: '#81B29A' }}
        >
          <Info className="w-5 h-5" />
          了解功能特性
        </Link>
      </div>

      {/* Features Preview */}
      <div className="mt-12 space-y-3 text-left">
        <FeaturePreview
          emoji="📱"
          text="多模态输入：链接/拍照/文字"
        />
        <FeaturePreview
          emoji="🎯"
          text="AI自动转换为1人份"
        />
        <FeaturePreview
          emoji="🛒"
          text="智能合并采购清单"
        />
      </div>
    </motion.div>
  );
}

function FeaturePreview({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-xl p-3">
      <span className="text-2xl">{emoji}</span>
      <p className="text-sm" style={{ color: '#3D405B' }}>{text}</p>
    </div>
  );
}
