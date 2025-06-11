import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface BarcodeScannerProps {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onDetected, onClose }) => {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const html5QrcodeScannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (scannerRef.current) {
      const html5Qrcode = new Html5Qrcode(scannerRef.current.id);
      html5QrcodeScannerRef.current = html5Qrcode;
      html5Qrcode
        .start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            if (isMounted) {
              html5Qrcode.stop();
              onDetected(decodedText);
            }
          },
          (error) => {
            // Ignore decode errors
          }
        )
        .catch((err) => {
          if (isMounted) {
            setHasError(true);
            setErrorMessage('Could not initialize camera. Please check permissions.');
            console.error('Barcode scanner error:', err);
          }
        });
    }
    return () => {
      isMounted = false;
      if (html5QrcodeScannerRef.current) {
        html5QrcodeScannerRef.current.stop().catch(() => {});
      }
    };
  }, [onDetected]);

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
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <div className="p-6 flex flex-col items-center">
            <div
              id="barcode-scanner"
              ref={scannerRef}
              style={{ width: 300, height: 300 }}
            />
            <Button variant="danger" className="mt-4" onClick={onClose}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};