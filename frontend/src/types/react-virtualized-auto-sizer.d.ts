declare module 'react-virtualized-auto-sizer' {
  import { ComponentType, ReactNode } from 'react';

  export interface Size {
    height: number;
    width: number;
  }

  export interface AutoSizerProps {
    children: (size: Size) => ReactNode;
    className?: string;
    defaultHeight?: number;
    defaultWidth?: number;
    disableHeight?: boolean;
    disableWidth?: boolean;
    nonce?: string;
    onResize?: (size: Size) => void;
    style?: React.CSSProperties;
  }

  const AutoSizer: ComponentType<AutoSizerProps>;
  export default AutoSizer;
}
