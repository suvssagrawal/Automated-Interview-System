import { useState, useEffect, useCallback, useRef } from 'react';

interface UseFullscreenReturn {
  isFullscreen: boolean;
  isSupported: boolean;
  enterFullscreen: () => Promise<void>;
  exitFullscreen: () => Promise<void>;
  toggleFullscreen: () => Promise<void>;
  fullscreenExitCount: number;
}

export function useFullscreen(): UseFullscreenReturn {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const elementRef = useRef<HTMLElement | null>(null);
  
  const isSupported = typeof document !== 'undefined' && 
    !!(document.fullscreenEnabled || 
       (document as any).webkitFullscreenEnabled || 
       (document as any).mozFullScreenEnabled);

  // Track fullscreen changes
  useEffect(() => {
    if (!isSupported) return;

    const handleFullscreenChange = () => {
      const fullscreenElement = 
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement;
      
      const nowFullscreen = !!fullscreenElement;
      
      // If we were fullscreen and now we're not, increment exit count
      if (isFullscreen && !nowFullscreen) {
        setFullscreenExitCount(prev => prev + 1);
        console.warn('⚠️ User exited fullscreen mode!');
      }
      
      setIsFullscreen(nowFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    };
  }, [isFullscreen, isSupported]);

  const enterFullscreen = useCallback(async () => {
    if (!isSupported) {
      console.warn('Fullscreen API is not supported');
      return;
    }

    try {
      const element = elementRef.current || document.documentElement;
      
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
      }
      
      console.log('✅ Entered fullscreen mode');
    } catch (error) {
      console.error('❌ Failed to enter fullscreen:', error);
    }
  }, [isSupported]);

  const exitFullscreen = useCallback(async () => {
    if (!isSupported) return;

    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      }
      
      console.log('✅ Exited fullscreen mode');
    } catch (error) {
      console.error('❌ Failed to exit fullscreen:', error);
    }
  }, [isSupported]);

  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  return {
    isFullscreen,
    isSupported,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
    fullscreenExitCount
  };
}
