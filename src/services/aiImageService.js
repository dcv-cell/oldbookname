import axios from 'axios';
import logService from './logService.js';
import apiConfig from '../config/apiConfig.js';

class AIImageService {
  constructor() {
    this.providers = {
      doubao: {
        name: '豆包大模型',
        apiKey: apiConfig.doubao?.apiKey || '',
        apiUrl: apiConfig.doubao?.apiUrl || 'https://ark.cn-beijing.volces.com/api/v3/responses',
        model: apiConfig.doubao?.model || 'doubao-seed-1-6-flash-250828',
        enabled: !!apiConfig.doubao?.apiKey
      }
    };
    // 默认使用豆包大模型
    this.currentProvider = 'doubao';
    logService.info('AI Image Service initialized with Doubao provider only');
    logService.info(`Default provider set to: ${this.providers[this.currentProvider].name}`);
  }

  // 设置AI提供商的API密钥
  setApiKey(provider, key) {
    if (this.providers[provider]) {
      this.providers[provider].apiKey = key;
      this.providers[provider].enabled = true;
      logService.info(`AI API key set for ${this.providers[provider].name}`);
    } else {
      logService.error(`Invalid AI provider: ${provider}`);
      throw new Error(`Invalid AI provider: ${provider}`);
    }
  }

  // 设置当前使用的AI提供商
  setProvider(provider) {
    // 现在只支持豆包大模型
    if (provider === 'doubao' && this.providers.doubao.enabled) {
      this.currentProvider = provider;
      logService.info(`Current AI provider set to ${this.providers[provider].name}`);
    } else {
      logService.error(`AI provider ${provider} not supported or invalid`);
      throw new Error(`Only Doubao AI provider is supported`);
    }
  }

  // 获取当前使用的AI提供商信息
  getCurrentProvider() {
    return {
      name: this.providers[this.currentProvider].name,
      enabled: this.providers[this.currentProvider].enabled,
      model: this.providers[this.currentProvider].model
    };
  }

  // 识别图像中的条形码/ISBN
  async recognizeISBN(imageData) {
    if (!imageData) {
      logService.error('No image data provided');
      throw new Error('No image data provided');
    }

    const provider = this.providers.doubao;
    if (!provider.enabled) {
      logService.error(`Current AI provider (${provider.name}) is not enabled`);
      throw new Error(`AI provider not configured`);
    }

    if (!provider.apiKey) {
      logService.error(`API key not set for ${provider.name}`);
      throw new Error(`API key not configured for ${provider.name}`);
    }

    logService.info(`Starting AI image recognition for ISBN using ${provider.name}`);

    try {
      // 直接使用豆包大模型
      const result = await this.recognizeWithDoubao(imageData, provider);

      // 验证结果是否为有效的ISBN
      if (!result || result === 'null' || result === 'Null' || result === 'NULL') {
        logService.warn('AI found no ISBN in image');
        return null;
      }

      // 清理ISBN格式
      const cleanISBN = result.replace(/[^0-9X]/g, '');
      
      // 验证ISBN格式
      if (this.isValidISBN(cleanISBN)) {
        logService.info('Valid ISBN extracted by AI:', { isbn: cleanISBN, provider: provider.name });
        return cleanISBN;
      } else {
        logService.warn('AI returned invalid ISBN format:', { result: cleanISBN, provider: provider.name });
        return null;
      }

    } catch (error) {
      logService.error('AI image recognition error:', { error: error.message, provider: provider.name });
      // 直接抛出错误，不使用备选方案
      throw new Error(`AI识别失败: ${error.message}。请尝试手动输入ISBN或检查网络连接。`);
    }
  }

  // 识别图像中的完整图书信息
  async recognizeBookInfo(imageData) {
    if (!imageData) {
      logService.error('No image data provided');
      throw new Error('No image data provided');
    }

    const provider = this.providers.doubao;
    if (!provider.enabled) {
      logService.error(`Current AI provider (${provider.name}) is not enabled`);
      throw new Error(`AI provider not configured`);
    }

    if (!provider.apiKey) {
      logService.error(`API key not set for ${provider.name}`);
      throw new Error(`API key not configured for ${provider.name}`);
    }

    logService.info(`Starting AI image recognition for book info using ${provider.name}`);

    try {
      // 直接使用豆包大模型
      const result = await this.recognizeBookInfoWithDoubao(imageData, provider);
      logService.info('Book info extracted by AI:', { info: result });
      return result;
    } catch (error) {
      logService.error('AI book info recognition error:', { error: error.message });
      throw new Error(`AI识别失败: ${error.message}。请尝试手动输入图书信息或检查网络连接。`);
    }
  }



