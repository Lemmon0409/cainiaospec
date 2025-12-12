#!/bin/bash

# OpenSpec 增强版 - 一键推送到远程仓库脚本

set -e  # 遇到错误立即退出

echo "🚀 OpenSpec 增强版 - Git 推送助手"
echo "================================"
echo ""

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在 OpenSpec 项目根目录下运行此脚本"
    exit 1
fi

# 检查是否有 commit
if ! git log --oneline -1 &>/dev/null; then
    echo "❌ 错误：没有找到 git commit"
    exit 1
fi

echo "📝 请选择远程仓库类型："
echo "1) GitHub"
echo "2) GitLab"
echo "3) 其他"
read -p "请输入选项 (1/2/3): " repo_type

echo ""
read -p "🔗 请输入你的远程仓库地址 (例如: https://github.com/username/openspec-enhanced.git): " repo_url

if [ -z "$repo_url" ]; then
    echo "❌ 错误：仓库地址不能为空"
    exit 1
fi

echo ""
echo "📦 当前远程仓库配置："
git remote -v

echo ""
read -p "是否继续？将会重命名 origin 为 upstream (y/n): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "❌ 已取消"
    exit 0
fi

echo ""
echo "🔄 配置远程仓库..."

# 检查是否已有 origin
if git remote | grep -q "^origin$"; then
    # 检查是否已有 upstream
    if git remote | grep -q "^upstream$"; then
        echo "⚠️  upstream 已存在，删除旧的 origin"
        git remote remove origin
    else
        echo "📝 重命名 origin -> upstream"
        git remote rename origin upstream
    fi
fi

# 添加新的 origin
echo "➕ 添加新的远程仓库: $repo_url"
git remote add origin "$repo_url"

echo ""
echo "✅ 远程仓库配置完成："
git remote -v

echo ""
echo "📤 推送代码到远程仓库..."

# 推送增强版分支
current_branch=$(git branch --show-current)
echo "📌 当前分支: $current_branch"

read -p "推送当前分支 $current_branch 到远程？(y/n): " push_confirm

if [ "$push_confirm" = "y" ] || [ "$push_confirm" = "Y" ]; then
    echo "📤 推送分支: $current_branch"
    git push -u origin "$current_branch"
    echo "✅ 分支 $current_branch 推送成功！"
else
    echo "⏭️  跳过推送"
fi

echo ""
read -p "是否也推送 main 分支？(y/n): " push_main

if [ "$push_main" = "y" ] || [ "$push_main" = "Y" ]; then
    echo "📤 切换到 main 分支..."
    git checkout main
    echo "📤 推送 main 分支..."
    git push -u origin main
    echo "✅ main 分支推送成功！"
    
    # 切回原分支
    git checkout "$current_branch"
    echo "📌 已切回分支: $current_branch"
fi

echo ""
echo "🎉 全部完成！"
echo ""
echo "📋 接下来的步骤："
echo "1. 将仓库地址发给同事: $repo_url"
echo "2. 同事克隆仓库:"
echo "   git clone $repo_url"
echo "   cd $(basename $repo_url .git)"
echo "   git checkout $current_branch"
echo "   npm install && npm run build && npm link"
echo ""
echo "3. 查看详细安装文档: GIT_SETUP.md"
echo ""
echo "🔗 仓库地址: $repo_url"
