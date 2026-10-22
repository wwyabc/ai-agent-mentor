/* =========================================================================
 * AI Agent 随身导师 · 核心层
 * 命名空间 / 工具函数 / 本地存储 / 学习档案模型
 * 无外部依赖，可 file:// 直接打开
 * ========================================================================= */
(function (global) {
  'use strict';

  var AAM = global.AAM || (global.AAM = {});

  /* ---------------------------------------------------------------- 工具 */
  var U = AAM.util = {
    $: function (sel, root) { return (root || document).querySelector(sel); },
    $$: function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); },
    el: function (tag, cls, html) {
      var n = document.createElement(tag);
      if (cls) n.className = cls;
      if (html != null) n.innerHTML = html;
      return n;
    },
    esc: function (s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    },
    today: function () {
      var d = new Date();
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    },
    dayOffset: function (n) {
      var d = new Date(); d.setDate(d.getDate() + n);
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    },
    daysBetween: function (a, b) {
      if (!a || !b) return 999;
      return Math.round((new Date(b) - new Date(a)) / 86400000);
    },
    now: function () { return Date.now(); },
    uid: function (p) { return (p || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); },
    clamp: function (v, a, b) { return Math.max(a, Math.min(b, v)); },
    shuffle: function (arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
      return a;
    },
    /** 中文友好分词：英文按词、中文按字/双字组 */
    tokenize: function (text) {
      var s = String(text || '').toLowerCase();
      var tokens = [];
      var re = /[a-z][a-z0-9+#._-]*/g, m;
      while ((m = re.exec(s))) { if (m[0].length > 1) tokens.push(m[0]); }
      var han = s.replace(/[^一-龥]+/g, ' ');
      han.split(/\s+/).forEach(function (seg) {
        if (!seg) return;
        for (var i = 0; i < seg.length; i++) {
          tokens.push(seg[i]);
          if (i + 1 < seg.length) tokens.push(seg.substr(i, 2));
        }
      });
      return tokens;
    },
    fmtMin: function (sec) {
      var m = Math.round((sec || 0) / 60);
      if (m < 60) return m + ' 分钟';
      var h = Math.floor(m / 60);
      return h + ' 小时 ' + (m % 60) + ' 分';
    },
    fmtDate: function (ts) {
      if (!ts) return '—';
      var d = new Date(ts);
      return (d.getMonth() + 1) + '/' + d.getDate();
    }
  };

  /* ------------------------------------------------------------ 本地存储 */
  var KEY = 'aam.state.v1';

  function emptyState() {
    return {
      version: 1,
      profile: {
        name: '', level: 'unknown', goal: 'agent',
        minutesPerDay: 15,
        interests: ['agent'],
        onboarded: false,
        createdAt: U.now()
      },
      progress: {},                 // lessonId -> LessonProgress
      sessions: {},                 // lessonId -> {messages:[], step, updatedAt}
      mistakes: [],                 // 错题本
      reviews: [],                  // 复习队列（间隔重复）
      settings: {
        llm: { enabled: false, baseUrl: 'https://api.openai.com/v1', apiKey: '', model: 'gpt-4o-mini' },
        theme: 'auto',
        dailyGoalMin: 15
      },
      stats: { days: {} },          // 'YYYY-MM-DD' -> {seconds, lessons:[]}
      lastLessonId: null
    };
  }

  var Store = AAM.store = {
    state: null,
    load: function () {
      try {
        var raw = global.localStorage.getItem(KEY);
        this.state = raw ? merge(emptyState(), JSON.parse(raw)) : emptyState();
      } catch (e) { this.state = emptyState(); }
      return this.state;
    },
    save: function () {
      try { global.localStorage.setItem(KEY, JSON.stringify(this.state)); }
      catch (e) { /* 隐私模式/超额时静默降级为内存态 */ }
    },
    reset: function () { this.state = emptyState(); this.save(); },
    export: function () { return JSON.stringify(this.state, null, 2); },
    import: function (json) {
      var obj = JSON.parse(json);
      this.state = merge(emptyState(), obj);
      this.save();
    }
  };

  function merge(base, patch) {
    if (!patch || typeof patch !== 'object') return base;
    Object.keys(patch).forEach(function (k) {
      var b = base[k], p = patch[k];
      if (p && typeof p === 'object' && !Array.isArray(p) && b && typeof b === 'object' && !Array.isArray(b)) base[k] = merge(b, p);
      else base[k] = p;
    });
    return base;
  }

  /* ------------------------------------------------------------ 课程注册表
   * 两条数据来源在这里汇合：
   *  1) 手写中文标题（02/03 号文件，Phase 00-09）
   *  2) 仓库权威索引导出的目录（04 号文件，全量 20 Phase）
   * 合并后对外暴露统一查询 API。
   * ---------------------------------------------------------------------- */
  AAM._phases = [];
  AAM._byId = {};
  AAM.catalog = { phases: [], paths: [], glossary: [], prereqs: {} };
  AAM._zh = { phase: {}, lesson: {} };

  /** 注册一个 Phase（手写中文标题来源） */
  AAM.phase = function (cfg) {
    var lessons = String(cfg.lessons || '').split('\n').map(function (l) { return l.trim(); })
      .filter(Boolean).map(function (l) {
        var f = l.split('|');
        return { num: f[0], en: f[1] || '', zh: f[2] || '', type: f[3] || 'Learn', lang: f[4] || '—', slug: f[5] || '' };
      });
    AAM._phases.push({ id: cfg.id, slug: cfg.slug, en: cfg.en, zh: cfg.zh, desc: cfg.desc, tag: cfg.tag, lessons: lessons });
    AAM._zh.phase[cfg.id] = cfg.zh;
    lessons.forEach(function (l) { AAM._zh.lesson[cfg.id + '-' + l.num] = l.zh; });
  };

  /** 批量补充中文标题：{phase:{'14':..}, lesson:{'14-01':..}} */
  AAM.zhTitles = function (map) {
    Object.keys(map.phase || {}).forEach(function (k) {
      AAM._zh.phase[k] = map.phase[k];
      var p = AAM.phaseById(k);
      if (p) p.zh = map.phase[k];
    });
    Object.keys(map.lesson || {}).forEach(function (k) {
      AAM._zh.lesson[k] = map.lesson[k];
      var l = AAM._byId[k];
      if (l) l.zh = map.lesson[k];
    });
  };

  /** 载入自动生成的目录，并与手写中文标题合并 */
  AAM.loadCatalog = function (payload) {
    AAM.catalog = payload;
    AAM._byId = {};
    payload.phases.forEach(function (p) {
      p.lessons.forEach(function (l) {
        l.pid = p.id;
        l.phaseZh = AAM._zh.phase[p.id] || p.zh || p.en;
        l.phaseEn = p.en;
        l.phaseTag = p.tag;
        l.zh = AAM._zh.lesson[l.id] || '';
        AAM._byId[l.id] = l;
      });
    });
  };

  /* ------------------------------------------------ 精编中文内容 / 概念卡 */
  AAM._content = {};
  AAM._topics = [];

  /** 注册一节课的精编中文讲解内容 */
  AAM.content = function (id, obj) { obj.id = id; AAM._content[id] = obj; };
  AAM.getContent = function (id) { return AAM._content[id] || null; };
  AAM.hasContent = function (id) { return !!AAM._content[id]; };

  /** 注册一张"概念/常见问题"卡（跨课程的主题答疑） */
  AAM.topic = function (obj) { AAM._topics.push(obj); };
  AAM.topics = function () { return AAM._topics; };

  /* ---------------------------------------------------- 中文化覆盖表（i18n）
   * 自动生成的目录（04 号文件）带的是仓库英文原题、摘要与关键词。
   * 这里提供覆盖函数，由「中文覆盖表」文件调用，把界面文案整体换成中文，
   * 不改动自动生成的数据结构。
   * ---------------------------------------------------------------------- */
  /** Phase 中文描述 + 补缺的中文标题 */
  AAM.zhMeta = function (map) {
    Object.keys(map.phaseDesc || {}).forEach(function (k) {
      var p = AAM.phaseById(k);
      if (p) p.descZh = map.phaseDesc[k];
    });
    AAM.zhTitles({ lesson: map.lesson || {} });
  };

  /** 课程中文摘要与关键词：{ '14-01': { s: '摘要', k: '关键词' } } */
  AAM.zhLessons = function (map) {
    Object.keys(map).forEach(function (id) {
      var l = AAM.lesson(id);
      if (!l) return;
      if (map[id].s) l.s = map[id].s;
      if (map[id].k) l.k = map[id].k;
    });
  };

  /** 术语中文译名与释义：{ 'AdamW': { t: '中文名', d: '释义', w: '为什么重要' } } */
  AAM.zhGlossary = function (map) {
    (AAM.catalog.glossary || []).forEach(function (g) {
      var v = map[g.t];
      if (!v) return;
      if (v.t) g.t = v.t;
      if (v.d) g.d = v.d;
      if (v.w) g.w = v.w;
    });
  };

  AAM.lesson = function (id) { return AAM._byId[id] || null; };
  AAM.allLessons = function () {
    var out = [];
    AAM.catalog.phases.forEach(function (p) { out = out.concat(p.lessons); });
    return out;
  };
  AAM.phases = function () { return AAM.catalog.phases; };
  AAM.phaseById = function (pid) {
    return AAM.catalog.phases.filter(function (p) { return p.id === pid; })[0] || null;
  };
  AAM.title = function (l) { return l ? (l.zh || l.en) : ''; };
  AAM.repoUrl = function (l) {
    return l ? 'https://github.com/rohitg00/ai-engineering-from-scratch/tree/main/' + l.p : '#';
  };
  AAM.siteUrl = function (l) {
    return l ? 'https://aiengineeringfromscratch.com/lesson?path=' + l.p : '#';
  };
  /** 前置 Phase（依赖图） */
  AAM.prereqPhases = function (pid) {
    var pr = AAM.catalog.prereqs || {};
    var key = String(parseInt(pid, 10));
    return (pr[key] || []).map(function (n) { return String(n).padStart(2, '0'); });
  };

  /* -------------------------------------------------------- 学习档案 API */
  var Progress = AAM.progress = {
    DEFAULT_MIN: 12,

    get: function (lessonId) {
      var p = Store.state.progress[lessonId];
      if (!p) {
        p = Store.state.progress[lessonId] = {
          status: 'new',      // new | learning | mastered
          mastery: 0,         // 0-100
          seconds: 0,
          step: 0,            // 断点：讲解脚本进行到第几步
          quizRight: 0,
          quizWrong: 0,
          lastAt: 0,
          nextReview: null,
          visits: 0
        };
      }
      return p;
    },

    touch: function (lessonId) {
      var p = this.get(lessonId);
      p.visits++; p.lastAt = U.now();
      if (p.status === 'new') p.status = 'learning';
      Store.save();
      return p;
    },

    addTime: function (lessonId, sec) {
      var p = this.get(lessonId);
      p.seconds += sec;
      var d = U.today();
      var day = Store.state.stats.days[d] || (Store.state.stats.days[d] = { seconds: 0, lessons: [] });
      day.seconds += sec;
      if (day.lessons.indexOf(lessonId) < 0) day.lessons.push(lessonId);
      Store.save();
    },

    setStep: function (lessonId, step) {
      var p = this.get(lessonId); p.step = step; Store.save();
    },

    /** 答题反馈：对错 → 掌握度 + 复习间隔 */
    answer: function (lessonId, ok, question) {
      var p = this.get(lessonId);
      if (ok) { p.quizRight++; p.mastery = U.clamp(p.mastery + 18, 0, 100); }
      else {
        p.quizWrong++;
        p.mastery = U.clamp(p.mastery - 8, 0, 100);
        Store.state.mistakes.unshift({ lessonId: lessonId, q: question, ts: U.now() });
        Store.state.mistakes = Store.state.mistakes.slice(0, 60);
      }
      if (p.mastery >= 80 && p.status !== 'mastered') p.status = 'mastered';
      else if (p.mastery < 40 && p.status === 'mastered') p.status = 'learning';
      this.scheduleReview(lessonId, ok);
      Store.save();
      return p;
    },

    /** 间隔重复：掌握度越高，下次复习越远（1/3/7/16 天） */
    scheduleReview: function (lessonId, ok) {
      var p = this.get(lessonId);
      var lvl = p.mastery >= 80 ? 3 : p.mastery >= 55 ? 2 : p.mastery >= 30 ? 1 : 0;
      if (!ok) lvl = 0;
      var days = [1, 3, 7, 16][lvl];
      p.nextReview = U.dayOffset(days);
      var q = Store.state.reviews.filter(function (r) { return r.lessonId !== lessonId; });
      q.push({ lessonId: lessonId, due: p.nextReview });
      Store.state.reviews = q;
    },

    markMastered: function (lessonId) {
      var p = this.get(lessonId);
      p.status = 'mastered'; p.mastery = Math.max(p.mastery, 85);
      p.nextReview = U.dayOffset(7);
      Store.save();
    },

    /** 全局统计 */
    summary: function () {
      var st = Store.state, all = AAM.allLessons ? AAM.allLessons() : [];
      var learned = 0, mastered = 0, seconds = 0;
      Object.keys(st.progress).forEach(function (id) {
        var p = st.progress[id];
        seconds += p.seconds;
        if (p.status !== 'new') learned++;
        if (p.status === 'mastered') mastered++;
      });
      var today = st.stats.days[U.today()] || { seconds: 0, lessons: [] };
      return {
        total: all.length || 542,
        learned: learned,
        mastered: mastered,
        seconds: seconds,
        todaySeconds: today.seconds,
        todayLessons: today.lessons.length,
        streak: streak(),
        mistakes: st.mistakes.length,
        dueReviews: Store.state.reviews.filter(function (r) { return r.due <= U.today(); }).length
      };
    },

    /** 连续学习天数 */
    streak: streak
  };

  function streak() {
    var days = Store.state.stats.days, n = 0;
    for (var i = 0; i < 400; i++) {
      var d = U.dayOffset(-i);
      if (days[d] && days[d].seconds >= 60) n++;
      else if (i > 0) break;
    }
    return n;
  }

})(window);
