/* =========================================================================
 * 检索层：把「课程目录 + 精编内容 + 概念卡 + 术语表」建成一个可检索语料
 * 做法：分词 → 词袋 → 余弦相似度打分（零依赖，纯前端可跑）
 * 作用：为导师对话提供"这一问对应仓库里的哪一节"的证据
 * ========================================================================= */
(function (AAM) {
  'use strict';

  var U = AAM.util;

  /* 中英同义扩展：让中文问法能命中英文语料 */
  var SYN = {
    '智能体': 'agent loop react', '智能代理': 'agent', '代理': 'agent',
    '循环': 'loop react agent', '工具调用': 'function calling tool use',
    '函数调用': 'function calling tool', '工具': 'tool function calling',
    '记忆': 'memory context', '长期记忆': 'memory', '多智能体': 'multi-agent swarm',
    '提示注入': 'prompt injection security', '注入': 'injection prompt security',
    '评测': 'evaluation eval benchmark', '评估': 'evaluation eval',
    '成本': 'cost token budget', '上下文': 'context window',
    '协议': 'mcp protocol json-rpc', '技能': 'skills',
    '检索': 'rag retrieval search', '工作流': 'workflow patterns',
    '规划': 'planning plan execute', '反思': 'reflexion reflection self',
    '编排': 'orchestration supervisor swarm', '安全': 'security sandbox guardrails',
    '沙箱': 'sandbox permission', '权限': 'permission sandbox approval',
    '微调': 'fine-tuning lora', '向量': 'embedding vector',
    '死循环': 'loop failure stop', '幻觉': 'hallucination faithfulness',
    '语音': 'voice speech audio', '视觉': 'vision multimodal',
    '入门': 'start learning', '路线': 'learning path route'
  };

  var INDEX = null;

  function bag(text) {
    var m = {};
    U.tokenize(text).forEach(function (t) { m[t] = (m[t] || 0) + 1; });
    return m;
  }

  function addItem(list, item) {
    item.bag = bag(item.text);
    var norm = 0;
    Object.keys(item.bag).forEach(function (k) { norm += item.bag[k] * item.bag[k]; });
    item.norm = Math.sqrt(norm) || 1;
    list.push(item);
  }

  /** 语料 = 课程 ×1 + 精编内容 ×1 + 概念卡 ×1 + 术语 ×1（权重不同） */
  function build() {
    var list = [];

    AAM.allLessons().forEach(function (l) {
      addItem(list, {
        type: 'lesson', id: l.id, w: 1.0,
        text: [AAM.title(l), l.en, l.s, l.k, l.phaseZh, l.phaseEn, l.type].join(' ')
      });
    });

    Object.keys(AAM._content).forEach(function (id) {
      var c = AAM._content[id], l = AAM.lesson(id);
      var parts = [c.hook, c.why, c.practice, (c.tags || []).join(' ')];
      (c.points || []).forEach(function (p) { parts.push(p.h, p.b); });
      (c.terms || []).forEach(function (t) { parts.push(t.t, t.d); });
      addItem(list, {
        type: 'content', id: id, w: 1.6,
        text: (l ? AAM.title(l) + ' ' : '') + parts.join(' ')
      });
    });

    AAM.topics().forEach(function (t) {
      addItem(list, {
        type: 'topic', id: t.id, w: 2.0,
        text: t.q + ' ' + (t.keys || []).join(' ') + ' ' + (t.a || []).join(' ')
      });
    });

    (AAM.catalog.glossary || []).forEach(function (g, i) {
      addItem(list, {
        type: 'glossary', id: 'gl_' + i, w: 1.4,
        text: g.t + ' ' + g.d + ' ' + g.w + ' ' + g.c
      });
    });

    INDEX = list;
    return list;
  }

  function expand(text) {
    var extra = '';
    Object.keys(SYN).forEach(function (k) { if (text.indexOf(k) >= 0) extra += ' ' + SYN[k]; });
    return text + extra;
  }

  /**
   * 检索
   * @param {string} query
   * @param {object} opt {limit, types}
   * @returns [{type,id,score,lessonId,...}]
   */
  AAM.search = function (query, opt) {
    opt = opt || {};
    if (!INDEX) build();
    var q = bag(expand(String(query || '')));
    var qn = 0;
    Object.keys(q).forEach(function (k) { qn += q[k] * q[k]; });
    qn = Math.sqrt(qn) || 1;

    var out = [];
    INDEX.forEach(function (it) {
      if (opt.types && opt.types.indexOf(it.type) < 0) return;
      var dot = 0;
      Object.keys(q).forEach(function (k) {
        if (it.bag[k]) dot += q[k] * it.bag[k];
      });
      if (!dot) return;
      var s = (dot / (qn * it.norm)) * it.w;
      // 标题命中额外加权，让"问概念"优先命中对应章节
      var l = it.type === 'lesson' ? AAM.lesson(it.id) : null;
      if (l) {
        var t = (AAM.title(l) + ' ' + l.en).toLowerCase();
        if (t.indexOf(String(query).toLowerCase().trim()) >= 0 && query.trim().length > 1) s += 0.5;
      }
      out.push({ type: it.type, id: it.id, score: s, lessonId: it.type === 'lesson' || it.type === 'content' ? it.id : null });
    });

    out.sort(function (a, b) { return b.score - a.score; });
    return out.slice(0, opt.limit || 8);
  };

  /** 概念卡优先命中：直接回答"这是啥"类问题 */
  AAM.matchTopic = function (query) {
    var r = AAM.search(query, { types: ['topic'], limit: 1 });
    return r.length && r[0].score > 0.12 ? r[0] : null;
  };

  /** 找一个最适合"接着讲"的课程 */
  AAM.bestLesson = function (query) {
    var r = AAM.search(query, { types: ['content', 'lesson'], limit: 1 });
    return r.length && r[0].score > 0.06 ? AAM.lesson(r[0].lessonId) : null;
  };

  AAM.glossaryLookup = function (term) {
    var r = AAM.search(term, { types: ['glossary'], limit: 3 });
    return r.map(function (x) { return AAM.catalog.glossary[parseInt(x.id.slice(3), 10)]; }).filter(Boolean);
  };

})(window.AAM);
