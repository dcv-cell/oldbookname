# 发布脚本
Write-Host "=== 开始发布项目 ===" -ForegroundColor Green

# 1. 构建项目
Write-Host "=== 构建项目 ===" -ForegroundColor Cyan
npm run build

# 2. 检查构建结果
if (-Not (Test-Path -Path "dist")) {
    Write-Host "构建失败：dist目录不存在" -ForegroundColor Red
    exit 1
}

Write-Host "构建成功！" -ForegroundColor Green

# 3. 提交代码
Write-Host "=== 提交代码 ===" -ForegroundColor Cyan
git add .
git commit -m "更新项目" --allow-empty

# 4. 推送代码到GitHub
Write-Host "=== 推送代码到GitHub ===" -ForegroundColor Cyan
git push origin main

Write-Host "=== 发布完成 ===" -ForegroundColor Green
Write-Host "项目已成功推送到GitHub，GitHub Actions将自动部署到GitHub Pages" -ForegroundColor Green
Write-Host "访问地址：https://253480139.github.io/oldbookname/" -ForegroundColor Yellow
Write-Host "部署通常需要1-2分钟完成，请耐心等待" -ForegroundColor Gray
