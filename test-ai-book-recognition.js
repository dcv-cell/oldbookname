import aiImageService from './src/services/aiImageService.js';

// 测试图书封面图像URL
const testBookImageUrl = 'https://ark-project.tos-cn-beijing.volces.com/doc_image/ark_demo_img_1.png'; // 豆包API示例图片

async function testAIBookInfoRecognition() {
  console.log('=== 测试AI图书信息识别功能（真实图书封面）===');
  try {
    console.log('正在识别图书信息...');
    const result = await aiImageService.recognizeBookInfo(testBookImageUrl);
    console.log('✓ 图书信息识别成功:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.log('✗ 图书信息识别失败:', error.message);
  }
}

async function runTest() {
  console.log('开始测试AI图书信息识别...');
  await testAIBookInfoRecognition();
  console.log('\n测试完成！');
}

runTest();
