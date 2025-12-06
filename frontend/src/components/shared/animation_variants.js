// All Shared Framer Motion variants for consistent UI animations.

export const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.35,
      ease: "easeOut"
    }
  }
};

export const slideInFromRight = {
  hidden: { opacity: 0, x: 48 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.45,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

export const dropIn = {
  hidden: { opacity: 0, y: -32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1]
    }
  },
  exit: {
    opacity: 0,
    y: 24,
    transition: {
      duration: 0.25,
      ease: "easeIn"
    }
  }
};

export const staggerChildren = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04
    }
  }
};

export const cascadeFade = {
  hidden: { opacity: 0, y: 12 },
  visible: (
    delay = 0
  ) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay,
      duration: 0.3,
      ease: "easeOut"
    }
  })
};

// Button hover accent (cards and CTAs).
export const popHover = {
  rest: {
    scale: 1,
    boxShadow: "0 0 0 rgba(15, 23, 42, 0)"
  },
  hover: {
    scale: 1.04,
    boxShadow: "0 12px 24px rgba(15, 23, 42, 0.12)",
    transition: {
      duration: 0.18,
      ease: "easeOut"
    }
  }
};

// Button press feedback with subtle spring.
export const buttonPress = {
  rest: { scale: 1 },
  tap: {
    scale: 0.96,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 18
    }
  }
};

// Advanced hero and section reveals.
export const heroReveal = {
  hidden: {
    opacity: 0,
    y: 40,
    clipPath: "inset(20% 20% 40% 20%)"
  },
  visible: {
    opacity: 1,
    y: 0,
    clipPath: "inset(0% 0% 0% 0%)",
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

export const slideInFromLeft = {
  hidden: { opacity: 0, x: -48 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.45,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

export const slideInFromBottom = {
  hidden: { opacity: 0, y: 48 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.2, 0.8, 0.2, 1]
    }
  }
};

export const blurIn = {
  hidden: { opacity: 0, filter: "blur(12px)" },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.45,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    filter: "blur(8px)",
    transition: {
      duration: 0.25,
      ease: "easeIn"
    }
  }
};

export const popInSpring = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 220,
      damping: 18
    }
  }
};

export const rotateIn = {
  hidden: { opacity: 0, rotate: -12, scale: 0.94 },
  visible: {
    opacity: 1,
    rotate: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.19, 1, 0.22, 1]
    }
  }
};

export const flipCard = {
  hidden: {
    rotateY: 180,
    opacity: 0
  },
  visible: {
    rotateY: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: "easeInOut"
    }
  },
  exit: {
    rotateY: -180,
    opacity: 0,
    transition: {
      duration: 0.4,
      ease: "easeIn"
    }
  }
};

export const parallaxChild = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

export const shimmerText = {
  hidden: {
    backgroundPosition: "-200% 0",
    WebkitTextFillColor: "transparent"
  },
  visible: {
    backgroundPosition: "200% 0",
    transition: {
      duration: 2.8,
      ease: "linear",
      repeat: Infinity
    }
  }
};

export const floatPulse = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: [0, -6, 0],
    transition: {
      duration: 1.8,
      ease: "easeInOut",
      repeat: Infinity
    }
  }
};

export const staggerSlow = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.18,
      delayChildren: 0.1
    }
  }
};

// Button hover variant with 3D tilt.
export const hoverTilt = {
  rest: { rotateX: 0, rotateY: 0, scale: 1 },
  hover: {
    rotateX: -4,
    rotateY: 4,
    scale: 1.03,
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  }
};
