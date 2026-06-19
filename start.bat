@echo off
chcp 65001 >nul
title 车辆数据管理助手

echo ============================================
echo    车辆数据管理助手 - 启动中...
echo ============================================
echo.

REM 检查后端依赖
if not exist "backend\node_modules" (
    echo [1/3] 安装后端依赖...
    cd backend
    call npm install
    cd ..
)

REM 初始化数据库
echo [1/3] 初始化数据库...
cd backend
node src\seed.js
cd ..

REM 检查前端依赖
if not exist "frontend\node_modules" (
    echo [2/3] 安装前端依赖...
    cd frontend
    call npm install
    cd ..
)

REM 构建前端
if not exist "frontend\dist" (
    echo [3/3] 构建前端...
    cd frontend
    call npx vite build
    cd ..
)

echo.
echo ============================================
echo  启动后端服务...
echo ============================================
echo.
echo  APP地址: http://localhost:3001
echo  API地址: http://localhost:3001/api
echo.
echo  默认超级管理员账户:
echo    用户名: admin
echo    密码:   admin123
echo.
echo  ============================================
echo  按 Ctrl+C 停止服务
echo  ============================================
echo.

cd backend
node src\index.js
pause
