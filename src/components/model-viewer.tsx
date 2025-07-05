'use client';

import { forwardRef } from 'react';
import type { ForwardedRef } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
}

interface ModelViewerProps {
  src: string;
  alt: string;
}

const ModelViewer = forwardRef<any, ModelViewerProps>(({ src, alt }, ref: ForwardedRef<any>) => {
  return (
    <model-viewer
      ref={ref}
      src={src}
      alt={alt}
      camera-controls
      touch-action="pan-y"
      ar
      ar-modes="webxr scene-viewer quick-look"
      style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
      camera-orbit="0deg 75deg 110%"
      shadow-intensity="1"
      autoplay
    >
      <button slot="ar-button" style={{ display: 'none' }}></button>
    </model-viewer>
  );
});

ModelViewer.displayName = 'ModelViewer';

export default ModelViewer;
