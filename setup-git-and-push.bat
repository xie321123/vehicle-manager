@echo off
chcp 65001 >nul
title Git安装与代码推送工具

echo ============================================
echo   Git安装 + 代码推送到 GitHub
echo ============================================
echo.
echo 请确保：
echo  1. 右键以 "管理员身份运行" 本脚本
echo  2. GitHub 仓库已创建（不要勾选任何选项）
echo  3. 仓库地址：https://github.com/xie321123/vehicle-manager
echo.
pause
echo.
echo [步骤 1/4] 安装 Git...
choco install git.install -y --params "'/GitAndUnixToolsOnPath /NoAutoCrlf'" || (
    echo Git安装失败，请手动下载安装
    echo 下载地址: https://git-scm.com/download/win
    pause
    exit /b 1
)
echo.
echo [步骤 2/4] 配置 Git 用户信息...
git config --global user.name "xie321123"
git config --global user.email "1024428613@qq.com"
echo.
echo [步骤 3/4] 初始化仓库并提交代码...
cd /d "C:\Users\Administrator\Documents\中文对话项目"
git init
git add .
git commit -m "初始化车辆数据管理助手项目"
echo.
echo [步骤 4/4] 推送到 GitHub...
git remote add origin https://github.com/xie321123/vehicle-manager.git
git branch -M main
git push -u origin main && (
    echo.
    echo ============================================
    echo  推送成功！
    echo.
    echo  下一步：登录 https://dashboard.render.com
    echo  点击 New + -^> Blueprint -^> 选择 vehicle-manager 仓库
    echo  Render 会自动部署后端服务
    echo.
    echo  部署完成后：
    echo  打开 GitHub 仓库 -^> Actions -^> Run workflow -^> 构建 APK
    echo ============================================
) || (
    echo.
    echo  推送失败！
    echo  可能原因：
    echo   1. 仓库尚未在 GitHub 上创建
    echo   2. 需要输入 GitHub 用户名和密码（个人访问令牌）
    echo.
    echo  如果提示输入密码，请在以下地址生成令牌：
    echo  https://github.com/settings/tokens
    echo  选择 repo 权限，生成后复制粘贴到密码输入框
    echo ============================================
)
echo.
pause
