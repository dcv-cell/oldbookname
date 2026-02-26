import logService from './logService';
import aiImageService from './aiImageService';

class BarcodeService {
  constructor() {
    this.useAI = false; // 是否使用AI识别
    this.aiApiKey = ''; // AI API密钥
    this.aiProvider = 'baidu'; // 默认使用百度文心一言
    logService.info('Barcode Service initialized with AI-only mode');
  }

  // 启用AI识别
  enableAI(provider, apiKey) {
    this.useAI = true;
    this.aiApiKey = apiKey;
    this.aiProvider = provider || 'baidu'; // 默认使用百度文心一言
    
    try {
      aiImageService.setApiKey(this.aiProvider, apiKey);
      aiImageService.setProvider(this.aiProvider);
      logService.info(`AI recognition enabled with ${aiImageService.getCurrentProvider().name}`);
    } catch (error) {
      logService.error('Failed to enable AI:', { error: error.message });
      throw error;
    }
  }

  // 禁用AI识别
  disableAI() {
    this.useAI = false;
    this.aiApiKey = '';
    this.aiProvider = '';
    logService.info('AI recognition disabled');
  }

  // 获取当前AI提供商信息
  getAIProvider() {
    if (!this.useAI) {
      return null;
    }
    try {
      return aiImageService.getCurrentProvider();
    } catch (error) {
      logService.error('Failed to get AI provider info:', { error: error.message });
      return null;
    }
  }

  // 解码图像中的ISBN（直接使用AI）
  async decodeImage(imageData) {
    return new Promise(async (resolve, reject) => {
      try {
        logService.info('Decoding ISBN from image using AI...');
        
        if (!this.useAI) {
          logService.warn('AI recognition is disabled');
          resolve(null);
          return;
        }

        // 直接使用AI图像服务进行识别
        const aiResult = await aiImageService.recognizeISBN(imageData);
        
        if (aiResult) {
          logService.info('AI recognition successful:', { isbn: aiResult });
          resolve(aiResult);
        } else {
          logService.warn('AI recognition failed to extract ISBN');
          resolve(null);
        }
      } catch (error) {
        logService.error('AI decoding error:', { error: error.message });
        // 即使AI识别失败，也返回null而不是拒绝Promise
        // 这样前端可以优雅地处理失败情况
        resolve(null);
      }
    });
  }

  // 识别图像中的完整图书信息（直接使用AI）
  async recognizeBookInfo(imageData) {
    return new Promise(async (resolve, reject) => {
      try {
        logService.info('Recognizing book info from image using AI...');
        
        if (!this.useAI) {
          logService.warn('AI recognition is disabled');
          resolve(null);
          return;
        }

        // 直接使用AI图像服务进行识别
        const aiResult = await aiImageService.recognizeBookInfo(imageData);
        
        if (aiResult) {
          logService.info('AI book info recognition successful:', { info: aiResult });
          resolve(aiResult);
        } else {
          logService.warn('AI recognition failed to extract book info');
          resolve(null);
        }
      } catch (error) {
        logService.error('AI book info recognition error:', { error: error.message });
        // 即使AI识别失败，也返回null而不是拒绝Promise
        // 这样前端可以优雅地处理失败情况
        resolve(null);
      }
    });
  }
}

export default new BarcodeService();