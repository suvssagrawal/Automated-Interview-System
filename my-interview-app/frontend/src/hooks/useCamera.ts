// src/hooks/useCamera.ts
import { useState, useRef, useEffect } from 'react';

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isCameraActive: boolean;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  hasCameraSupport: boolean;
}

export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCameraSupport, setHasCameraSupport] = useState(true);

  // Check camera support
  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasCameraSupport(false);
      setError('Camera not supported in this browser');
    }
  }, []);

  const startCamera = async (): Promise<void> => {
    try {
      console.log('🎥 Attempting to start camera...');
      
      if (!hasCameraSupport) {
        setError('Camera not supported');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        },
        audio: false 
      });
      
      console.log('🎥 Camera stream obtained:', stream);
      
      // 🎯 CRITICAL FIX: Wait for React to render the video element
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (videoRef.current) {
        console.log('🎥 Video element found, assigning stream...');
        
        // 🎯 Clear any existing stream first
        if (videoRef.current.srcObject) {
          videoRef.current.srcObject = null;
        }
        
        // 🎯 Assign the new stream
        videoRef.current.srcObject = stream;
        
        // 🎯 Force the video to play
        try {
          await videoRef.current.play();
          console.log('🎥 Video play() successful');
        } catch (playError) {
          console.log('🎥 Video play() failed, trying alternative:', playError);
        }
        
        setIsCameraActive(true);
        setError(null);
        console.log('🎥 Camera started successfully');
        
      } else {
        console.error('🎥 videoRef is null - video element not rendered yet');
        // 🎯 Fallback: Create a temporary video element to verify stream works
        const tempVideo = document.createElement('video');
        tempVideo.srcObject = stream;
        tempVideo.autoplay = true;
        tempVideo.playsInline = true;
        tempVideo.muted = true;
        tempVideo.style.cssText = 'position:fixed;top:10px;right:10px;width:200px;border:2px solid blue;z-index:9999;';
        document.body.appendChild(tempVideo);
        console.log('🎥 Created fallback video element');
      }
    } catch (err: any) {
      console.error('🎥 Camera error details:', err);
      const errorMessage = err.name === 'NotAllowedError' 
        ? 'Camera access denied. Please allow camera permissions.'
        : err.name === 'NotFoundError'
        ? 'No camera found on this device.'
        : `Failed to access camera: ${err.message}`;
      
      setError(errorMessage);
    }
  };

  const stopCamera = (): void => {
    console.log('🛑 Stopping camera...');
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      
      // 🎯 STOP ALL TRACKS PROPERLY
      stream.getTracks().forEach(track => {
        console.log(`🛑 Stopping track: ${track.kind}`);
        track.stop(); // This actually stops the camera
      });
      
      // 🎯 CLEAR THE VIDEO ELEMENT
      videoRef.current.srcObject = null;
      videoRef.current.load(); // Force video element to reset
      
      setIsCameraActive(false);
      console.log('✅ Camera stopped successfully');
      
    } else {
      console.log('🛑 No camera stream to stop');
      setIsCameraActive(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return {
    videoRef,
    isCameraActive,
    error,
    startCamera,
    stopCamera,
    hasCameraSupport
  };
}