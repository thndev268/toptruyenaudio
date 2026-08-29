import React from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

export const BottomLoadingIndicator: React.FC = () => {
  return (
    <div className="flex items-center justify-center py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 text-slate-400"
      >
        <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
        <span className="text-sm font-medium">Đang tải thêm truyện...</span>
      </motion.div>
    </div>
  );
};
