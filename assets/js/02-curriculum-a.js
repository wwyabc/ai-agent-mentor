/* =========================================================================
 * 课程数据 A：Phase 00 - 04
 * 数据来源：github.com/rohitg00/ai-engineering-from-scratch  README "Contents"
 * 字段：编号 | 英文标题 | 中文标题 | 类型 | 语言 | 仓库目录名
 * ========================================================================= */
(function (AAM) {
  'use strict';

  AAM.phase({
    id: '00', slug: '00-setup-and-tooling', en: 'Setup & Tooling', zh: '环境搭建与工具链',
    tag: 'foundation',
    desc: '把环境准备好，后面所有阶段都跑在这一层之上。',
    lessons: `01|Dev Environment|开发环境|Build|Python|01-dev-environment
02|Git & Collaboration|Git 与协作|Learn|—|02-git-and-collaboration
03|GPU Setup & Cloud|GPU 与云环境|Build|Python|03-gpu-setup-and-cloud
04|APIs & Keys|API 与密钥管理|Build|Python|04-apis-and-keys
05|Jupyter Notebooks|Jupyter 笔记本|Build|Python|05-jupyter-notebooks
06|Python Environments|Python 虚拟环境|Build|Shell|06-python-environments
07|Docker for AI|面向 AI 的 Docker|Build|Docker|07-docker-for-ai
08|Editor Setup|编辑器配置|Build|—|08-editor-setup
09|Data Management|数据管理|Build|Python|09-data-management
10|Terminal & Shell|终端与 Shell|Learn|—|10-terminal-and-shell
11|Linux for AI|AI 工程师的 Linux|Learn|—|11-linux-for-ai
12|Debugging & Profiling|调试与性能分析|Build|Python|12-debugging-and-profiling
13|Python for AI Engineering|AI 工程中的 Python|Build|Python|13-python-for-ai-engineering`
  });

  AAM.phase({
    id: '01', slug: '01-math-foundations', en: 'Math Foundations', zh: '数学基础',
    tag: 'foundation',
    desc: '用代码理解每一个 AI 算法背后的直觉。',
    lessons: `01|Linear Algebra Intuition|线性代数直觉|Learn|Python, Julia|01-linear-algebra-intuition
02|Vectors, Matrices & Operations|向量、矩阵与运算|Build|Python, Julia|02-vectors-matrices-operations
03|Matrix Transformations & Eigenvalues|矩阵变换与特征值|Build|Python, Julia|03-matrix-transformations
04|Calculus for ML: Derivatives & Gradients|微积分：导数与梯度|Learn|Python|04-calculus-for-ml
05|Chain Rule & Automatic Differentiation|链式法则与自动微分|Build|Python|05-chain-rule-and-autodiff
06|Probability & Distributions|概率与分布|Learn|Python|06-probability-and-distributions
07|Bayes' Theorem & Statistical Thinking|贝叶斯定理与统计思维|Build|Python|07-bayes-theorem
08|Optimization: Gradient Descent Family|优化：梯度下降家族|Build|Python|08-optimization
09|Information Theory: Entropy, KL Divergence|信息论：熵与 KL 散度|Learn|Python|09-information-theory
10|Dimensionality Reduction: PCA, t-SNE, UMAP|降维：PCA、t-SNE、UMAP|Build|Python|10-dimensionality-reduction
11|Singular Value Decomposition|奇异值分解 SVD|Build|Python, Julia|11-singular-value-decomposition
12|Tensor Operations|张量运算|Build|Python|12-tensor-operations
13|Numerical Stability|数值稳定性|Build|Python|13-numerical-stability
14|Norms & Distances|范数与距离|Build|Python|14-norms-and-distances
15|Statistics for ML|机器学习统计学|Build|Python|15-statistics-for-ml
16|Sampling Methods|采样方法|Build|Python|16-sampling-methods
17|Linear Systems|线性方程组|Build|Python|17-linear-systems
18|Convex Optimization|凸优化|Build|Python|18-convex-optimization
19|Complex Numbers for AI|复数与 AI|Learn|Python|19-complex-numbers
20|The Fourier Transform|傅里叶变换|Build|Python|20-fourier-transform
21|Graph Theory for ML|图论与机器学习|Build|Python|21-graph-theory
22|Stochastic Processes|随机过程|Learn|Python|22-stochastic-processes`
  });

  AAM.phase({
    id: '02', slug: '02-ml-fundamentals', en: 'ML Fundamentals', zh: '机器学习基础',
    tag: 'foundation',
    desc: '经典机器学习——至今仍是大多数生产 AI 系统的骨架。',
    lessons: `01|What Is Machine Learning|什么是机器学习|Learn|Python|01-what-is-machine-learning
02|Linear Regression from Scratch|从零实现线性回归|Build|Python|02-linear-regression
03|Logistic Regression & Classification|逻辑回归与分类|Build|Python|03-logistic-regression
04|Decision Trees & Random Forests|决策树与随机森林|Build|Python|04-decision-trees
05|Support Vector Machines|支持向量机|Build|Python|05-support-vector-machines
06|KNN & Distance Metrics|KNN 与距离度量|Build|Python|06-knn-and-distances
07|Unsupervised Learning: K-Means, DBSCAN|无监督学习：K-Means、DBSCAN|Build|Python|07-unsupervised-learning
08|Feature Engineering & Selection|特征工程与选择|Build|Python|08-feature-engineering
09|Model Evaluation: Metrics, Cross-Validation|模型评估：指标与交叉验证|Build|Python|09-model-evaluation
10|Bias, Variance & the Learning Curve|偏差、方差与学习曲线|Learn|Python|10-bias-variance
11|Ensemble Methods: Boosting, Bagging, Stacking|集成方法：Boosting、Bagging、Stacking|Build|Python|11-ensemble-methods
12|Hyperparameter Tuning|超参数调优|Build|Python|12-hyperparameter-tuning
13|ML Pipelines & Experiment Tracking|ML 流水线与实验追踪|Build|Python|13-ml-pipelines
14|Naive Bayes|朴素贝叶斯|Build|Python|14-naive-bayes
15|Time Series Fundamentals|时间序列基础|Build|Python|15-time-series
16|Anomaly Detection|异常检测|Build|Python|16-anomaly-detection
17|Handling Imbalanced Data|处理数据不平衡|Build|Python|17-imbalanced-data
18|Feature Selection|特征选择|Build|Python|18-feature-selection
19|ML System Design|从问题到上线模型的系统设计|Build|Python|19-ml-system-design
20|Monitoring Models in Production|生产监控：数据漂移与概念漂移|Build|Python|20-model-monitoring-and-drift
21|Feature Stores and Training-Serving Skew|特征平台与训练/ serving 偏斜|Build|Python|21-feature-stores-and-training-serving-skew`
  });

  AAM.phase({
    id: '03', slug: '03-deep-learning-core', en: 'Deep Learning Core', zh: '深度学习核心',
    tag: 'foundation',
    desc: '从第一性原理构建神经网络，在造出自己的框架之前不碰现成框架。',
    lessons: `01|The Perceptron: Where It All Started|感知机：一切的开始|Build|Python|01-the-perceptron
02|Multi-Layer Networks & Forward Pass|多层网络与前向传播|Build|Python|02-multi-layer-networks
03|Backpropagation from Scratch|从零实现反向传播|Build|Python|03-backpropagation
04|Activation Functions: ReLU, Sigmoid, GELU|激活函数：ReLU、Sigmoid、GELU|Build|Python|04-activation-functions
05|Loss Functions: MSE, Cross-Entropy, Contrastive|损失函数：MSE、交叉熵、对比损失|Build|Python|05-loss-functions
06|Optimizers: SGD, Momentum, Adam, AdamW|优化器：SGD、Momentum、Adam、AdamW|Build|Python|06-optimizers
07|Regularization: Dropout, Weight Decay, BatchNorm|正则化：Dropout、权重衰减、BatchNorm|Build|Python|07-regularization
08|Weight Initialization & Training Stability|权重初始化与训练稳定性|Build|Python|08-weight-initialization
09|Learning Rate Schedules & Warmup|学习率调度与 Warmup|Build|Python|09-learning-rate-schedules
10|Build Your Own Mini Framework|造一个迷你深度学习框架|Build|Python|10-mini-framework
11|Introduction to PyTorch|PyTorch 入门|Build|Python|11-intro-to-pytorch
12|Introduction to JAX|JAX 入门|Build|Python|12-intro-to-jax
13|Debugging Neural Networks|调试神经网络|Build|Python|13-debugging-neural-networks`
  });

  AAM.phase({
    id: '04', slug: '04-computer-vision', en: 'Computer Vision', zh: '计算机视觉',
    tag: 'vision',
    desc: '从像素到理解：图像、视频、3D、视觉语言模型与世界模型。',
    lessons: `01|Image Fundamentals: Pixels, Channels, Color Spaces|图像基础：像素、通道、色彩空间|Learn|Python|01-image-fundamentals
02|Convolutions from Scratch|从零实现卷积|Build|Python|02-convolutions-from-scratch
03|CNNs: LeNet to ResNet|CNN：从 LeNet 到 ResNet|Build|Python|03-cnns-lenet-to-resnet
04|Image Classification|图像分类|Build|Python|04-image-classification
05|Transfer Learning & Fine-Tuning|迁移学习与微调|Build|Python|05-transfer-learning
06|Object Detection — YOLO from Scratch|目标检测：从零实现 YOLO|Build|Python|06-object-detection-yolo
07|Semantic Segmentation — U-Net|语义分割：U-Net|Build|Python|07-semantic-segmentation-unet
08|Instance Segmentation — Mask R-CNN|实例分割：Mask R-CNN|Build|Python|08-instance-segmentation-mask-rcnn
09|Image Generation — GANs|图像生成：GAN|Build|Python|09-image-generation-gans
10|Image Generation — Diffusion Models|图像生成：扩散模型|Build|Python|10-image-generation-diffusion
11|Stable Diffusion — Architecture & Fine-Tuning|Stable Diffusion 架构与微调|Build|Python|11-stable-diffusion
12|Video Understanding — Temporal Modeling|视频理解：时序建模|Build|Python|12-video-understanding
13|3D Vision: Point Clouds, NeRFs|3D 视觉：点云与 NeRF|Build|Python|13-3d-vision-nerf
14|Vision Transformers (ViT)|视觉 Transformer|Build|Python|14-vision-transformers
15|Real-Time Vision: Edge Deployment|实时视觉：边缘部署|Build|Python|15-real-time-edge
16|Build a Complete Vision Pipeline|构建完整视觉流水线|Build|Python|16-vision-pipeline-capstone
17|Self-Supervised Vision — SimCLR, DINO, MAE|自监督视觉：SimCLR、DINO、MAE|Build|Python|17-self-supervised-vision
18|Open-Vocabulary Vision — CLIP|开放词汇视觉：CLIP|Build|Python|18-open-vocab-clip
19|OCR & Document Understanding|OCR 与文档理解|Build|Python|19-ocr-document-understanding
20|Image Retrieval & Metric Learning|图像检索与度量学习|Build|Python|20-image-retrieval-metric
21|Keypoint Detection & Pose Estimation|关键点检测与姿态估计|Build|Python|21-keypoint-pose
22|3D Gaussian Splatting from Scratch|从零实现 3D 高斯泼溅|Build|Python|22-3d-gaussian-splatting
23|Diffusion Transformers & Rectified Flow|扩散 Transformer 与 Rectified Flow|Build|Python|23-diffusion-transformers-rectified-flow
24|SAM 3 & Open-Vocabulary Segmentation|SAM 3 与开放词汇分割|Build|Python|24-sam3-open-vocab-segmentation
25|Vision-Language Models (ViT-MLP-LLM)|视觉语言模型|Build|Python|25-vision-language-models
26|Monocular Depth & Geometry Estimation|单目深度与几何估计|Build|Python|26-monocular-depth
27|Multi-Object Tracking & Video Memory|多目标跟踪与视频记忆|Build|Python|27-multi-object-tracking
28|World Models & Video Diffusion|世界模型与视频扩散|Build|Python|28-world-models-video-diffusion`
  });

})(window.AAM);
