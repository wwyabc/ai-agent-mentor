/* =========================================================================
 * 课程数据 B：Phase 05 - 09
 * ========================================================================= */
(function (AAM) {
  'use strict';

  AAM.phase({
    id: '05', slug: '05-nlp-foundations-to-advanced', en: 'NLP: Foundations to Advanced', zh: 'NLP：从基础到进阶',
    tag: 'nlp',
    desc: '语言是通往智能的接口。检索、分块、评测都在这里打底。',
    lessons: `01|Text Processing: Tokenization, Stemming, Lemmatization|文本处理：分词、词干、词形还原|Build|Python|01-text-processing
02|Bag of Words, TF-IDF & Text Representation|词袋、TF-IDF 与文本表示|Build|Python|02-bag-of-words-tfidf
03|Word Embeddings: Word2Vec from Scratch|词嵌入：从零实现 Word2Vec|Build|Python|03-word-embeddings-word2vec
04|GloVe, FastText & Subword Embeddings|GloVe、FastText 与子词嵌入|Build|Python|04-glove-fasttext-subword
05|Sentiment Analysis|情感分析|Build|Python|05-sentiment-analysis
06|Named Entity Recognition (NER)|命名实体识别|Build|Python|06-named-entity-recognition
07|POS Tagging & Syntactic Parsing|词性标注与句法分析|Build|Python|07-pos-tagging-parsing
08|Text Classification — CNNs & RNNs for Text|文本分类：用 CNN 与 RNN|Build|Python|08-cnns-rnns-for-text
09|Sequence-to-Sequence Models|序列到序列模型|Build|Python|09-sequence-to-sequence
10|Attention Mechanism — The Breakthrough|注意力机制：突破点|Build|Python|10-attention-mechanism
11|Machine Translation|机器翻译|Build|Python|11-machine-translation
12|Text Summarization|文本摘要|Build|Python|12-text-summarization
13|Question Answering Systems|问答系统|Build|Python|13-question-answering
14|Information Retrieval & Search|信息检索与搜索|Build|Python|14-information-retrieval-search
15|Topic Modeling: LDA, BERTopic|主题模型：LDA、BERTopic|Build|Python|15-topic-modeling
16|Text Generation|文本生成（前 Transformer）|Build|Python|16-text-generation-pre-transformer
17|Chatbots: Rule-Based to Neural|聊天机器人：从规则到神经网络|Build|Python|17-chatbots-rule-to-neural
18|Multilingual NLP|多语言 NLP|Build|Python|18-multilingual-nlp
19|Subword Tokenization: BPE, WordPiece, Unigram|子词分词：BPE、WordPiece、Unigram|Learn|Python|19-subword-tokenization
20|Structured Outputs & Constrained Decoding|结构化输出与受限解码|Build|Python|20-structured-outputs-constrained-decoding
21|NLI & Textual Entailment|自然语言推理与文本蕴含|Learn|Python|21-nli-textual-entailment
22|Embedding Models Deep Dive|嵌入模型深入|Learn|Python|22-embedding-models-deep-dive
23|Chunking Strategies for RAG|RAG 的分块策略|Build|Python|23-chunking-strategies-rag
24|Coreference Resolution|共指消解|Learn|Python|24-coreference-resolution
25|Entity Linking & Disambiguation|实体链接与消歧|Build|Python|25-entity-linking
26|Relation Extraction & Knowledge Graph Construction|关系抽取与知识图谱构建|Build|Python|26-relation-extraction-kg
27|LLM Evaluation: RAGAS, DeepEval, G-Eval|LLM 评测：RAGAS、DeepEval、G-Eval|Build|Python|27-llm-evaluation-frameworks
28|Long-Context Evaluation: NIAH, RULER, LongBench|长上下文档位：NIAH、RULER、LongBench|Learn|Python|28-long-context-evaluation
29|Dialogue State Tracking|对话状态追踪|Build|Python|29-dialogue-state-tracking`
  });

  AAM.phase({
    id: '06', slug: '06-speech-and-audio', en: 'Speech & Audio', zh: '语音与音频',
    tag: 'audio',
    desc: '会听、会懂、会说。',
    lessons: `01|Audio Fundamentals: Waveforms, Sampling, FFT|音频基础：波形、采样、FFT|Learn|Python|01-audio-fundamentals
02|Spectrograms, Mel Scale & Audio Features|频谱图、梅尔刻度与音频特征|Build|Python|02-spectrograms-mel-features
03|Audio Classification|音频分类|Build|Python|03-audio-classification
04|Speech Recognition (ASR)|语音识别 ASR|Build|Python|04-speech-recognition-asr
05|Whisper: Architecture & Fine-Tuning|Whisper 架构与微调|Build|Python|05-whisper-architecture-finetuning
06|Speaker Recognition & Verification|说话人识别与验证|Build|Python|06-speaker-recognition-verification
07|Text-to-Speech (TTS)|语音合成 TTS|Build|Python|07-text-to-speech
08|Voice Cloning & Voice Conversion|声音克隆与变声|Build|Python|08-voice-cloning-conversion
09|Music Generation|音乐生成|Build|Python|09-music-generation
10|Audio-Language Models|音频语言模型|Build|Python|10-audio-language-models
11|Real-Time Audio Processing|实时音频处理|Build|Python|11-real-time-audio-processing
12|Build a Voice Assistant Pipeline|构建语音助手流水线|Build|Python|12-voice-assistant-pipeline
13|Neural Audio Codecs|神经音频编解码器：EnCodec、SNAC、Mimi、DAC|Learn|Python|13-neural-audio-codecs
14|Voice Activity Detection & Turn-Taking|语音活动检测与轮次控制|Build|Python|14-voice-activity-detection-turn-taking
15|Streaming Speech-to-Speech|流式语音到语音：Moshi、Hibiki|Learn|Python|15-streaming-speech-to-speech-moshi-hibiki
16|Voice Anti-Spoofing & Audio Watermarking|反 spoofing 与音频水印|Build|Python|16-anti-spoofing-audio-watermarking
17|Audio Evaluation — WER, MOS, MMAU|音频评测：WER、MOS、MMAU|Learn|Python|17-audio-evaluation-metrics`
  });

  AAM.phase({
    id: '07', slug: '07-transformers-deep-dive', en: 'Transformers Deep Dive', zh: 'Transformer 深入',
    tag: 'llm',
    desc: '改变一切的架构。Agent 的"大脑"就是它。',
    lessons: `01|Why Transformers: The Problems with RNNs|为什么是 Transformer：RNN 的问题|Learn|Python|01-why-transformers
02|Self-Attention from Scratch|从零实现自注意力|Build|Python|02-self-attention-from-scratch
03|Multi-Head Attention|多头注意力|Build|Python|03-multi-head-attention
04|Positional Encoding: Sinusoidal, RoPE, ALiBi|位置编码：Sinusoidal、RoPE、ALiBi|Build|Python|04-positional-encoding
05|The Full Transformer: Encoder + Decoder|完整 Transformer：编码器 + 解码器|Build|Python|05-full-transformer
06|BERT — Masked Language Modeling|BERT：掩码语言建模|Build|Python|06-bert-masked-language-modeling
07|GPT — Causal Language Modeling|GPT：因果语言建模|Build|Python|07-gpt-causal-language-modeling
08|T5, BART — Encoder-Decoder Models|T5、BART：编码器-解码器模型|Learn|Python|08-t5-bart-encoder-decoder
09|Vision Transformers (ViT)|视觉 Transformer|Build|Python|09-vision-transformers
10|Audio Transformers — Whisper Architecture|音频 Transformer：Whisper 架构|Learn|Python|10-audio-transformers-whisper
11|Mixture of Experts (MoE)|混合专家 MoE|Build|Python|11-mixture-of-experts
12|KV Cache, Flash Attention & Inference Optimization|KV Cache、Flash Attention 与推理优化|Build|Python|12-kv-cache-flash-attention
13|Scaling Laws|缩放定律|Learn|Python|13-scaling-laws
14|Build a Transformer from Scratch|从零构建 Transformer（阶段项目）|Build|Python|14-build-a-transformer-capstone
15|Attention Variants|注意力变体：滑窗、稀疏、差分|Build|Python|15-attention-variants
16|Speculative Decoding|投机解码：草稿-验证-重复|Build|Python|16-speculative-decoding`
  });

  AAM.phase({
    id: '08', slug: '08-generative-ai', en: 'Generative AI', zh: '生成式 AI',
    tag: 'genai',
    desc: '生成图像、视频、音频、3D 等万物。',
    lessons: `01|Generative Models: Taxonomy & History|生成模型：分类与历史|Learn|Python|01-generative-models-taxonomy-history
02|Autoencoders & VAE|自编码器与 VAE|Build|Python|02-autoencoders-vae
03|GANs: Generator vs Discriminator|GAN：生成器 vs 判别器|Build|Python|03-gans-generator-discriminator
04|Conditional GANs & Pix2Pix|条件 GAN 与 Pix2Pix|Build|Python|04-conditional-gans-pix2pix
05|StyleGAN|StyleGAN|Build|Python|05-stylegan
06|Diffusion Models — DDPM from Scratch|扩散模型：从零实现 DDPM|Build|Python|06-diffusion-ddpm-from-scratch
07|Latent Diffusion & Stable Diffusion|潜空间扩散与 Stable Diffusion|Build|Python|07-latent-diffusion-stable-diffusion
08|ControlNet, LoRA & Conditioning|ControlNet、LoRA 与条件控制|Build|Python|08-controlnet-lora-conditioning
09|Inpainting, Outpainting & Editing|图像修复、外扩与编辑|Build|Python|09-inpainting-outpainting-editing
10|Video Generation|视频生成|Build|Python|10-video-generation
11|Audio Generation|音频生成|Build|Python|11-audio-generation
12|3D Generation|3D 生成|Build|Python|12-3d-generation
13|Flow Matching & Rectified Flows|Flow Matching 与 Rectified Flow|Build|Python|13-flow-matching-rectified-flows
14|Evaluation: FID, CLIP Score|评测：FID、CLIP Score|Build|Python|14-evaluation-fid-clip-score
19|Visual Autoregressive Modeling (VAR)|视觉自回归建模：下一尺度预测|Build|Python|19-visual-autoregressive-var`
  });

  AAM.phase({
    id: '09', slug: '09-reinforcement-learning', en: 'Reinforcement Learning', zh: '强化学习',
    tag: 'rl',
    desc: 'RLHF 与博弈 AI 的地基，也是 Agent 自我改进的来源。',
    lessons: `01|MDPs, States, Actions & Rewards|MDP：状态、动作与奖励|Learn|Python|01-mdps-states-actions-rewards
02|Dynamic Programming|动态规划|Build|Python|02-dynamic-programming
03|Monte Carlo Methods|蒙特卡洛方法|Build|Python|03-monte-carlo-methods
04|Q-Learning, SARSA|Q-Learning 与 SARSA|Build|Python|04-q-learning-sarsa
05|Deep Q-Networks (DQN)|深度 Q 网络 DQN|Build|Python|05-dqn
06|Policy Gradients — REINFORCE|策略梯度 REINFORCE|Build|Python|06-policy-gradients-reinforce
07|Actor-Critic — A2C, A3C|Actor-Critic：A2C、A3C|Build|Python|07-actor-critic-a2c-a3c
08|PPO|PPO|Build|Python|08-ppo
09|Reward Modeling & RLHF|奖励建模与 RLHF|Build|Python|09-reward-modeling-rlhf
10|Multi-Agent RL|多智能体强化学习|Build|Python|10-multi-agent-rl
11|Sim-to-Real Transfer|Sim-to-Real 迁移|Build|Python|11-sim-to-real-transfer
12|RL for Games|游戏强化学习|Build|Python|12-rl-for-games`
  });

})(window.AAM);
