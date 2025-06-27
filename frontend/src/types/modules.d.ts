declare module 'canvas-confetti' {
  interface Options {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: {
      x?: number;
      y?: number;
    };
    colors?: string[];
    shapes?: string[];
    scalar?: number;
    zIndex?: number;
    disableForReducedMotion?: boolean;
  }

  interface ConfettiFunction {
    (options?: Options): Promise<null> | null;
    reset(): void;
  }

  const confetti: ConfettiFunction;
  export default confetti;
}

declare module 'react-lazy-load-image-component' {
  import * as React from 'react';

  export interface LazyLoadImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    afterLoad?: () => void;
    beforeLoad?: () => void;
    delayMethod?: 'debounce' | 'throttle';
    delayTime?: number;
    effect?: 'blur' | 'black-and-white' | 'opacity';
    placeholder?: React.ReactNode;
    placeholderSrc?: string;
    scrollPosition?: {
      x: number;
      y: number;
    };
    threshold?: number;
    useIntersectionObserver?: boolean;
    visibleByDefault?: boolean;
    wrapperClassName?: string;
    wrapperProps?: React.HTMLAttributes<HTMLDivElement>;
  }

  export class LazyLoadImage extends React.Component<LazyLoadImageProps> {}
  export class LazyLoadComponent extends React.Component<any> {}
  export function trackWindowScroll<P>(Component: React.ComponentType<P>): React.ComponentType<P>;
}
