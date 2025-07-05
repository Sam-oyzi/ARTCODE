"use client";

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Maximize2, RotateCcw, Camera, Download } from 'lucide-react';
import { GoogleDriveService } from '@/lib/googleDriveService';

interface ModelViewer3DProps {
  src: string;
  alt?: string;
  poster?: string;
  className?: string;
  width?: string;
  height?: string;
  autoRotate?: boolean;
  cameraControls?: boolean;
  ar?: boolean;
  downloadUrl?: string;
  title?: string;
}

interface Model3DViewerProps {
  modelUrl: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}

// Declare the model-viewer element for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
}

// Simple Model3DViewer component for the dashboard
const Model3DViewer: React.FC<Model3DViewerProps> = ({ modelUrl, alt, className, style }) => {
  const [directUrl, setDirectUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const prepareModelUrl = async () => {
      try {
        console.log('🔄 Preparing model URL:', modelUrl);
        
        let finalUrl = modelUrl;
        
        // Check if it's a Google Drive URL and convert to direct download
        if (GoogleDriveService.isGoogleDriveUrl(modelUrl)) {
          const fileId = GoogleDriveService.extractFileId(modelUrl);
          if (fileId) {
            finalUrl = GoogleDriveService.getDirectDownloadUrl(fileId);
            console.log('✅ Converted to direct URL:', finalUrl);
          }
        }
        
        setDirectUrl(finalUrl);
        setLoading(false);
        
      } catch (err) {
        console.error('❌ Error preparing model URL:', err);
        setError('Failed to load 3D model');
        setLoading(false);
      }
    };

    // Load the model-viewer script if not already loaded
    if (!document.querySelector('script[src*="model-viewer"]')) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
      document.head.appendChild(script);
    }

    if (modelUrl) {
      prepareModelUrl();
    }
  }, [modelUrl]);

  if (loading) {
    return (
      <div className={className} style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading 3D model...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className} style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Error: {error}</div>
      </div>
    );
  }

  return (
    <model-viewer
      src={directUrl}
      alt={alt}
      camera-controls
      auto-rotate
      className={className}
      style={{ width: '100%', height: '400px', ...style }}
      onLoad={() => console.log('✅ 3D model loaded successfully')}
      onError={(e) => {
        console.error('❌ 3D model failed to load:', e);
        setError('Failed to load 3D model');
      }}
    />
  );
};

export function ModelViewer3D({
  src,
  alt = "3D Model",
  poster,
  className = "",
  width = "100%",
  height = "400px",
  autoRotate = true,
  cameraControls = true,
  ar = false,
  downloadUrl,
  title
}: ModelViewer3DProps) {
  const modelViewerRef = useRef<any>(null);

  useEffect(() => {
    // Load the model-viewer script if not already loaded
    if (!document.querySelector('script[src*="model-viewer"]')) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
      document.head.appendChild(script);
    }
  }, []);

  const resetCamera = () => {
    if (modelViewerRef.current) {
      modelViewerRef.current.resetTurntableRotation();
    }
  };

  const toggleAutoRotate = () => {
    if (modelViewerRef.current) {
      const current = modelViewerRef.current.autoRotate;
      modelViewerRef.current.autoRotate = !current;
    }
  };

  const enterFullscreen = () => {
    if (modelViewerRef.current) {
      if (modelViewerRef.current.requestFullscreen) {
        modelViewerRef.current.requestFullscreen();
      }
    }
  };

  const takeScreenshot = () => {
    if (modelViewerRef.current) {
      const canvas = modelViewerRef.current.toDataURL();
      const link = document.createElement('a');
      link.download = `${title || 'model'}_screenshot.png`;
      link.href = canvas;
      link.click();
    }
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-0 relative">
        <model-viewer
          ref={modelViewerRef}
          src={src}
          alt={alt}
          poster={poster}
          style={{
            width,
            height,
            backgroundColor: '#f5f5f5'
          }}
          auto-rotate={autoRotate}
          camera-controls={cameraControls}
          ar={ar}
          ar-modes="webxr scene-viewer quick-look"
          environment-image="neutral"
          shadow-intensity="1"
          loading="lazy"
        />
        
        {/* Controls Overlay */}
        <div className="absolute top-2 right-2 flex gap-2 opacity-75 hover:opacity-100 transition-opacity">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8"
            onClick={resetCamera}
            title="Reset Camera"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8"
            onClick={takeScreenshot}
            title="Take Screenshot"
          >
            <Camera className="h-4 w-4" />
          </Button>
          
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8"
            onClick={enterFullscreen}
            title="Fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Download Button */}
        {downloadUrl && (
          <div className="absolute bottom-2 left-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.open(downloadUrl, '_blank')}
              className="opacity-75 hover:opacity-100 transition-opacity"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default Model3DViewer; 