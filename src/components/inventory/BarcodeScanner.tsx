import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { Camera, X, Zap, ZapOff } from 'lucide-react';
import { Button } from '../ui/Button';
import { initBarcodeScanner, stopBarcodeScanner } from '../../utils/barcodeScanner';

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ 
  onDetected, 
  onClose 
}) => {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const webcamRef = useRef<Webcam>(null);
  
  // Initialize the barcode scanner
  useEffect(() => {
    if (scannerRef.current) {
      try {
        initBarcodeScanner(scannerRef.current, {
          onDetected: (code) => {
            stopBarcodeScanner();
            onDetected(code);
          },
          onError: (error) => {
            setHasError(true);
            setErrorMessage('Could not initialize camera. Please check permissions.');
            console.error('Barcode scanner error:', error);
          }
        });
      } catch (error) {
        setHasError(true);
        setErrorMessage('Failed to initialize barcode scanner.');
        console.error('Error initializing scanner:', error);
      }
    }
    
    return () => {
      stopBarcodeScanner();
    };
  }, [onDetected]);
  
  // Toggle torch/flashlight if available
  const toggleTorch = async () => {
    try {
      if (webcamRef.current && webcamRef.current.video) {
        const track = (webcamRef.current.video.srcObject as MediaStream)
          ?.getVideoTracks()[0];
          
        if (track && 'imageCaptureOff' in track) {
          const imageCapture = new window.ImageCapture(track);
          const photoCapabilities = await imageCapture.getPhotoCapabilities();
          
          if (photoCapabilities.fillLightMode?.includes('flash')) {
            const newTorchState = !isTorchOn;
            await track.applyConstraints({
              advanced: [{ torch: newTorchState }]
            });
            setIsTorchOn(newTorchState);
          }
        }
      }
    } catch (error) {
      console.error('Error toggling torch:', error);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg overflow-hidden w-full max-w-md">
        <div className="p-4 bg-indigo-600 text-white flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center">
            <Camera className="mr-2" /> Scan Barcode
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-indigo-100"
          >
            <X size={24} />
          </button>
        </div>
        
        {hasError ? (
          <div className="p-6 text-center">
            <div className="text-red-600 mb-4">{errorMessage}</div>
            <Button 
              variant="outline" 
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        ) : (
          <>
            <div 
              ref={scannerRef} 
              className="bg-black relative overflow-hidden" 
              style={{ height: '300px' }}
            >
              <div className="absolute inset-0 pointer-events-none z-10">
                <div className="h-1/4 border-t-2 border-l-2 border-indigo-500 border-opacity-70 w-1/4 absolute top-6 left-6"></div>
                <div className="h-1/4 border-t-2 border-r-2 border-indigo-500 border-opacity-70 w-1/4 absolute top-6 right-6"></div>
                <div className="h-1/4 border-b-2 border-l-2 border-indigo-500 border-opacity-70 w-1/4 absolute bottom-6 left-6"></div>
                <div className="h-1/4 border-b-2 border-r-2 border-indigo-500 border-opacity-70 w-1/4 absolute bottom-6 right-6"></div>
              </div>
              <Webcam 
                ref={webcamRef}
                audio={false}
                videoConstraints={{
                  facingMode: 'environment'
                }}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </div>
            
            <div className="p-4 flex space-x-2">
              <Button
                variant="outline"
                className="flex-1"
                leftIcon={isTorchOn ? <ZapOff size={16} /> : <Zap size={16} />}
                onClick={toggleTorch}
              >
                {isTorchOn ? 'Turn Off Flash' : 'Turn On Flash'}
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                leftIcon={<X size={16} />}
                onClick={onClose}
              >
                Cancel
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};