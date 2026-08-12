# 第一版 Embedding 路由器

## 运行流程

快捷问题和自由输入使用两条不同路径：

```text
Try Asking / 回答下方问题
  -> 携带已知 Label ID
  -> 直接取得对应 Answer
  -> 不加载模型，不显示 Thinking

手动输入
  -> 显示 Thinking
  -> 在 Web Worker 中计算输入 Embedding
  -> 与 570 个问题库 Prototype 比较
  -> 每个 Label 取 Top-5 相似度均值
  -> 最高分 >= 0.544：进入该 Label
  -> 最高分 < 0.544：进入 unknown
  -> 模型不可用：回退到原确定性路由器
```

## 模型

- 模型：`Xenova/all-MiniLM-L6-v2`
- 量化：Q8 ONNX
- 向量维度：384
- Pooling：Mean Pooling
- 归一化：L2 Normalize
- 推理位置：浏览器 Web Worker
- 执行后端：ONNX Runtime Web / WASM

`all-MiniLM-L6-v2` 用于把句子映射到可用于语义搜索和相似度比较的 384 维向量。浏览器实现遵循 Transformers.js 的 Feature Extraction Pipeline，使用 `pooling: "mean"` 和 `normalize: true`。

- https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2
- https://huggingface.co/Xenova/all-MiniLM-L6-v2
- https://huggingface.co/docs/transformers.js/main/pipelines

## 静态部署

模型和 Tokenizer 放在 `public/models/Xenova/all-MiniLM-L6-v2/`，WASM Runtime 放在 `public/wasm/`，均由 GitHub Pages 与主页同源提供，不依赖运行时访问 Hugging Face。量化模型约 23 MB，WASM Runtime 约 11 MB，只会在用户第一次手动输入问题时加载。点击现成问题不会下载这些资源。

模型推理在独立 Worker 中进行，因此初始化和推理不会冻结主页面动画。GitHub Pages 无法提供 WebAssembly 多线程需要的 Cross-Origin Isolation Header，所以 Worker 内固定使用单线程 WASM；页面主线程仍保持可交互。

570 条 Prototype 的向量已提前计算并存放为：

- `public/data/question-bank-embeddings.bin`
- `public/data/question-bank-embeddings.json`

浏览器不需要在每次打开页面时重新编码整个问题库，只需要编码当前用户输入。

## 校准结果

校准过程只读取 `routing-evaluation/calibration.jsonl`。候选聚合方法包括最大相似度和 Top-K 均值；候选阈值以 0.001 为步长搜索。考虑到真实访问中 unknown 更常见，选择条件为：

```text
Unknown Recall >= 0.75 的前提下最大化 Macro-F1
```

最终配置：

```json
{
  "threshold": 0.544,
  "scoring": {
    "aggregation": "top_k_mean",
    "topK": 5
  }
}
```

Calibration：

- Accuracy：0.835
- Macro-F1：0.856
- Known Macro-F1：0.859
- Unknown Recall：0.750
- Unknown F1：0.813

配置冻结后，在未参与调参的 Test 集上评测：

- Accuracy：0.860
- Macro-F1：0.878
- Known Macro-F1：0.881
- Unknown Precision：0.956
- Unknown Recall：0.736
- Unknown F1：0.832
- 跨 Label Hard Negative Accuracy：0.929

完整结果位于：

- `routing-evaluation/embedding-calibration-report.json`
- `routing-evaluation/embedding-test-report.json`

## 重新生成

问题库发生变化后运行：

```bash
npm run embedding:prepare
npm test
```

第一条命令会重新计算所有 Prototype Embedding、搜索 calibration 阈值、更新浏览器运行配置，并使用冻结后的配置重新生成 Test 报告。
