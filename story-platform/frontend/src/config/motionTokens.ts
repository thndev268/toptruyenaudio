export const motionTokens = {
  duration: {
    instant: 0.1,  // 100ms
    fast: 0.15,   // 150ms
    normal: 0.22, // 220ms
    slow: 0.32,   // 320ms
  },
  easing: {
    standard: [0.22, 1, 0.36, 1] as const,
    entrance: [0.16, 1, 0.3, 1] as const,
    exit: [0.4, 0, 1, 1] as const,
  },
  pageTransition: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
  },
  modalAnimation: {
    overlay: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.18 },
    },
    content: {
      initial: { opacity: 0, scale: 0.97, y: 8 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.97, y: 4 },
      transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const },
    },
  },
  drawerAnimation: {
    overlay: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.2 },
    },
    contentRight: {
      initial: { x: '100%' },
      animate: { x: 0 },
      exit: { x: '100%' },
      transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const },
    },
    contentBottom: {
      initial: { y: '100%' },
      animate: { y: 0 },
      exit: { y: '100%' },
      transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const },
    },
  },
  dropdownAnimation: {
    initial: { opacity: 0, scale: 0.96, y: -4 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.96, y: -4 },
    transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] as const },
  },
  cardHover: {
    y: -3,
    transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] as const },
  },
  tapFeedback: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};
