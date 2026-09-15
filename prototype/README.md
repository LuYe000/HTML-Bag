# 文档拆分与重组原型源码

## 目录

```text
prototype/
├── index.html                 页面结构和应用入口
├── src/
│   ├── app.js                 页面交互、PDF解析、分类聚合、导出逻辑
│   └── styles.css             界面样式
├── vendor/
│   ├── lucide.min.js          图标库
│   ├── pdf-lib.min.js         PDF读取、拆分与生成
│   ├── jszip.min.js           ZIP导出
│   └── pdfjs/                 PDF文本提取与页面解析
├── assets/samples/            三个可操作示例PDF
├── build/
│   ├── build-self-contained.mjs  构建单文件HTML
│   └── serve.mjs                 本地开发服务器
└── package.json
```

## 运行源码

```bash
cd prototype
npm run dev
```

浏览器打开终端输出的地址。源码模式通过本地HTTP服务运行，用于加载PDF.js模块和示例PDF。

## 构建单文件版本

```bash
cd prototype
npm run build
```

构建产物：

- `prototype/dist/index.html`
- 项目根目录的 `文档拆分与重组原型.html`

单文件构建会把样式、业务代码、图标库、PDF库和示例PDF全部内嵌，可以直接交付。

## 主要能力

- 真实读取上传的PDF页数和文本。
- 按照文档类型的关键词、排除词、正则和阈值分类页面。
- 按实例键和连续页面关系聚合文档实例。
- 按照模板Slot校验材料顺序、份数和页码范围。
- 人工拆分、合并、改类型、保留未知材料。
- 真实生成独立PDF、ZIP和manifest。
