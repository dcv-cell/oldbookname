import aiImageService from './src/services/aiImageService.js';

// 测试图像URL（使用示例图像）
const testImageUrl = 'https://ark-project.tos-cn-beijing.volces.com/doc_image/ark_demo_img_1.png';

async function testAIISBNRecognition() {
  console.log('=== 测试AI ISBN识别功能 ===');
  try {
    const result = await aiImageService.recognizeISBN(testImageUrl);
    console.log('✓ ISBN识别成功:', result);
  } catch (error) {
    console.log('✗ ISBN识别失败:', error.message);
  }
}

async function testAIBookInfoRecognition() {
  console.log('\n=== 测试AI图书信息识别功能 ===');
  try {
    const result = await aiImageService.recognizeBookInfo(testImageUrl);
    console.log('✓ 图书信息识别成功:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.log('✗ 图书信息识别失败:', error.message);
  }
}

async function runAllTests() {
  console.log('开始测试AI服务...');
  await testAIISBNRecognition();
  await testAIBookInfoRecognition();
  console.log('\n测试完成！');
}

runAllTests();
