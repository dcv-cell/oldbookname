// API配置文件
// 注意：不要在版本控制中存储真实的API密钥
// 建议在生产环境中使用环境变量或安全的配置管理系统

import axios from 'axios';

const apiConfig = {
  // 百度文心一言配置
  baidu: {
    // 这里填入您的百度云API密钥
    apiKey: 'bce-v3/ALTAK-lrIpukCk8SdI6mVxzFKoE/2a7c44cb5d86fc1a81d797852ad8f37f5d3f7954',
    secretKey: '', // 请填入您的Secret Key
    accessToken: '', // 这里会存储获取到的access_token
    tokenExpiresAt: null, // token过期时间
    apiUrl: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions_pro',
    model: 'ernie-4.5-turbo-vl' // 使用ERNIE 4.5 Turbo VL模型
  },
  
  // 豆包大模型配置
  doubao: {
    apiKey: 'f82c869f-7484-4aa7-8eac-c5ac08a4ff46', // 豆包API密钥
    apiUrl: 'https://ark.cn-beijing.volces.com/api/v3/responses',
    model: 'doubao-seed-1-6-flash-250828',
    enabled: true
  },
  
  // 其他AI服务配置
  google: {
    apiKey: '', // Google Gemini API密钥
    apiUrl: 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-lite:generateContent'
  },
  
  anthropic: {
    apiKey: '', // Anthropic Claude API密钥
    apiUrl: 'https://api.anthropic.com/v1/messages'
  },
  
  alibaba: {
    apiKey: '', // 阿里云通义千问API密钥
    apiUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'
  },
  
  tencent: {
    apiKey: '', // 腾讯混元大模型API密钥
    apiUrl: 'https://hunyuan.tencentcloudapi.com'
  }
};

// 获取百度文心一言的access token
async function getBaiduAccessToken() {
  const baiduConfig = apiConfig.baidu;
  
  // 检查token是否有效
  if (baiduConfig.accessToken && baiduConfig.tokenExpiresAt) {
    const now = new Date();
    // 如果token还有5分钟以上的有效期，直接返回
    if (now.getTime() < baiduConfig.tokenExpiresAt.getTime() - 5 * 60 * 1000) {
      return baiduConfig.accessToken;
    }
  }
  
  try {
    // 使用API Key和Secret Key获取新的access token
    // 注意：这里需要使用正确的百度云API接口
    const response = await axios.post(
      'https://aip.baidubce.com/oauth/2.0/token',
      {
        grant_type: 'client_credentials',
        client_id: baiduConfig.apiKey,
        client_secret: baiduConfig.secretKey
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000
      }
    );
    
    if (response.data && response.data.access_token) {
      baiduConfig.accessToken = response.data.access_token;
      baiduConfig.tokenExpiresAt = new Date(Date.now() + response.data.expires_in * 1000);
      return baiduConfig.accessToken;
    } else {
      throw new Error('Failed to get access token from Baidu API');
    }
  } catch (error) {
    console.error('Error getting Baidu access token:', error.message);
    // 如果获取失败，仍然使用apiKey作为临时解决方案
    baiduConfig.accessToken = baiduConfig.apiKey;
    baiduConfig.tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return baiduConfig.accessToken;
  }
}

// 导出配置和工具函数
export default apiConfig;
export { getBaiduAccessToken };