# Zi-Yu Mao Academic Agent

一个从零实现的 Agent 风格个人学术主页。页面本身是静态网站，不调用 LLM API；自由输入通过浏览器内运行的轻量 embedding 模型路由到固定回答。

## 开发与构建

```bash
npm install
npm run dev
```

```bash
npm test
npm run build
```

项目使用相对资源路径，生产产物位于 `dist/`，可部署到 GitHub Pages 或其他静态服务器。

## 当前交互流程

- 点击 `Try asking` 或回答下方的问题时，页面直接使用该问题对应的 label，不运行模型。
- 手动输入问题时，页面首次显示本地路由器加载提示，随后由浏览器中的 `Xenova/all-MiniLM-L6-v2` 生成 embedding。
- 输入向量与预先生成的问题库向量比较；分数低于校准阈值时路由到 `unknown`。
- label 只决定回答编号。一个 label 可以包含多种问题表达，同一个回答编号也可以包含多个回答变体和独立的重复计数。
- 所有答案均来自本地固定数据，并通过 Agent API 以 token 或结构化 block 事件输出。

模型、WASM、问题库向量和阈值配置均位于 `public/`。路由数据与评测材料位于 `training/`。

## 添加论文

日常维护推荐使用独立的交互式 CLI：

```bash
npm run publication:manage
```

它支持查看、新增、编辑和删除论文，也可以直接调用子命令：

```bash
npm run publication:manage -- list
npm run publication:manage -- add
npm run publication:manage -- edit rncme
npm run publication:manage -- remove rncme
```

管理器会维护论文类型、标题、作者顺序、第一作者/共同一作、完整发表信息、会议或期刊缩写与官方链接、TL;DR，以及可选的 PDF、Code、Poster 和 Bib。论文类型使用 `preprint`、`conference` 或 `journal`，页面会据此归入 Preprint、Conference Paper 或 Journal Paper。资源既可填写 `http(s)` 链接，也可提供本地文件路径；本地文件会被复制到论文资源目录。编辑和删除前会在 `publication-backups/` 中创建可恢复备份，删除还必须再次输入论文 ID 确认。

如需从准备好的材料目录一次性导入，仍可使用下面的 manifest 流程。

复制 `scripts/publication.template.json` 到新的论文材料目录，将其改名为 `publication.json` 并填写元数据。可选本地材料使用固定文件名：

```text
paper.pdf
code.zip
poster.png
citation.bib
```

预检和正式添加：

```bash
npm run publication:add -- /path/to/publication-folder --dry-run
npm run publication:add -- /path/to/publication-folder
```

脚本会校验数据，将材料复制到 `public/assets/publications/<id>/`，并把新论文插入 `src/data/publications.json` 首位。缺失的本地材料会被忽略，对应按钮不会出现。

`publications.json` 不记录本地材料路径。外部资源可以在 `resources` 中设置 `pdf`、`code`、`poster`、`bib` 或 `official` 的 `http(s)` URL；外部设置优先于同名本地文件。

`authors` 按署名顺序填写，`firstAuthorCount` 表示从第一位开始共有几位第一作者。页面会自动加粗第一作者、给 `Zi-Yu Mao` 加下划线，并在共同一作时添加 `* Equal contribution.`。

`venue` 只填写完整发表信息，不要包含开头的 `In:`。页面会为会议和期刊论文自动添加非斜体的 `In:`，预印本则不会添加。

`summary` 会显示在 TL;DR 按钮的悬浮提示中；当 `resources.official` 存在时，`venueShort` 会作为操作区最后一个会议按钮并链接到官方页面。

## 目录结构

```text
src/
├── api/
│   ├── academic-agent.js       # 会话、重复回答与流式事件 API
│   ├── dom.js                  # DOM 构建工具
│   └── typing-speed.js         # 按回答长度计算输出速度
├── components/                 # 页头、侧边栏、对话、输入框与答案视图
├── data/
│   ├── intents.js              # labels、固定回答与重复回答
│   ├── label-questions.js      # 每个 label 的代表性问题
│   ├── profile.js              # 结构化个人资料
│   ├── publications.json       # 论文元数据
│   └── suggestion-placements.js# Try asking 与回答后问题的展示位置
├── models/
│   ├── intent-model.js         # 路由模型接口
│   ├── embedding-intent-model.js
│   ├── embedding-worker.js     # 浏览器 Worker 中的本地推理
│   └── deterministic-intent-model.js # 模型不可用时的后备路由器
├── app.js                      # 页面与多会话状态编排
├── main.js                     # 应用入口
└── styles/
    ├── main.css                # 全平台完全一致的基础样式
    ├── desktop.css             # 桌面端专属值与布局
    └── mobile.css              # 平板和手机端专属值与布局

training/                       # 问题库、边界、训练集与独立评测集
scripts/                        # 数据生成、阈值校准与论文维护脚本
public/                         # 发布时原样复制的模型和静态资源
```

## Agent API

`AcademicAgent` 不依赖具体页面组件，通过异步事件流输出结果：

```js
for await (const event of agent.ask('Tell me about your research.')) {
  // loading-start | loading-end | thinking-start | thinking-end
  // token | blocks
  // emphasis-list-* | image-start | image-progress | image | done
}
```

点击已知问题时可将 label 作为第二个参数传入，从而跳过模型路由：

```js
agent.ask('How about your publications?', 'papers');
```

## 增加或修改 label

1. 在 `src/data/intents.js` 定义 label 与固定回答。
2. 在 `src/data/label-questions.js` 维护同义问题。
3. 在 `src/data/suggestion-placements.js` 决定它是否出现在 `Try asking` 或其他回答下方。
4. 若需要新的结构化输出，在 `src/components/answers.js` 增加 block renderer。
5. 在 `training/label-boundaries.json` 更新语义边界，并重新生成问题库、embedding 与评测配置。
6. 为新行为补充测试，再运行完整测试与构建。

常用数据命令：

```bash
npm run data:generate
npm run evaluation:generate
npm run embedding:prepare
```