  // 验证ISBN格式
  isValidISBN(isbn) {
    if (!isbn) return false;
    
    // 清理ISBN
    const cleanISBN = isbn.replace(/[^0-9X]/g, '');
    
    // 检查长度
    if (cleanISBN.length !== 10 && cleanISBN.length !== 13) {
      return false;
    }
    
    // 对于13位ISBN，检查前缀
    if (cleanISBN.length === 13 && !cleanISBN.startsWith('978') && !cleanISBN.startsWith('979')) {
      return false;
    }
    
    return true;
  }

  // 递归查找对象中的字符串字段
  findStringInObject(obj) {
    if (typeof obj === 'string' && obj.length > 0) {
      return obj;
    } else if (Array.isArray(obj)) {
      for (const item of obj) {
        const result = this.findStringInObject(item);
        if (result) {
          return result;
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        const result = this.findStringInObject(obj[key]);
        if (result) {
          return result;
        }
      }
    }
    return null;
  }

  // 轮询豆包API任务状态
  async pollDoubaoTaskStatus(apiUrl, taskId) {
    const maxRetries = 30;
    const retryInterval = 1000; // 1秒
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        // 构建任务状态查询URL
        const statusUrl = `${apiUrl}/${taskId}`;
        logService.debug('Polling Doubao task status:', { url: statusUrl, attempt: i + 1 });
        
        const response = await axios.get(statusUrl, {
          headers: {
            'Authorization': `Bearer ${apiConfig.doubao.apiKey}`
          },
          timeout: 10000
        });
        
        if (response.data && response.data.status === 'completed') {
          logService.info('Doubao task completed successfully');
          // 查找响应中的内容
          const content = this.findStringInObject(response.data);
          if (content) {
            return content;
          }
          // 尝试直接从新的响应格式中提取内容
          if (response.data && response.data.output && Array.isArray(response.data.output) && response.data.output.length > 0) {
            for (const outputItem of response.data.output) {
              if (outputItem.type === 'message' && outputItem.role === 'assistant' && outputItem.content && Array.isArray(outputItem.content)) {
                for (const contentItem of outputItem.content) {
                  if (contentItem.type === 'output_text' && contentItem.text) {
                    return contentItem.text;
                  }
                }
              }
            }
          }
        } else if (response.data && response.data.status === 'failed') {
          logService.error('Doubao task failed:', { error: response.data.error });
          throw new Error(`Task failed: ${response.data.error}`);
        }
        
        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, retryInterval));
      } catch (error) {
        logService.error('Error polling Doubao task status:', { error: error.message });
        throw error;
      }
    }
    
    throw new Error('Task polling timed out');
  }

  // 批量处理多个图像
  async batchRecognizeISBN(imageDataArray) {
    const results = [];
    
    for (const imageData of imageDataArray) {
      try {
        const result = await this.recognizeISBN(imageData);
        results.push(result);
      } catch (error) {
        logService.error('Error in batch recognition:', { error: error.message });
        results.push(null);
      }
    }
    
    return results;
  }

  // 使用豆包大模型API识别ISBN
  async recognizeWithDoubao(imageData, provider) {
    // 豆包API的正确请求格式（根据用户提供的curl命令）
    const requestData = {
      model: provider.model,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_image",
              image_url: imageData
            },
            {
              type: "input_text",
              text: '你是条形码和ISBN识别专家。请从这个图像中提取ISBN号码。只返回数字ISBN，不包含任何连字符或格式化。如果没有找到ISBN，返回null。'
            }
          ]
        }
      ]
    };

    try {
      const response = await axios.post(provider.apiUrl, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`
        },
        timeout: 30000
      });

      logService.debug('Doubao API ISBN recognition response:', { data: response.data });
      
      // 检查响应结构
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        // 豆包API可能返回choices字段
        const content = response.data.choices[0].message.content.trim();
        return content;
      } else if (response.data && response.data.result) {
        // 兼容旧的响应格式
        return response.data.result.trim();
      } else if (response.data && response.data.output && response.data.output.choices && response.data.output.choices.length > 0) {
        // 豆包API的另一种响应格式
        const content = response.data.output.choices[0].message.content.trim();
        return content;
      } else if (response.data && response.data.output && typeof response.data.output === 'string') {
        // 豆包API的字符串响应格式
        return response.data.output.trim();
      } else if (response.data && response.data.message) {
        // 豆包API的message响应格式
        return response.data.message.trim();
      } else if (response.data && response.data.content) {
        // 豆包API的content响应格式
        return response.data.content.trim();
      } else if (response.data && response.data.answer) {
        // 豆包API的answer响应格式
        return response.data.answer.trim();
      } else if (response.data && response.data.outputs && Array.isArray(response.data.outputs) && response.data.outputs.length > 0) {
        // 豆包API的outputs数组响应格式
        for (const output of response.data.outputs) {
          if (output.content) {
            return output.content.trim();
          }
        }
      } else if (response.data && response.data.output && Array.isArray(response.data.output) && response.data.output.length > 0) {
        // 豆包API的output数组响应格式（新格式）
        for (const outputItem of response.data.output) {
          if (outputItem.type === 'message' && outputItem.role === 'assistant' && outputItem.content && Array.isArray(outputItem.content)) {
            for (const contentItem of outputItem.content) {
              if (contentItem.type === 'output_text' && contentItem.text) {
                return contentItem.text.trim();
              }
            }
          }
        }
      } else {
        // 尝试查找响应中的任何字符串字段
        let foundContent = null;
        for (const key in response.data) {
          if (typeof response.data[key] === 'string' && response.data[key].length > 0) {
            foundContent = response.data[key];
            break;
          } else if (typeof response.data[key] === 'object' && response.data[key] !== null) {
            // 递归查找对象中的字符串字段
            const nestedContent = this.findStringInObject(response.data[key]);
            if (nestedContent) {
              foundContent = nestedContent;
              break;
            }
          }
        }
        
        if (foundContent) {
          return foundContent.trim();
        }
        
        logService.error('Doubao API returned unexpected response format for ISBN recognition:', { response: response.data });
      }
    } catch (error) {
      logService.error('Doubao API ISBN recognition failed:', { 
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }

    return null;
  }

  // 使用豆包大模型API识别完整图书信息
  async recognizeBookInfoWithDoubao(imageData, provider) {
    // 豆包API的正确请求格式（根据用户提供的curl命令）
    const requestData = {
      model: provider.model,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_image",
              image_url: imageData
            },
            {
              type: "input_text",
              text: "你是图书信息识别专家。请从这个图书封面图像中提取完整的图书信息，包括书名、作者、出版社、ISBN号码、出版日期、价格等。请以JSON格式返回，字段包括：title、author、publisher、isbn、publishDate、price。如果某些信息无法识别，请保持对应字段为空字符串。"
            }
          ]
        }
      ]
    };

    logService.info('Calling Doubao API with URL:', { url: provider.apiUrl });
    logService.debug('Doubao API request data:', requestData);
    
    try {
      const response = await axios.post(provider.apiUrl, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`
        },
        timeout: 60000
      });

      logService.debug('Doubao API full response:', { status: response.status, statusText: response.statusText, data: response.data });
      
      // 检查响应结构
      if (response.data && response.data.result) {
        // 豆包API的标准响应格式
        const content = response.data.result.trim();
        logService.debug('Doubao API response content:', content);
        
        // 提取JSON部分
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]);
          } catch (parseError) {
            logService.error('Failed to parse JSON response from Doubao:', { error: parseError.message, content });
            return {};
          }
        }
      } else if (response.data && response.data.choices && response.data.choices.length > 0) {
        // 兼容OpenAI格式的响应
        const content = response.data.choices[0].message.content.trim();
        logService.debug('Doubao API OpenAI format response content:', content);
        
        // 提取JSON部分
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]);
          } catch (parseError) {
            logService.error('Failed to parse JSON response from Doubao (OpenAI format):', { error: parseError.message, content });
            return {};
          }
        }
      } else if (response.data && response.data.output && response.data.output.choices && response.data.output.choices.length > 0) {
        // 豆包API的另一种响应格式
        const content = response.data.output.choices[0].message.content.trim();
        logService.debug('Doubao API alternative format response content:', content);
        
        // 提取JSON部分
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]);
          } catch (parseError) {
            logService.error('Failed to parse JSON response from Doubao (alternative format):', { error: parseError.message, content });
            return {};
          }
        }
      } else if (response.data && response.data.output && typeof response.data.output === 'string') {
        // 豆包API的字符串响应格式
        const content = response.data.output.trim();
        logService.debug('Doubao API string format response content:', content);
        
        // 提取JSON部分
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]);
          } catch (parseError) {
            logService.error('Failed to parse JSON response from Doubao (string format):', { error: parseError.message, content });
            return {};
          }
        }
      } else if (response.data && response.data.message) {
        // 豆包API的message响应格式
        const content = response.data.message.trim();
        logService.debug('Doubao API message format response content:', content);
        
        // 提取JSON部分
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]);
          } catch (parseError) {
            logService.error('Failed to parse JSON response from Doubao (message format):', { error: parseError.message, content });
            return {};
          }
        }
      } else if (response.data && response.data.content) {
        // 豆包API的content响应格式
        const content = response.data.content.trim();
        logService.debug('Doubao API content format response content:', content);
        
        // 提取JSON部分
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]);
          } catch (parseError) {
            logService.error('Failed to parse JSON response from Doubao (content format):', { error: parseError.message, content });
            return {};
          }
        }
      } else if (response.data && response.data.answer) {
        // 豆包API的answer响应格式
        const content = response.data.answer.trim();
        logService.debug('Doubao API answer format response content:', content);
        
        // 提取JSON部分
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]);
          } catch (parseError) {
            logService.error('Failed to parse JSON response from Doubao (answer format):', { error: parseError.message, content });
            return {};
          }
        }
      } else if (response.data && response.data.outputs && Array.isArray(response.data.outputs) && response.data.outputs.length > 0) {
        // 豆包API的outputs数组响应格式
        for (const output of response.data.outputs) {
          if (output.content) {
            const content = output.content.trim();
            logService.debug('Doubao API outputs format response content:', content);
            
            // 提取JSON部分
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                return JSON.parse(jsonMatch[0]);
              } catch (parseError) {
                logService.error('Failed to parse JSON response from Doubao (outputs format):', { error: parseError.message, content });
                continue;
              }
            }
          }
        }
      } else if (response.data && response.data.output && Array.isArray(response.data.output) && response.data.output.length > 0) {
        // 豆包API的output数组响应格式（新格式）
        for (const outputItem of response.data.output) {
          if (outputItem.type === 'message' && outputItem.role === 'assistant' && outputItem.content && Array.isArray(outputItem.content)) {
            for (const contentItem of outputItem.content) {
              if (contentItem.type === 'output_text' && contentItem.text) {
                const content = contentItem.text.trim();
                logService.debug('Doubao API output array format response content:', content);
                
                // 提取JSON部分
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  try {
                    return JSON.parse(jsonMatch[0]);
                  } catch (parseError) {
                    logService.error('Failed to parse JSON response from Doubao (output array format):', { error: parseError.message, content });
                    // 继续处理，不直接返回
                  }
                }
              }
            }
          }
        }
      } else {
        // 打印完整的响应结构，以便分析
        logService.debug('Complete Doubao API response structure:', response.data);
        
        // 检查是否是任务创建响应，需要轮询获取结果
        if (response.data && response.data.id) {
          logService.info('Doubao API returned task creation response, polling for result...', { taskId: response.data.id });
          // 尝试轮询获取结果
          try {
            const result = await this.pollDoubaoTaskStatus(provider.apiUrl, response.data.id);
            if (result) {
              // 提取JSON部分
              const jsonMatch = result.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                try {
                  return JSON.parse(jsonMatch[0]);
                } catch (parseError) {
                  logService.error('Failed to parse JSON response from Doubao (polled result):', { error: parseError.message, content: result });
                  return {};
                }
              }
            }
          } catch (pollError) {
            logService.error('Failed to poll Doubao task status:', { error: pollError.message });
          }
        }
        
        // 尝试查找响应中的任何字符串字段
        let foundContent = null;
        for (const key in response.data) {
          if (typeof response.data[key] === 'string' && response.data[key].length > 0) {
            foundContent = response.data[key];
            break;
          } else if (typeof response.data[key] === 'object' && response.data[key] !== null) {
            // 递归查找对象中的字符串字段
            const nestedContent = this.findStringInObject(response.data[key]);
            if (nestedContent) {
              foundContent = nestedContent;
              break;
            }
          }
        }
        
        if (foundContent) {
          logService.debug('Doubao API unknown format response content:', foundContent);
          
          // 提取JSON部分
          const jsonMatch = foundContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              return JSON.parse(jsonMatch[0]);
            } catch (parseError) {
              logService.error('Failed to parse JSON response from Doubao (unknown format):', { error: parseError.message, content: foundContent });
              return {};
            }
          }
        }
        
        logService.error('Doubao API returned unexpected response format:', { 
          response: response.data, 
          responseKeys: Object.keys(response.data),
          responseString: JSON.stringify(response.data)
        });
      }
    } catch (error) {
      logService.error('Doubao API call failed:', { 
        error: error.message, 
        status: error.response?.status,
        data: error.response?.data,
        stack: error.stack 
      });
      throw error;
    }
    
    return {};
  }
}

export default new AIImageService();