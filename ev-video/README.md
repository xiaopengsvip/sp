# EV视频 Final Pro

完整优化版：PC / 移动端自动适配、清屏/放大缩小动画、右侧推荐不空白、侧边栏去重、缓存预加载、Vercel Serverless API 代理。

## 本地运行

```bash
npm install
npm run dev
```

## Vercel 部署

```bash
npm install
npm run build
vercel
```

Vercel 设置：

- Framework Preset: Vite
- Build Command: npm run build
- Output Directory: dist
- Install Command: npm install

## 主要功能

- PC：左侧导航 + 中间播放器 + 右侧连续推荐
- 移动端：全屏短视频沉浸式播放
- 自动识别设备，也支持手动切换 PC / Mobile / Auto
- 右侧推荐先读缓存，再后台更新，避免空白等待
- 自动预加载下一批视频，剩余不足自动补货
- 清屏播放：侧栏/右栏滑出，播放器铺满，支持 C / ESC 退出
- 放大缩小：影院模式弹性过渡，缩回恢复正常浏览布局
- 操作动画：播放/暂停居中动画、按钮发光、缩放反馈
- 收藏、历史、设置、发现、热门、推荐均已打通
