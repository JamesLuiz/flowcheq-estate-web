import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
  minimumDisplayTime?: number;
}

export const SplashScreen = ({ onComplete, minimumDisplayTime = 2000 }: SplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, minimumDisplayTime);

    return () => clearTimeout(timer);
  }, [minimumDisplayTime]);

  const handleAnimationComplete = () => {
    if (!isVisible) {
      onComplete();
    }
  };

  return (
    <AnimatePresence onExitComplete={handleAnimationComplete}>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-accent overflow-hidden"
        >
          {/* Animated background circles */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 4, opacity: 0.1 }}
              transition={{ duration: 2, ease: 'easeOut' }}
              className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-white"
            />
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 3, opacity: 0.05 }}
              transition={{ duration: 2.5, ease: 'easeOut', delay: 0.3 }}
              className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-white"
            />
          </div>

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center px-4">
            {/* Logo animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 20,
                duration: 0.8,
              }}
              className="relative"
            >
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(255,255,255,0.3)',
                    '0 0 60px rgba(255,255,255,0.5)',
                    '0 0 20px rgba(255,255,255,0.3)',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
              >
                <Home className="w-12 h-12 md:w-16 md:h-16 text-white" />
              </motion.div>
            </motion.div>

            {/* Brand name animation */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
              className="mt-8 text-center"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight">
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  House
                </motion.span>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.4 }}
                  className="text-white/80"
                >
                  Me
                </motion.span>
              </h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.5 }}
                className="mt-3 text-white/70 text-sm md:text-base lg:text-lg"
              >
                Find your perfect home
              </motion.p>
            </motion.div>

            {/* Loading animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              className="mt-12 flex gap-2"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: 'easeInOut',
                  }}
                  className="w-3 h-3 rounded-full bg-white"
                />
              ))}
            </motion.div>
          </div>

          {/* Bottom decorative element */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="absolute bottom-8 text-white/50 text-xs md:text-sm"
          >
            Nigeria's Premier Real Estate Platform
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
