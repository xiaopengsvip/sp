# 星海短视频 Vercel 版

基于 YuJn API 目录做的类抖音竖屏短视频站，可直接部署到 Vercel。

## 本地运行

```bash
npm install
npm run dev
```

## 部署

```bash
npm i -g vercel
vercel
```

## 文件说明

- `index.html`：页面入口
- `style.css`：移动端/PC 自适应样式
- `app.js`：滑动播放、分类切换、点赞、静音、自动加载
- `api/catalog.js`：接口分类列表
- `api/sources.js`：前端分类接口
- `api/video.js`：Vercel Serverless 代理，自动解析接口真实视频地址并 302 跳转

## 调整接口

编辑 `api/catalog.js`，新增类似：

```js
{ id: '261', name: '推荐', title: '小姐姐随机视频', type: 'video', adult: true }
```

`id` 对应 YuJn 接口详情页里的 `id`。
