/* =========================================================================
 * 导师引擎：对话状态机 + 讲解脚本驱动 + 检索式作答 + 可选 LLM 增强
 *
 * 状态机（每节课一个 session）：
 *   idle ──start──> teach(0..n) ──> quiz(0..m) ──> done
 *   任意状态下用户提问 → 检索答疑（不改状态）；"继续" → 回到 teach 进度
 * ========================================================================= */
(function (AAM) {
  'use strict';

  var U = AAM.util, Store = AAM.store, Progress = AAM.progress;

  var CONTINUE_RE = /^(继续|next|下一步|接着|接着讲|继续讲|ok|好的|嗯|然后|讲吧|开始)$/i;
  var QUIZ_RE = /^([abcd1234]|[ABCD])\)?\.?\s*$/;

  function session(lessonId) {
    var s = Store.state.sessions[lessonId];
    if (!s) s = Store.state.sessions[lessonId] = { messages: [], step: 0, quizIdx: 0, mode: 'idle', updatedAt: U.now() };
    return s;
  }

  function push(lessonId, role, text, extra) {
    var s = session(lessonId);
    var m = { role: role, text: text, ts: U.now() };
    if (extra) Object.keys(extra).forEach(function (k) { m[k] = extra[k]; });
    s.messages.push(m);
    s.updatedAt = U.now();
    if (s.messages.length > 200) s.messages = s.messages.slice(-120);
    Store.save();
    return m;
  }

  /* ----------------------------------------------------------- 讲解脚本 */
  function teachMsg(lessonId, step) {
    var c = AAM.getContent(lessonId), l = AAM.lesson(lessonId);
    if (!c) return fallbackTeach(lessonId);
    var pts = c.points || [];
    if (step === 0) {
      return {
        text: '【' + AAM.title(l) + '】\n\n' + c.hook + '\n\n为什么重要：' + c.why +
          '\n\n这节我会分 ' + pts.length + ' 步讲，讲完再考你两题。随时说「继续」。',
        actions: [{ t: '继续', v: 'next' }, { t: '直接考我', v: 'quiz' }]
      };
    }
    if (step <= pts.length) {
      var p = pts[step - 1];
      var out = '第 ' + step + '/' + pts.length + ' 步 · ' + p.h + '\n\n' + p.b;
      if (step === pts.length) {
        out += '\n\n要点讲完了。要我出题考你，还是先看动手任务？';
        return { text: out, actions: [{ t: '考我', v: 'quiz' }, { t: '看动手任务', v: 'practice' }] };
      }
      return { text: out, actions: [{ t: '继续', v: 'next' }] };
    }
    return quizMsg(lessonId, 0);
  }

  function fallbackTeach(lessonId) {
    var l = AAM.lesson(lessonId);
    if (!l) return { text: '我没找到这一节的内容，换个问题试试？', actions: [] };
    var txt = '【' + AAM.title(l) + '】（' + l.phaseZh + ' · ' + l.num + '）\n\n';
    if (l.s) txt += '这节讲了什么：' + l.s + '\n\n';
    if (l.k) txt += '覆盖的小节：' + l.k + '\n\n';
    txt += '这一节我还没有写精编中文讲解，可以先看仓库原文，或者让我用英文摘要给你展开讲。';
    return {
      text: txt,
      actions: [{ t: '打开仓库原文', v: 'repo:' + lessonId }, { t: '打开课程官网', v: 'site:' + lessonId }, { t: '标记已掌握', v: 'mastered:' + lessonId }]
    };
  }

  function quizMsg(lessonId, idx) {
    var c = AAM.getContent(lessonId);
    if (!c || !c.quiz || !c.quiz.length) {
      Progress.markMastered(lessonId);
      return {
        text: '这一节没有内置题目。已帮你标记为「已掌握」，可以去下一节了。',
        actions: [{ t: '下一节', v: 'nextLesson' }, { t: '看动手任务', v: 'practice' }]
      };
    }
    if (idx >= c.quiz.length) {
      var p = Progress.get(lessonId);
      Progress.markMastered(lessonId);
      return {
        text: '小测完成 ✅  本轮正确 ' + p.quizRight + ' 题 / 错误 ' + p.quizWrong + ' 题，掌握度 ' + p.mastery + '。\n\n' +
          (p.quizWrong ? '错的那题我放进错题本了，明天复习时会再问你一次。' : '全对，可以进入下一节了。'),
        actions: [{ t: '下一节', v: 'nextLesson' }, { t: '看动手任务', v: 'practice' }, { t: '再讲一遍', v: 'restart' }]
      };
    }
    var q = c.quiz[idx];
    var letters = ['A', 'B', 'C', 'D'];
    var txt = '第 ' + (idx + 1) + '/' + c.quiz.length + ' 题：' + q.q + '\n\n' +
      q.o.map(function (o, i) { return letters[i] + '. ' + o; }).join('\n');
    return {
      text: txt,
      quiz: { idx: idx, letters: letters.slice(0, q.o.length) },
      actions: q.o.map(function (o, i) { return { t: letters[i], v: 'ans:' + i }; })
    };
  }

  function practiceMsg(lessonId) {
    var c = AAM.getContent(lessonId), l = AAM.lesson(lessonId);
    var txt = '动手任务 · ' + AAM.title(l) + '\n\n';
    txt += (c && c.practice) ? c.practice : '按仓库里这节课的 docs/en.md 跑一遍代码，并保留命令、退出码与输出作为证据。';
    txt += '\n\n按仓库的通用学习法：读文档 → 自己敲代码 → 运行 → 保留证据 → 能解释输出再往下走。';
    return {
      text: txt,
      actions: [{ t: '打开仓库原文', v: 'repo:' + lessonId }, { t: '标记已掌握', v: 'mastered:' + lessonId }, { t: '下一节', v: 'nextLesson' }]
    };
  }

  /* ------------------------------------------------------- 检索式答疑 */
  function answerFromTopic(t) {
    var l = AAM.lesson(t.lessonId);
    return {
      text: t.a.join('\n\n') + (l ? '\n\n—— 对应课程：' + l.phaseZh + ' · ' + AAM.title(l) : ''),
      refs: l ? [l.id] : [],
      actions: l
        ? [{ t: '讲这一节', v: 'learn:' + l.id }, { t: '考我', v: 'quiz' }, { t: '打开仓库原文', v: 'repo:' + l.id }]
        : []
    };
  }

  function answerFromLesson(l) {
    var c = AAM.getContent(l.id);
    var txt = '这个问题对应 【' + AAM.title(l) + '】（' + l.phaseZh + ' · ' + l.num + '）\n\n';
    if (c) {
      txt += c.hook + '\n\n' + c.why + '\n\n';
      txt += '这节的要点：\n' + (c.points || []).map(function (p, i) { return (i + 1) + '. ' + p.h; }).join('\n');
    } else {
      if (l.s) txt += '仓库摘要：' + l.s + '\n\n';
      if (l.k) txt += '覆盖内容：' + l.k + '\n\n';
      txt += '（这节暂无精编中文讲解，可以让我按英文摘要展开，或打开原文。）';
    }
    return {
      text: txt,
      refs: [l.id],
      actions: [{ t: '讲这一节', v: 'learn:' + l.id }, { t: '打开仓库原文', v: 'repo:' + l.id }, { t: '考我', v: 'quiz' }]
    };
  }

  function answerGeneric(query) {
    var hits = AAM.search(query, { types: ['lesson', 'content'], limit: 3 });
    var picked = hits.map(function (h) { return AAM.lesson(h.lessonId); }).filter(Boolean);
    if (picked.length) {
      var txt = '我在课程里找到这几节最相关：\n\n' + picked.map(function (l, i) {
        return (i + 1) + '. ' + l.phaseZh + ' · ' + AAM.title(l) + (l.s ? '\n   ' + l.s.slice(0, 60) + '…' : '');
      }).join('\n\n');
      return {
        text: txt + '\n\n想从哪一节开始？也可以直接问概念，比如「什么是 MCP」「Agent 为什么会死循环」。',
        refs: picked.map(function (l) { return l.id; }),
        actions: picked.slice(0, 2).map(function (l) { return { t: '讲 ' + AAM.title(l).slice(0, 8), v: 'learn:' + l.id }; })
      };
    }
    return {
      text: '课程里暂时没检索到和「' + query + '」直接对应的内容。\n\n你可以这样问：\n' +
        '· 概念：什么是 Agent / MCP 和 Function Calling 有什么区别\n' +
        '· 故障：Agent 死循环怎么办 / 工具调用失败怎么处理\n' +
        '· 选型：RAG 还是微调 / 什么时候上多智能体\n' +
        '· 学习：我该从哪里开始学 Agent',
      refs: [],
      actions: [{ t: '给我推荐一节课', v: 'recommend' }, { t: '看学习路线', v: 'goto:paths' }]
    };
  }

  /* --------------------------------------------------------- LLM 增强 */
  function llmPrompt(query, ctxLessons) {
    var ctx = ctxLessons.map(function (l) {
      var c = AAM.getContent(l.id);
      return '[' + l.id + '] ' + AAM.title(l) + '（' + l.phaseZh + '）\n' + (l.s || '') +
        (c ? '\n要点：' + (c.points || []).map(function (p) { return p.h; }).join('；') : '');
    }).join('\n\n');
    return [
      { role: 'system', content: '你是基于开源课程 AI Engineering from Scratch 的中文 AI 导师。只依据给定的课程上下文回答，用中文，简洁结构化（分点），不超过 400 字。如果上下文不足以回答，就说明课程里没有覆盖，并给出应学习的章节编号。' },
      { role: 'user', content: '课程上下文：\n' + ctx + '\n\n用户问题：' + query }
    ];
  }

  function askLLM(query, ctxLessons) {
    var cfg = Store.state.settings.llm;
    return fetch(cfg.baseUrl.replace(/\/$/, '') + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + cfg.apiKey },
      body: JSON.stringify({ model: cfg.model, messages: llmPrompt(query, ctxLessons), temperature: 0.3 })
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (j) {
      var c = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
      if (!c) throw new Error('empty');
      return c;
    });
  }

  /* ------------------------------------------------------------- 主入口 */
  var Tutor = AAM.tutor = {
    session: session,
    push: push,

    messages: function (lessonId) { return session(lessonId).messages; },

    /** 开始学某一节 */
    start: function (lessonId) {
      var s = session(lessonId);
      Progress.touch(lessonId);
      Store.state.lastLessonId = lessonId; Store.save();
      if (s.mode !== 'idle' && s.step > 0) {
        return { text: '继续上次的内容（第 ' + s.step + ' 步）：\n\n' + teachMsg(lessonId, s.step).text, actions: [{ t: '继续', v: 'next' }, { t: '从头讲', v: 'restart' }] };
      }
      s.mode = 'teach'; s.step = 0; s.quizIdx = 0;
      var m = teachMsg(lessonId, 0);
      s.step = 0;
      Store.save();
      return m;
    },

    /** 处理用户输入，返回结果对象 {text, actions, refs, quiz} */
    respond: function (input, ctx) {
      ctx = ctx || {};
      var lessonId = ctx.lessonId || Store.state.lastLessonId;
      var text = String(input || '').trim();

      /* --- 指令型 --- */
      if (CONTINUE_RE.test(text)) {
        if (!lessonId) return Tutor.recommend();
        var s = session(lessonId);
        if (s.mode === 'quiz') return quizMsg(lessonId, s.quizIdx);
        s.step++;
        Progress.setStep(lessonId, s.step);
        Progress.addTime(lessonId, 60);
        Store.save();
        return teachMsg(lessonId, s.step);
      }
      if (text === 'quiz' || /^(考我|出题|测试|做题)$/.test(text)) {
        if (!lessonId) return Tutor.recommend();
        session(lessonId).mode = 'quiz';
        session(lessonId).quizIdx = 0;
        Store.save();
        return quizMsg(lessonId, 0);
      }
      if (text === 'practice' || /^(动手|实践|练习任务)$/.test(text)) {
        return lessonId ? practiceMsg(lessonId) : Tutor.recommend();
      }
      if (text === 'restart' || /^(重讲|从头讲|重新讲)$/.test(text)) {
        var s2 = session(lessonId); s2.step = 0; s2.quizIdx = 0; s2.mode = 'teach'; Store.save();
        return teachMsg(lessonId, 0);
      }

      /* --- 选择题作答 --- */
      var m = QUIZ_RE.exec(text);
      if (m && lessonId) {
        var ss = session(lessonId);
        if (ss.mode === 'quiz') return Tutor.submitQuiz(lessonId, ss.quizIdx, letterToIndex(m[1]));
      }

      /* --- 开放问答：先概念卡，再课程，再兜底 --- */
      var t = AAM.matchTopic(text);
      if (t) {
        var topic = AAM.topics().filter(function (x) { return x.id === t.id; })[0];
        if (topic) {
          if (topic.lessonId) { lessonId = topic.lessonId; Store.state.lastLessonId = lessonId; }
          return answerFromTopic(topic);
        }
      }
      var l = AAM.bestLesson(text);
      if (l) {
        Store.state.lastLessonId = l.id; Store.save();
        return answerFromLesson(l);
      }
      return answerGeneric(text);
    },

    submitQuiz: function (lessonId, idx, pick) {
      var c = AAM.getContent(lessonId);
      if (!c || !c.quiz[idx]) return quizMsg(lessonId, idx);
      var q = c.quiz[idx];
      var ok = pick === q.a;
      Progress.answer(lessonId, ok, q.q);
      var s = session(lessonId);
      var txt = (ok ? '✅ 答对了。' : '❌ 答错了，正确答案是 ' + ['A', 'B', 'C', 'D'][q.a] + '。') +
        '\n\n解析：' + q.e + '\n\n' + (ok ? '' : '这题我会放进错题本，明天再问你。');
      s.quizIdx = idx + 1;
      Store.save();
      var next = s.quizIdx < c.quiz.length
        ? { text: txt, actions: [{ t: '下一题', v: 'quiz' }] }
        : { text: txt + '\n\n' + quizMsg(lessonId, s.quizIdx).text, actions: [{ t: '下一节', v: 'nextLesson' }, { t: '看动手任务', v: 'practice' }] };
      return next;
    },

    /** 推荐一节课（用于首页 / 对话里的"给我推荐"） */
    recommend: function () {
      var rec = AAM.recommend.next({ limit: 1 })[0];
      if (!rec) return { text: '课程还没加载完，稍等一下。', actions: [] };
      var l = rec.lesson;
      return {
        text: '推荐你学这一节：\n\n【' + AAM.title(l) + '】（' + l.phaseZh + ' · ' + l.num + '）\n' + (l.s || '') +
          '\n\n理由：' + rec.reason,
        refs: [l.id],
        actions: [{ t: '开始学', v: 'learn:' + l.id }, { t: '换个推荐', v: 'recommend' }]
      };
    },

    /** 可选：LLM 增强回答（失败自动回退到离线检索作答） */
    respondSmart: function (input, ctx) {
      var cfg = Store.state.settings.llm;
      var offline = Tutor.respond(input, ctx);
      if (!cfg.enabled || !cfg.apiKey) return Promise.resolve(offline);
      var refs = (offline.refs || []).map(AAM.lesson).filter(Boolean);
      if (!refs.length) {
        refs = AAM.search(input, { types: ['lesson', 'content'], limit: 2 })
          .map(function (h) { return AAM.lesson(h.lessonId); }).filter(Boolean);
      }
      if (!refs.length) return Promise.resolve(offline);
      return askLLM(input, refs).then(function (text) {
        return { text: text + '\n\n（已接入你的模型作答，依据课程：' + refs.map(function (l) { return l.id; }).join('、') + '）', refs: refs.map(function (l) { return l.id; }), actions: offline.actions };
      }).catch(function (e) {
        return { text: '模型调用失败（' + e.message + '），已回退到离线讲解：\n\n' + offline.text, refs: offline.refs, actions: offline.actions };
      });
    }
  };

  function letterToIndex(x) {
    if (/[abcdABCD]/.test(x)) return { a: 0, b: 1, c: 2, d: 3, A: 0, B: 1, C: 2, D: 3 }[x];
    return parseInt(x, 10) - 1;
  }

})(window.AAM);
