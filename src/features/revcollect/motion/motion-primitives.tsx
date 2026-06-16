'use client';

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type ReactNode
} from 'react';
import { AnimatePresence, motion, useReducedMotion, type HTMLMotionProps } from 'motion/react';
import { cn } from '@/lib/utils';
import {
  fadeFast,
  fadeMedium,
  getPanelTransition,
  getReducedFadeTransition,
  panelEnterY,
  panelExitY,
  pressTap,
  pressTransition,
  revealY,
  springSoft,
  staggerContainerVariants,
  staggerItemVariants
} from './motion-tokens';

export function useRevcollectMotion() {
  const reduceMotion = useReducedMotion();

  return {
    reduceMotion: Boolean(reduceMotion),
    springSnappy: getPanelTransition(reduceMotion),
    springSoft,
    fadeFast: getReducedFadeTransition(reduceMotion),
    fadeMedium: reduceMotion ? { duration: 0.08 } : fadeMedium,
    pressTap: reduceMotion ? undefined : pressTap,
    pressTransition
  };
}

const PanelEnterContext = createContext<((callback: () => void) => () => void) | null>(null);

export function useRegisterPanelEnter(callback: () => void) {
  const register = useContext(PanelEnterContext);

  useEffect(() => {
    if (!register) {
      callback();
      return;
    }
    return register(callback);
  }, [register, callback]);
}

type MotionPanelAnimateMode = 'presence' | 'enter-only';
type MotionPanelVariant = 'slide' | 'fade';

interface MotionPanelTransitionProps {
  panelKey: string;
  className?: string;
  children: ReactNode;
  /** `enter-only` fades new content in without exiting the previous panel (best for rapid inbox switches). */
  animateMode?: MotionPanelAnimateMode;
  presenceMode?: 'sync' | 'wait';
  variant?: MotionPanelVariant;
}

export function MotionPanelTransition({
  panelKey,
  className,
  children,
  animateMode = 'presence',
  presenceMode = 'wait',
  variant = 'slide'
}: MotionPanelTransitionProps) {
  const reduceMotion = useReducedMotion();
  const enterCallbacksRef = useRef(new Set<() => void>());

  const registerEnter = useCallback((callback: () => void) => {
    enterCallbacksRef.current.add(callback);
    return () => {
      enterCallbacksRef.current.delete(callback);
    };
  }, []);

  const notifyEnter = useCallback(() => {
    enterCallbacksRef.current.forEach((callback) => callback());
  }, []);

  const panelTransition = getPanelTransition(reduceMotion);
  const fadeTransition = getReducedFadeTransition(reduceMotion);
  const useFade = variant === 'fade' || animateMode === 'enter-only';
  const motionClassName = cn('flex min-h-0 min-w-0 flex-col', className);

  const handleAnimationComplete = useCallback(
    (definition: string) => {
      if (definition === 'animate') {
        notifyEnter();
      }
    },
    [notifyEnter]
  );

  if (animateMode === 'enter-only') {
    return (
      <PanelEnterContext.Provider value={registerEnter}>
        <motion.div
          key={panelKey}
          className={motionClassName}
          initial={{ opacity: reduceMotion ? 1 : 0 }}
          animate={{ opacity: 1 }}
          transition={fadeTransition}
          onAnimationComplete={handleAnimationComplete}
        >
          {children}
        </motion.div>
      </PanelEnterContext.Provider>
    );
  }

  return (
    <PanelEnterContext.Provider value={registerEnter}>
      <AnimatePresence mode={presenceMode} initial={false}>
        <motion.div
          key={panelKey}
          className={cn(motionClassName, 'flex-1')}
          initial={useFade ? { opacity: 0 } : { opacity: 0, y: reduceMotion ? 0 : panelEnterY }}
          animate={{ opacity: 1, y: 0 }}
          exit={useFade ? { opacity: 0 } : { opacity: 0, y: reduceMotion ? 0 : panelExitY }}
          transition={useFade ? fadeTransition : panelTransition}
          onAnimationComplete={handleAnimationComplete}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </PanelEnterContext.Provider>
  );
}

type MotionPressableProps = ComponentPropsWithoutRef<'button'> & {
  hoverOpacity?: number;
};

export const MotionPressable = forwardRef<HTMLButtonElement, MotionPressableProps>(
  function MotionPressable({ className, children, hoverOpacity = 0.92, ...props }, ref) {
    const { reduceMotion, pressTap: tap, pressTransition: tapTransition } = useRevcollectMotion();

    return (
      <motion.button
        ref={ref}
        type='button'
        className={className}
        whileTap={tap}
        whileHover={reduceMotion ? undefined : { opacity: hoverOpacity }}
        transition={tapTransition}
        {...(props as HTMLMotionProps<'button'>)}
      >
        {children}
      </motion.button>
    );
  }
);

interface MotionStaggerProps {
  className?: string;
  children: ReactNode;
  staggerKey?: string;
}

export function MotionStagger({ className, children, staggerKey }: MotionStaggerProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      key={staggerKey}
      className={className}
      variants={reduceMotion ? undefined : staggerContainerVariants}
      initial={reduceMotion ? false : 'hidden'}
      animate='show'
    >
      {children}
    </motion.div>
  );
}

interface MotionStaggerItemProps {
  className?: string;
  children: ReactNode;
  index?: number;
  as?: 'div' | 'li';
}

const MAX_STAGGER_INDEX = 12;

export function MotionStaggerItem({
  className,
  children,
  index = 0,
  as = 'div'
}: MotionStaggerItemProps) {
  const reduceMotion = useReducedMotion();
  const Component = as === 'li' ? motion.li : motion.div;

  if (reduceMotion || index >= MAX_STAGGER_INDEX) {
    const Tag = as === 'li' ? 'li' : 'div';
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Component className={className} variants={staggerItemVariants}>
      {children}
    </Component>
  );
}

interface MotionRevealProps {
  className?: string;
  children: ReactNode;
}

export function MotionReveal({ className, children }: MotionRevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: revealY }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={springSoft}
    >
      {children}
    </motion.div>
  );
}

interface MotionFadeProps {
  show: boolean;
  className?: string;
  children: ReactNode;
  motionKey?: string;
}

export function MotionFade({ show, className, children, motionKey }: MotionFadeProps) {
  const { fadeFast: transition } = useRevcollectMotion();

  return (
    <AnimatePresence mode='wait' initial={false}>
      {show ? (
        <motion.div
          key={motionKey ?? 'fade'}
          className={className}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

interface RevCollectPageTransitionProps {
  children: ReactNode;
  pathname: string;
  /** Workspace routes animate detail panels themselves — skip the page-level fade. */
  disabled?: boolean;
}

/** Top-level route segment so nested paths (e.g. /inbox/msg-1) do not remount the workspace. */
export function getRevcollectPageTransitionKey(pathname: string): string {
  const segment = pathname.split('/').filter(Boolean)[0];
  return segment ?? 'home';
}

export function RevCollectPageTransition({
  children,
  pathname,
  disabled = false
}: RevCollectPageTransitionProps) {
  const { fadeMedium: transition } = useRevcollectMotion();
  const pageKey = getRevcollectPageTransitionKey(pathname);

  if (disabled) {
    return <div className='flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'>{children}</div>;
  }

  return (
    <AnimatePresence mode='wait' initial={false}>
      <motion.div
        key={pageKey}
        className='flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={transition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
