import Quagga from 'quagga';
import logService from './logService';

class BarcodeService {
  constructor() {
    this.scanner = null;
    this.isScanning = false;
    logService.info('Barcode Service initialized');
  }

  // 初始化条形码扫描器
  initScanner(videoElement, onDetected, onError) {
    try {
      logService.info('Initializing barcode scanner...');
      
      Quagga.init({
        inputStream: {
          name: 'Live',
          type: 'LiveStream',
          target: videoElement,
          constraints: {
            facingMode: 'environment' // 使用后置摄像头
          }
        },
        decoder: {
          readers: ['ean_reader', 'ean_8_reader', 'code_128_reader'] // 支持ISBN等条形码
        },
        locate: true,
        numOfWorkers: 2
      }, (err) => {
        if (err) {
          logService.error('Failed to initialize barcode scanner:', { error: err.message });
          if (onError) {
            onError(err);
          }
          return;
        }
        
        logService.info('Barcode scanner initialized successfully');
        
        // 注册条形码检测事件
        Quagga.onDetected((result) => {
          logService.info('Barcode detected:', { code: result.codeResult.code });
          if (onDetected) {
            onDetected(result.codeResult.code);
          }
        });
        
        // 开始扫描
        this.startScanning();
      });
    } catch (error) {
      logService.error('Barcode scanner initialization error:', { error: error.message });
      if (onError) {
        onError(error);
      }
    }
  }

  // 开始扫描
  startScanning() {
    if (!this.isScanning) {
      try {
        Quagga.start();
        this.isScanning = true;
        logService.info('Barcode scanning started');
      } catch (error) {
        logService.error('Failed to start scanning:', { error: error.message });
      }
    }
  }

  // 停止扫描
  stopScanning() {
    if (this.isScanning) {
      try {
        Quagga.stop();
        this.isScanning = false;
        logService.info('Barcode scanning stopped');
      } catch (error) {
        logService.error('Failed to stop scanning:', { error: error.message });
      }
    }
  }

  // 销毁扫描器
  destroy() {
    this.stopScanning();
    try {
      Quagga.offDetected();
      // Quagga.js 可能没有 destroy 方法，使用 stop 方法停止所有处理
      Quagga.stop();
      logService.info('Barcode scanner destroyed');
    } catch (error) {
      logService.error('Failed to destroy scanner:', { error: error.message });
    }
  }

  // 手动解码条形码图像
  async decodeImage(imageData) {
    return new Promise((resolve, reject) => {
      try {
        logService.info('Decoding barcode from image...');
        
        Quagga.decodeSingle({
          src: imageData,
          decoder: {
            readers: ['ean_reader', 'ean_8_reader', 'code_128_reader']
          }
        }, (result) => {
          if (result && result.codeResult) {
            const code = result.codeResult.code;
            logService.info('Barcode decoding successful:', { code });
            resolve(code);
          } else {
            logService.info('No barcode detected in image');
            resolve(null);
          }
        });
      } catch (error) {
        logService.error('Barcode decoding error:', { error: error.message });
        reject(error);
      }
    });
  }
}

export default new BarcodeService();