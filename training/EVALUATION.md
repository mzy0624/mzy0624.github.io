# 路由评测集

这是一套由 Assistant 编写、按照人工边界审查方式构造的独立英文评测集。它不是人工受试者采集的数据，也不应被并入问题库、训练集或 Prototype 集合。

## 设计原则

评测集同时覆盖三种情况：

1. `positive`：属于 13 个已知 Label 的整体语义。
2. `hard_negative`：与某个 Label 很接近，但位于该 Label 的明确边界之外。它的正确结果可能是 `unknown`，也可能是另一个已知 Label。
3. `broad_unknown`：通用知识、工具请求、实时信息、个人助理任务、Prompt Injection、闲聊和缺少上下文的问题。

这种设计参考了开放意图识别中同时评估 in-scope 与 out-of-scope 输入的做法，以及对贴近已知意图的 hard-negative OOS 数据进行单独检查的思路：

- [An Evaluation Dataset for Intent Classification and Out-of-Scope Prediction](https://aclanthology.org/D19-1131/)
- [Generating Hard-Negative Out-of-Scope Data with ChatGPT for Intent Classification](https://aclanthology.org/2024.lrec-main.674/)

公开论文只用于设计评测类别；本项目没有复制其数据样本。

## 数据规模

- 400 个独立语义组
- 每组两种表达：`clean` 与 `conversational`
- 共 800 条评测记录
- 416 条 `positive`
- 260 条 `hard_negative`
- 124 条 `broad_unknown`

所有 13 个 Label 都有 16 个独立正样本语义组，即每类 32 条正样本记录。跨 Label 的 hard negative 会使用其真正的目标 Label，而不会被错误标成 `unknown`。

## 切分

- `routing-evaluation/calibration.jsonl`：400 条，只用于选择相似度阈值、Prototype 数量及聚合方法。
- `routing-evaluation/test.jsonl`：400 条，只用于最终评测。
- `routing-evaluation/all.jsonl`：两者的合集。

切分以 `semantic_group` 为单位。同一语义的 clean 和 conversational 表达永远处于同一个集合，不会产生跨集合泄漏。

## 字段

```json
{
  "id": "eval-positive-research-001-clean",
  "text": "At the highest level, which areas define your research program?",
  "language": "en",
  "expected_label": "research",
  "expected_gate_label": "in_scope",
  "expected_route_label": "research",
  "expected_answer_id": "research",
  "category": "positive",
  "boundary_label": "research",
  "variant": "clean",
  "semantic_group": "positive/research/001",
  "split": "calibration",
  "source": "assistant_authored"
}
```

- `expected_label`：最终应该得到的 Label，包括 `unknown`。
- `boundary_label`：该问题用于检验哪一个 Label 的边界；普通 broad unknown 为 `null`。
- `category`：`positive`、`hard_negative` 或 `broad_unknown`。
- `variant`：同一语义组的表达版本。
- `semantic_group`：防止相同语义跨集合泄漏的分组编号。

## 推荐指标

至少报告以下结果：

- Overall Accuracy
- 13 个已知 Label 的 Macro-F1
- `unknown` Precision、Recall 和 F1
- `hard_negative` Accuracy
- 跨 Label hard negative Accuracy
- clean 与 conversational 分组 Accuracy
- 每个 Label 的 Recall 和完整 Confusion Matrix

只看 Overall Accuracy 会掩盖两类严重错误：把 unknown 强行路由到已知回答，以及把相近的已知 Label 相互混淆。

## 生成与验证

维护问题时修改 `../content/router/routing-evaluation-source.json`，然后运行：

```bash
npm run evaluation:generate
npm test
```

生成器和测试会检查：

- 13 个 Label 的覆盖与配额
- ID 和归一化文本全局唯一
- 与 570 条问题库 Prototype 无精确文本泄漏
- 与原有路由训练集无精确文本泄漏
- calibration/test 按语义组隔离
- Label、Gate、Answer 和边界字段相互一致
