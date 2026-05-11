# EV视频

类似抖音/TikTok 的短视频聚合站，支持 Vercel 一键部署。

## 功能
- PC 三栏专业布局
- 移动端竖屏全屏滑动
- 动态模糊背景
- 自动播放、静音、全屏、点赞
- 鼠标滚轮切换
- 键盘控制：↑↓ 切换，空格暂停，M静音，F全屏
- Serverless API 代理解析 YuJn 接口
- 18+ 进入确认
- 本地观看历史

## 本地运行
```bash
npm install
npm run dev
```

## 部署 Vercel
```bash
npm i -g vercel
vercel
```

## 接口说明
`/api/video?category=recommend`

分类：recommend, hot, dance, fashion, scenery, anime, handsome, random
