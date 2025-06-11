export interface ScannerConfig {
  onDetected: (barcode: string) => void;
  onError?: (error: unknown) => void;
}

export async function initBarcodeScanner(
  element: HTMLElement,
  config: ScannerConfig
): Promise<void> {
  const { default: Quagga } = await import('@ericblade/quagga2');
  Quagga.init({
    inputStream: {
      name: "Live",
      type: "LiveStream",
      target: element,
      constraints: {
        facingMode: "environment",
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
  }, (err: unknown) => {
    if (err) {
      if (config.onError) {
        config.onError(err);
      }
      return;
    }
    Quagga.start();
    Quagga.onDetected((result: any) => {
      if (result && result.codeResult) {
        config.onDetected(result.codeResult.code);
      }
    });
  });
}

export async function stopBarcodeScanner() {
  const { default: Quagga } = await import('@ericblade/quagga2');
  Quagga.stop();
} 