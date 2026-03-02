import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

export function MergeAnimation() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: '#F9F7F2' }}>
      <div className="text-center">
        {/* Animated Icon */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: '#E07A5F20' }}
        >
          <Sparkles className="w-12 h-12" style={{ color: '#E07A5F' }} />
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-2xl mb-2" style={{ color: '#3D405B' }}>
            AI 智能归并中
          </h3>
          <p style={{ color: '#81B29A' }}>
            正在合并食材、换算单位...
          </p>
        </motion.div>

        {/* Floating Ingredients */}
        <div className="mt-8 flex justify-center gap-4">
          {['番茄', '鸡蛋', '芹菜', '猪肉'].map((item, idx) => (
            <motion.div
              key={item}
              initial={{ x: 100 * (idx - 1.5), y: 0, opacity: 0.5 }}
              animate={{
                x: 0,
                y: [0, -10, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                delay: idx * 0.2,
                repeat: Infinity,
              }}
              className="px-4 py-2 rounded-lg shadow-sm"
              style={{ backgroundColor: '#81B29A20', color: '#81B29A' }}
            >
              {item}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
