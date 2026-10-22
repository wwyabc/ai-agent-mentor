/* =========================================================================
 * 推荐引擎：把「进度 + 错题 + 复习队列 + 目标路线 + 可用时长」变成下一节课
 * 优先级：到期复习 > 错题巩固 > 断点续学 > 路线下一节 > 目标相关未学
 * ========================================================================= */
(function (AAM) {
  'use strict';

  var U = AAM.util, Store = AAM.store, Progress = AAM.progress;

  /* -------------------------------------------------- 精选学习路线定义 */
  var CUSTOM = {
    'agent-core': {
      id: 'agent-core', zh: 'Agent 工程主线', source: 'custom',
      desc: '从工具接口一路打到评估与防御，是我们为「想做出能上线的 Agent」编排的最短路径。',
      lessons: ['13-01', '13-02', '13-05', '13-06', '13-07', '13-22', '14-01', '14-02', '14-06', '14-07', '14-12', '14-26', '14-27', '14-28', '14-30', '14-43']
    },
    'zero-to-agent': {
      id: 'zero-to-agent', zh: '零基础到 Agent', source: 'custom',
      desc: '先把 LLM 应用层补上（上下文、RAG、工具），再进 Agent，避免上层建筑悬空。',
      lessons: ['11-05', '11-06', '11-09', '13-01', '13-02', '13-06', '14-01', '14-06', '14-12', '14-26', '14-30']
    }
  };

  var ROUTE_META = {
    'model-context-protocol': { zh: 'MCP 专项', desc: '17 节课走完协议、传输、安全、可靠性与一致性证据。' },
    'agent-skills': { zh: 'Agent Skills 专项', desc: '从包契约、发现、调用到沙箱边界与发布评测。' },
    'using-coding-agents': { zh: '编码智能体实战', desc: '框定、计划、委派、验证、评审、改进的闭环。' },
    'shaping-the-build': { zh: '产品判断与交付', desc: '先定义结果，再用最小切片和指标驱动交付。' },
    'agentic-ai-engineer': { zh: 'Agentic AI 工程师（职业路线）', desc: '面向 Agent 方向岗位的完整能力路线。' },
    'ai-evaluation-reliability-engineer': { zh: 'AI 评测与可靠性工程师', desc: '评测体系、回归门禁与可靠性工程。' },
    'applied-ai-engineer': { zh: '应用型 AI 工程师', desc: '把模型能力落到业务应用上的通才路线。' },
    'building-and-deploying-ai-applications': { zh: '构建与部署 AI 应用', desc: '从原型到生产部署的主线。' },
    'forward-deployed-ai-engineer': { zh: '前置部署 AI 工程师', desc: '深入客户现场交付 AI 系统的路线。' },
    'ai-data-engineer': { zh: 'AI 数据工程师', desc: '数据管道与训练数据治理。' },
    'software-engineering-fundamentals': { zh: '软件工程基础', desc: '补齐工程基本功。' },
    'ai-developer-relations-engineer': { zh: '开发者关系工程师', desc: '面向开发者生态的 AI 岗位路线。' }
  };

  function resolveRoute(r) {
    var lessons = [];
    if (r.source === 'custom') {
      r.lessons.forEach(function (id, i) {
        var l = AAM.lesson(id);
        if (l) lessons.push({ id: id, order: i + 1, minutes: l.min || (l.type === 'Build' ? 30 : 20) });
      });
    } else {
      var p = AAM.catalog.paths.filter(function (x) { return x.id === r.id; })[0];
      if (!p) return lessons;
      p.lessons.forEach(function (x) {
        var seg = x.p.split('/');
        var pid = seg[1].split('-')[0];
        var num = seg[2].split('-')[0];
        var id = pid + '-' + num;
        if (AAM.lesson(id)) lessons.push({ id: id, order: x.o, minutes: x.m || 30 });
      });
    }
    return lessons;
  }

  var Rec = AAM.recommend = {
    /** 全部可选路线（精选 + 仓库 learning-paths） */
    routes: function () {
      var out = Object.keys(CUSTOM).map(function (k) { return CUSTOM[k]; });
      AAM.catalog.paths.forEach(function (p) {
        var meta = ROUTE_META[p.id] || { zh: p.title, desc: p.summary };
        out.push({ id: p.id, zh: meta.zh, desc: meta.desc || p.summary, source: 'path', minutes: p.minutes });
      });
      return out;
    },

    route: function (id) {
      var r = CUSTOM[id];
      if (!r) {
        var p = AAM.catalog.paths.filter(function (x) { return x.id === id; })[0];
        if (!p) return null;
        var meta = ROUTE_META[p.id] || { zh: p.title, desc: p.summary };
        r = { id: p.id, zh: meta.zh, desc: meta.desc || p.summary, source: 'path', minutes: p.minutes };
      }
      r.items = resolveRoute(r);
      return r;
    },

    /** 路线完成度 */
    routeProgress: function (id) {
      var r = Rec.route(id);
      if (!r || !r.items.length) return { done: 0, total: 0, pct: 0, current: null };
      var done = 0, current = null;
      r.items.forEach(function (it) {
        var p = Store.state.progress[it.id];
        if (p && p.status === 'mastered') done++;
        else if (!current) current = AAM.lesson(it.id);
      });
      return { done: done, total: r.items.length, pct: Math.round(done / r.items.length * 100), current: current };
    },

    /** 薄弱环节：按 Phase 聚合错题 */
    weakPhases: function () {
      var map = {};
      Store.state.mistakes.forEach(function (m) {
        var pid = (m.lessonId || '').split('-')[0];
        map[pid] = (map[pid] || 0) + 1;
      });
      return Object.keys(map).map(function (k) { return { phase: k, count: map[k] }; })
        .sort(function (a, b) { return b.count - a.count; });
    },

    /** 下一节课（单个） */
    next: function (opt) {
      opt = opt || {};
      var list = Rec.list(opt);
      return list.slice(0, opt.limit || 1);
    },

    /**
     * 推荐队列
     * @param opt {limit, minutes, routeId}
     */
    list: function (opt) {
      opt = opt || {};
      var out = [], seen = {};
      function add(lesson, reason, kind) {
        if (!lesson || seen[lesson.id]) return;
        seen[lesson.id] = 1;
        out.push({ lesson: lesson, reason: reason, kind: kind });
      }

      /* 1. 到期复习 */
      var today = U.today();
      Store.state.reviews.filter(function (r) { return r.due <= today; })
        .sort(function (a, b) { return a.due < b.due ? -1 : 1; })
        .slice(0, 3)
        .forEach(function (r) { add(AAM.lesson(r.lessonId), '到了复习时间，趁还没忘巩固一下', 'review'); });

      /* 2. 错题对应课程 */
      Store.state.mistakes.slice(0, 3).forEach(function (m) {
        add(AAM.lesson(m.lessonId), '上次的错题在这里，回炉一次', 'weak');
      });

      /* 3. 断点续学 */
      var lastId = Store.state.lastLessonId;
      if (lastId) {
        var p = Store.state.progress[lastId];
        var l = AAM.lesson(lastId);
        if (l && p && p.status === 'learning') add(l, '上次学到第 ' + p.step + ' 步，接着来', 'resume');
      }

      /* 4. 当前路线下一节 */
      var routeId = opt.routeId || Store.state.profile.routeId || 'agent-core';
      var r = Rec.route(routeId);
      if (r && r.items) {
        r.items.forEach(function (it) {
          var pr = Store.state.progress[it.id];
          if (!pr || pr.status !== 'mastered') add(AAM.lesson(it.id), '按路线「' + r.zh + '」往下走', 'route');
        });
      }

      /* 5. 按用户目标 / 兴趣补充（优先有精编内容的课） */
      var tagPref = { agent: ['13', '14'], llm: ['10', '11'], safety: ['18'], infra: ['17'], multimodal: ['12'] };
      var goal = Store.state.profile.goal || 'agent';
      var prefer = tagPref[goal] || ['13', '14'];
      AAM.allLessons().forEach(function (l) {
        if (prefer.indexOf(l.pid) < 0) return;
        var pr = Store.state.progress[l.id];
        if (pr && pr.status === 'mastered') return;
        if (!AAM.hasContent(l.id)) return;
        add(l, '符合你的目标方向，且有精编讲解', 'interest');
      });

      /* 6. 兜底：任何未学的课 */
      AAM.allLessons().forEach(function (l) {
        var pr = Store.state.progress[l.id];
        if (!pr || pr.status === 'new') add(l, '还没开始，可以从这里起步', 'new');
      });

      /* 按可用时长过滤（碎片化场景） */
      if (opt.minutes) {
        var fit = out.filter(function (x) { return (x.lesson.min || 25) <= opt.minutes + 5; });
        if (fit.length) out = fit;
      }
      return out.slice(0, opt.limit || 5);
    },

    /** 某一节的"下一节"：优先同路线，其次同 Phase 顺序 */
    nextLessonOf: function (lessonId) {
      var routeId = Store.state.profile.routeId || 'agent-core';
      var r = Rec.route(routeId);
      if (r && r.items) {
        var idx = -1;
        r.items.forEach(function (it, i) { if (it.id === lessonId) idx = i; });
        if (idx >= 0 && r.items[idx + 1]) return AAM.lesson(r.items[idx + 1].id);
      }
      var l = AAM.lesson(lessonId);
      if (!l) return null;
      var ph = AAM.phaseById(l.pid);
      if (!ph) return null;
      var i2 = ph.lessons.indexOf(l);
      return ph.lessons[i2 + 1] || null;
    },

    /** 相似 / 相关课程（同一 Phase 内 + 同 tag 的精编课） */
    related: function (lessonId, n) {
      var l = AAM.lesson(lessonId);
      if (!l) return [];
      var out = [];
      (AAM.catalog.phases || []).forEach(function (p) {
        if (p.id === l.pid) return;
        if (p.tag === l.phaseTag) p.lessons.forEach(function (x) { if (AAM.hasContent(x.id)) out.push(x); });
      });
      return out.slice(0, n || 4);
    }
  };

})(window.AAM);
