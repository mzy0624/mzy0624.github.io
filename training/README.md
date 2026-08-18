# Routing dataset

这套数据用于训练学术主页的两阶段路由器：

1. Gate model：判断问题是否能被当前准备好的开放式回答直接覆盖，输出 `in_scope` 或 `reject`。
2. Routing model：只对 `in_scope` 问题预测一个固定的 `answer_id`。

## 数据规模

- 总计：11,640 条
- 已知问题：3,640 条
  - 13 个 Label
  - 每个 Label 280 条
  - 每类同时包含英文和中文问法
- 拒答问题：8,000 条
  - 通用知识：1,400 条
  - 不支持的学术问题与近边界问题：1,800 条
  - 不相关任务请求：1,200 条
  - 推荐与实时信息：1,000 条
  - 个人助理任务：900 条
  - 缺少上下文或语义模糊：600 条
  - Prompt Injection：500 条
  - 噪声与乱码：600 条

对于当前 13 个已知 Label，这个规模足以训练第一版路由器。继续机械扩充模板的收益有限，下一阶段更值得加入真实访问中出现的误路由和 Hard Negative。

## 文件

- `routing-dataset/train.jsonl`：9,390 条
- `routing-dataset/validation.jsonl`：1,125 条
- `routing-dataset/test.jsonl`：1,125 条
- `routing-dataset/all.jsonl`：完整数据
- `routing-dataset/stats.json`：统计信息
- `../content/router/routing-evaluation-source.json`：独立评测语义组的可维护源文件
- `routing-evaluation/calibration.jsonl`：阈值校准集，400 条
- `routing-evaluation/test.jsonl`：最终测试集，400 条
- `routing-evaluation/all.jsonl`：完整独立评测集，800 条
- `routing-evaluation/stats.json`：评测集统计信息
- `../content/router/label-boundaries.json`：经过确认的 Label 语义边界
- `../content/router/question-bank.json`：用于相似度路由的人工审核问题库，与页面展示问题相互独立
- `../scripts/generate-routing-dataset.mjs`：可复现的数据生成器

重新生成：

```bash
npm run data:generate
```

重新生成独立评测集：

```bash
npm run evaluation:generate
```

重新生成问题库 Embedding 并校准相似度路由器：

```bash
npm run embedding:prepare
```

## JSONL 字段

每行是一条独立 JSON 记录：

```json
{
  "id": "train-00001",
  "text": "What are your research interests?",
  "language": "en",
  "gate_label": "in_scope",
  "route_label": "research",
  "answer_id": "research",
  "oos_category": null,
  "split": "train",
  "semantic_group": "known/research/en/0",
  "source": "template_augmented"
}
```

- `gate_label`：模型 1 的训练标签，取值为 `in_scope` 或 `reject`。
- `route_label`：模型 2 的训练标签；拒答样本为 `null`。
- `answer_id`：网页最终使用的回答编号；拒答样本固定为 `unknown`。
- `semantic_group`：同一基础语义的不同表达共享同一个 Group。
- `oos_category`：拒答样本的来源类别。
- `language`：`en`、`zh` 或无法归属自然语言的 `und`。

## 推荐训练方法

Gate model 不应直接按照文件中的原始比例组成 Batch。训练时使用分层采样：

```text
50% in_scope
50% reject
```

`reject` 的 50% 再在 8 个 OOS 类别之间采样，避免通用知识或乱码样本淹没更重要的 Hard Negative。

Routing model 只读取：

```text
gate_label == "in_scope"
```

并在 13 个 `route_label` 之间均衡采样。不要把 `unknown` 作为 Routing model 的额外类别。

`internship` 使用独立且无状态的占位回答：

```text
gate_label = "in_scope"
route_label = "internship"
answer_id = "internship"
answer = "NULL"
```

也就是说，它必须路由到 `internship`。首次和被采样为正常回答时返回 `NULL`，重复提问则进入与其他已知回答相同的重复回应流程。以后有实习经历时，只需替换该 Label 的回答内容。

## 切分原则

Train、Validation 和 Test 已经按照 `semantic_group` 切分。同一个基础问题生成的礼貌表达、长短变体和中英文内部改写不会跨集合出现。不要重新进行逐行随机切分，否则会产生明显的数据泄漏。

Validation 和 Test 保持 Unknown 占多数，用于模拟真实访问并校准 Gate 阈值。训练 Batch 则应通过 Sampler 保持 1:1。

## 数据边界

Yes/No 形式不再使用全局规则，而是服从各 Label 在 `../content/router/label-boundaries.json` 中定义的范围。例如：

- `Do you have any technical skills?` → `skills`
- `Have you published any papers?` → `papers`
- `Do you have any internship experience?` → `internship`
- `Are you a member of the LAMDA Group?` → `reject`

因此，不能仅根据句法形式决定是否拒答；必须判断问题是在询问某个 Label 的整体范围，还是在询问被排除的子问题或具体事实。

`unsupported_academic` 中包含两类重要负样本：

- 与主页主题相近，但当前没有对应固定回答的问题；
- 已从当前 Label 集合中删除的问题，例如导师、博士年级、研究组、姓名和所在大学等细分问题。

如果以后重新增加这些 Answer Label，需要同步移动相应样本并重新生成数据集。

当前数据主要由受控模板生成，适合初始化模型，但不能替代真实查询。上线后应持续收集经过隐私处理的误拒答和误路由问题，加入下一版本的训练集。

## 相似度路由问题库

`../content/router/question-bank.json` 覆盖 `../content/router/label-boundaries.json` 中定义的 Label。该问题库只包含英文问法，并覆盖多种表达风格：

- 直接提问
- 祈使表达
- 礼貌请求
- 对话式表达
- 带上下文的表达
- 简短片段
- 口语表达

问题库中的每条问题都有全局唯一 ID；忽略大小写、标点和空白后，问题文本也保持全局唯一。每类问题只覆盖对应边界允许的整体语义，不主动吸收该 Label 明确排除的细分问题。

未来实现相似度路由时，应从每个 Label 的问题库选择表达方式尽可能不同的 Prototype，再计算用户输入与各 Label Prototype 的相似度。最高分仍低于校准阈值时路由到 `unknown`；`unknown` 本身不建立正样本问题库。

独立评测集的组成、字段、切分和推荐指标详见 `EVALUATION.md`。阈值只能使用 `calibration.jsonl` 选择；`test.jsonl` 留作最终报告，不能反复用于调参。

第一版浏览器 Embedding 路由器的模型、缓存、阈值和回退流程详见 `EMBEDDING_ROUTER.md`。
