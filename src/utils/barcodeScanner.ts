import Quagga from 'quagga';

interface ScannerConfig {
  onDetected: (code: string) => void;
  onError?: (error: any) => void;
}

export const initBarcodeScanner = (
  element: HTMLElement, 
  config: ScannerConfig
): void => {
  Quagga.init({
    inputStream: {
      name: "Live",
      type: "LiveStream",
      target: element,
      constraints: {
        facingMode: "environment", // Use rear camera if available
        width: { min: 640 },
        height: { min: 480 },
        aspectRatio: { min: 1, max: 2 }
      },
    },
    locator: {
      patchSize: "medium",
      halfSample: true
    },
    numOfWorkers: 2,
    frequency: 10,
    decoder: {
      readers: [
        "ean_reader",
        "ean_8_reader",
        "code_128_reader",
        "code_39_reader",
        "upc_reader"
      ]
    },
    locate: true
  }, (err) => {
    if (err) {
      if (config.onError) {
        config.onError(err);
      }
      return;
    }
    
    Quagga.start();
    
    Quagga.onDetected((result) => {
      if (result && result.codeResult) {
        config.onDetected(result.codeResult.code);
      }
    });
  });
};

export const stopBarcodeScanner = (): void => {
  Quagga.stop();
};