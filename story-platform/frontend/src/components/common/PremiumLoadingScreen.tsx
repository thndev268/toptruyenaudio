import React from 'react';
import { motion } from 'motion/react';

export const PremiumLoadingScreen: React.FC<{ message?: string }> = ({ message = 'Đang tải...' }) => {
  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-50">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ top: '20%', left: '20%' }}
        />
        <motion.div
          className="absolute w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
          style={{ bottom: '20%', right: '20%' }}
        />
      </div>

      {/* Logo/Brand */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center mb-12"
      >
        <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-3">
          TOP TRUYỆN AUDIO
        </div>
        <div className="text-sm text-slate-400 tracking-widest uppercase">
          Premium Audio Experience
        </div>
      </motion.div>

      {/* Animated Sound Wave */}
      <motion.div
        className="relative z-10 flex items-center justify-center gap-1.5 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="w-1.5 bg-gradient-to-t from-cyan-400 to-purple-400 rounded-full"
            animate={{
              height: [20, 40, 20],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.1,
            }}
            style={{ height: 20 }}
          />
        ))}
      </motion.div>

      {/* Loading Message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="relative z-10 text-center"
      >
        <div className="text-slate-300 text-base sm:text-lg font-medium mb-2">
          {message}
        </div>
        <motion.div
          className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden mx-auto"
          initial={{ width: 0 }}
          animate={{ width: 192 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-400 to-purple-400"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{ width: '50%' }}
          />
        </motion.div>
      </motion.div>

      {/* Decorative Elements */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs text-slate-600"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
          <span>Đang kết nối với máy chủ...</span>
        </div>
      </motion.div>
    </div>
  );
};
