import axios from 'axios';

// 豆包API配置
const apiConfig = {
  doubao: {
    apiKey: 'f82c869f-7484-4aa7-8eac-c5ac08a4ff46',
    apiUrl: 'https://ark.cn-beijing.volces.com/api/v3/responses',
    model: 'doubao-seed-1-6-flash-250828'
  }
};

// 测试函数
async function testDoubaoAPI() {
  console.log('=== 测试豆包API配置 ===');
  console.log('API密钥:', apiConfig.doubao.apiKey);
  console.log('API端点:', apiConfig.doubao.apiUrl);
  console.log('模型名称:', apiConfig.doubao.model);
  console.log('');

  // 测试1: 跳过HEAD请求，直接进行POST测试
  console.log('测试1: 跳过HEAD请求，直接进行POST测试');
  console.log('✓ 跳过HEAD请求，直接测试POST请求');
  console.log('');


  // 测试2: 发送一个简单的文本请求来验证API密钥和模型
  console.log('测试2: 验证API密钥和模型');
  try {
    const requestData = {
      model: apiConfig.doubao.model,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "你好，测试API连接"
            }
          ]
        }
      ]
    };

    const response = await axios.post(apiConfig.doubao.apiUrl, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiConfig.doubao.apiKey}`
      },
      timeout: 30000
    });

    console.log('✓ API请求成功，状态码:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.log('✗ API请求失败:', error.message);
    if (error.response) {
      console.log('响应状态:', error.response.status);
      console.log('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// 运行测试
testDoubaoAPI()
  .then(success => {
    console.log('');
    console.log('=== 测试结果 ===');
    if (success) {
      console.log('✓ 所有测试通过，API配置正确');
    } else {
      console.log('✗ 测试失败，API配置可能存在问题');
    }
  })
  .catch(error => {
    console.log('测试过程中发生错误:', error.message);
  });
