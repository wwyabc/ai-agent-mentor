/* =========================================================================
 * 界面层：路由 + 各页面渲染（移动端优先，单页 hash 路由）
 * ========================================================================= */
(function (AAM) {
  'use strict';

  var U = AAM.util, Store = AAM.store, Progress = AAM.progress, Tutor = AAM.tutor, Rec = AAM.recommend;

  var UI = AAM.ui = {};
  var state = UI.state = { chatLesson: null, chatBusy: false, installReady: false };

  /* ------------------------------------------------------------ 基础工具 */
  UI.go = function (hash) { location.hash = hash; };

  UI.toast = function (msg) {
    var old = document.querySelector('.toast');
    if (old) old.remove();
    var t = U.el('div', 'toast', U.esc(msg));
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 1800);
  };

  function esc(s) { return U.esc(s); }
  function lessonMeta(l) {
    return l.phaseZh + ' · ' + l.num + ' · ' + (l.type === 'Build' ? '动手' : '讲解') + ' · ' + (l.min || 25) + ' 分钟';
  }
  function statusTag(l) {
    var p = Store.state.progress[l.id];
    if (!p || p.status === 'new') return '';
    if (p.status === 'mastered') return '<span class="tag g">已掌握</span>';
    return '<span class="tag w">学到 ' + p.step + ' 步</span>';
  }
  function bar(pct) {
    return '<div class="bar"><i style="width:' + U.clamp(pct, 0, 100) + '%"></i></div>';
  }

  /* --------------------------------------------------------------- 顶栏 */
  UI.renderTop = function (title, sub, back) {
    var el = U.$('#topbar');
    el.innerHTML =
      (back ? '<button class="iconbtn" data-act="back">‹</button>' : '') +
      '<h1>' + esc(title) + (sub ? ' <span class="sub">' + esc(sub) + '</span>' : '') + '</h1>' +
      '<button class="iconbtn" data-act="go:#/chat" title="问导师">💬</button>';
  };

  /* -------------------------------------------------------------- Tab 栏 */
  var TABS = [
    { h: '#/home', ic: '🎯', t: '学习' },
    { h: '#/paths', ic: '🗺️', t: '路线' },
    { h: '#/chat', ic: '💬', t: '导师' },
    { h: '#/review', ic: '🔁', t: '复习' },
    { h: '#/me', ic: '👤', t: '我的' }
  ];

  UI.renderTabs = function (cur) {
    var base = '#/' + (String(cur).replace(/^#\/?/, '').split('/')[0] || 'home');
    U.$('#tabbar').innerHTML = TABS.map(function (t) {
      return '<button data-act="go:' + t.h + '" class="' + (base === t.h ? 'on' : '') + '">' +
        '<span class="ic">' + t.ic + '</span><span>' + t.t + '</span></button>';
    }).join('');
  };

  /* ---------------------------------------------------------------- 首页 */
  UI.home = function () {
    var st = Progress.summary();
    var rec = Rec.next({ limit: 1, minutes: Store.state.profile.minutesPerDay })[0];
    var lastId = Store.state.lastLessonId;
    var last = lastId ? AAM.lesson(lastId) : null;
    var lastP = lastId ? Store.state.progress[lastId] : null;

    var h = '';

    /* 首次使用：10 秒设置目标 */
    if (!Store.state.profile.onboarded) {
      h += '<div class="card"><div class="row between"><b>先花 10 秒定个方向</b></div>' +
        '<div class="hint">我会据此安排每天的推荐内容。</div>' +
        '<h2 class="sec">你的目标</h2><div class="chips">' +
        [['agent', '做 Agent'], ['llm', 'LLM 应用'], ['multimodal', '多模态'], ['safety', '安全对齐'], ['infra', '生产化']]
          .map(function (x) { return '<button class="chip ' + (Store.state.profile.goal === x[0] ? 'on' : '') + '" data-act="setgoal:' + x[0] + '">' + x[1] + '</button>'; }).join('') +
        '</div><h2 class="sec">每天能学多久</h2><div class="chips">' +
        [5, 15, 30, 60].map(function (m) { return '<button class="chip ' + (Store.state.profile.minutesPerDay === m ? 'on' : '') + '" data-act="setmin:' + m + '">' + m + ' 分钟</button>'; }).join('') +
        '</div><div style="margin-top:12px"><button class="btn primary block" data-act="onboarded">就这样，开始学</button></div></div>';
    }

    /* 今日推荐 */
    if (rec) {
      var l = rec.lesson;
      h += '<div class="card hero">' +
        '<div class="meta">今日推荐 · ' + esc(l.phaseZh) + '</div>' +
        '<div style="font-size:19px;font-weight:650;margin:6px 0">' + esc(AAM.title(l)) + '</div>' +
        '<div class="meta" style="margin-bottom:10px">' + esc(lessonMeta(l)) + '</div>' +
        '<div style="font-size:14px;opacity:.95">' + esc(rec.reason) + '</div>' +
        (l.s ? '<div class="meta" style="margin-top:8px">' + esc(l.s.slice(0, 70)) + '…</div>' : '') +
        '<div class="row wrap" style="margin-top:12px">' +
        '<button class="btn ghost" data-act="act:learn:' + l.id + '">开始学</button>' +
        '<button class="btn ghost" data-act="go:#/lesson/' + l.id + '">看详情</button>' +
        '<button class="btn ghost" data-act="act:recommend">换一个</button>' +
        '</div></div>';
    }

    /* 统计 */
    h += '<div class="statgrid">' +
      '<div class="stat"><b>' + Math.round(st.todaySeconds / 60) + '</b><span>今日分钟</span></div>' +
      '<div class="stat"><b>' + st.mastered + '</b><span>已掌握</span></div>' +
      '<div class="stat"><b>' + st.streak + '</b><span>连续天数</span></div>' +
      '</div>';

    /* 断点续学 */
    if (last && lastP && lastP.status === 'learning') {
      h += '<h2 class="sec">断点续学</h2><div class="item" data-act="go:#/lesson/' + last.id + '">' +
        '<div class="no">' + esc(last.num) + '</div><div class="grow"><div class="t ellip">' + esc(AAM.title(last)) + '</div>' +
        '<div class="d">' + esc(last.phaseZh) + ' · 上次到第 ' + lastP.step + ' 步</div></div>' +
        '<span class="tag w">继续</span></div>';
    }

    /* 待复习 */
    if (st.dueReviews > 0) {
      h += '<div class="card"><div class="row between"><div><b>' + st.dueReviews + ' 节课到复习时间</b>' +
        '<div class="meta">趁还没忘，5 分钟过一遍</div></div>' +
        '<button class="btn sm primary" data-act="go:#/review">去复习</button></div></div>';
    }

    /* 常见问题直达 */
    h += '<h2 class="sec">直接问导师</h2><div class="chips">' +
      ['什么是 AI Agent', 'MCP 和 Function Calling 有什么区别', 'Agent 为什么会死循环', 'RAG 还是微调',
        '什么时候上多智能体', '提示注入怎么防', '怎么评测 Agent', '我该从哪里开始学']
        .map(function (q) { return '<button class="chip" data-act="ask:' + esc(q) + '">' + esc(q) + '</button>'; }).join('') +
      '</div>';

    /* 全书进度 */
    h += '<h2 class="sec">整体进度</h2><div class="card">' +
      '<div class="row between" style="margin-bottom:8px"><span class="meta">已学 ' + st.learned + ' / ' + st.total + ' 节</span>' +
      '<span class="meta">' + U.fmtMin(st.seconds) + '</span></div>' + bar(st.learned / st.total * 100) + '</div>';

    return h;
  };

  /* -------------------------------------------------------------- 路线页 */
  UI.paths = function (tab) {
    var h = '<div class="chips" style="margin-bottom:12px">' +
      '<button class="chip ' + (tab !== 'all' ? 'on' : '') + '" data-act="go:#/paths">精选路线</button>' +
      '<button class="chip ' + (tab === 'all' ? 'on' : '') + '" data-act="go:#/paths/all">全部课程（20 Phase）</button>' +
      '</div>';

    if (tab === 'all') {
      AAM.phases().forEach(function (p) {
        h += '<details class="acc" data-phase="' + esc(p.id) + '"><summary><b>' + esc(p.zh || p.en) + '</b> ' +
          '<span class="meta">阶段 ' + p.id + ' · ' + p.lessons.length + ' 节</span></summary>' +
          '<div class="body" data-lazy="' + esc(p.id) + '"></div></details>';
      });
      return h;
    }

    Rec.routes().forEach(function (r) {
      var pg = Rec.routeProgress(r.id);
      var cur = Rec.route(r.id);
      h += '<div class="card tap" data-act="go:#/route/' + r.id + '">' +
        '<div class="row between"><b>' + esc(r.zh) + '</b><span class="tag">' + pg.total + ' 节</span></div>' +
        '<div class="meta" style="margin:6px 0 8px">' + esc(r.desc || '') + '</div>' +
        bar(pg.pct) + '<div class="row between" style="margin-top:8px">' +
        '<span class="meta">' + pg.done + '/' + pg.total + ' 已掌握</span>' +
        '<span class="meta">' + (pg.current ? '下一节：' + esc(AAM.title(pg.current)) : '已完成 🎉') + '</span>' +
        '</div></div>';
    });
    return h;
  };

  /* ------------------------------------------------------------ 路线详情 */
  UI.route = function (id) {
    var r = Rec.route(id);
    if (!r) return '<div class="empty">没有这条路线</div>';
    var pg = Rec.routeProgress(id);
    var h = '<div class="card"><b>' + esc(r.zh) + '</b><div class="meta" style="margin:6px 0 8px">' + esc(r.desc || '') + '</div>' +
      bar(pg.pct) + '<div class="row between" style="margin-top:8px"><span class="meta">' + pg.done + '/' + pg.total + ' 已掌握</span>' +
      '<span class="meta">约 ' + U.fmtMin(r.items.reduce(function (a, b) { return a + (b.minutes || 25); }, 0) * 60) + '</span></div>' +
      '<div style="margin-top:10px"><button class="btn primary block" data-act="act:learn:' + (pg.current ? pg.current.id : r.items[0].id) + '">' +
      (pg.current ? '继续：' + esc(AAM.title(pg.current)) : '重新开始') + '</button></div></div>';

    h += '<h2 class="sec">课程清单</h2>';
    r.items.forEach(function (it) {
      var l = AAM.lesson(it.id);
      if (!l) return;
      var p = Store.state.progress[l.id];
      h += '<div class="item ' + (p && p.status === 'mastered' ? 'done' : '') + '" data-act="go:#/lesson/' + l.id + '">' +
        '<div class="no">' + esc(l.num) + '</div><div class="grow"><div class="t ellip">' + esc(AAM.title(l)) + '</div>' +
        '<div class="d">' + esc(l.phaseZh) + ' · ' + (it.minutes || 25) + ' 分钟</div></div>' + statusTag(l) + '</div>';
    });
    return h;
  };

  /* -------------------------------------------------------------- 课程页 */
  UI.lesson = function (id) {
    var l = AAM.lesson(id);
    if (!l) return '<div class="empty">没有这一节</div>';
    var c = AAM.getContent(id);
    var p = Progress.get(id);
    var h = '<div class="card"><div class="meta">' + esc(l.phaseZh) + ' · 第 ' + esc(l.num) + ' 节</div>' +
      '<div style="font-size:18px;font-weight:650;margin:4px 0 6px">' + esc(AAM.title(l)) + '</div>' +
      '<div class="meta">' + esc(lessonMeta(l)) + '</div>' +
      (l.s ? '<div style="margin-top:10px">' + esc(l.s) + '</div>' : '') +
      (l.k ? '<div class="meta" style="margin-top:8px">覆盖：' + esc(l.k) + '</div>' : '') +
      '<div class="row wrap" style="margin-top:12px">' +
      '<button class="btn primary" data-act="act:learn:' + id + '">' + (p && p.step ? '继续学' : '开始学') + '</button>' +
      (c ? '<button class="btn" data-act="act:quiz:' + id + '">直接做题</button>' : '') +
      '<button class="btn" data-act="open:' + AAM.repoUrl(l) + '">仓库原文</button>' +
      '<button class="btn" data-act="open:' + AAM.siteUrl(l) + '">课程官网</button>' +
      '</div></div>';

    /* 掌握度 */
    h += '<div class="card"><div class="row between" style="margin-bottom:8px"><b>掌握度</b><span class="meta">' + p.mastery + '%</span></div>' +
      bar(p.mastery) +
      '<div class="row between" style="margin-top:10px"><span class="meta">学习 ' + U.fmtMin(p.seconds) + ' · 对 ' + p.quizRight + ' / 错 ' + p.quizWrong + '</span>' +
      '<button class="btn sm" data-act="act:mastered:' + id + '">标记已掌握</button></div></div>';

    if (c) {
      h += '<h2 class="sec">这一节的要点</h2><div class="card">' +
        '<div style="margin-bottom:10px"><b>为什么重要：</b>' + esc(c.why) + '</div>' +
        (c.points || []).map(function (pt, i) {
          return '<div style="margin-bottom:10px"><b>' + (i + 1) + '. ' + esc(pt.h) + '</b><div class="meta" style="color:var(--text)">' + esc(pt.b) + '</div></div>';
        }).join('') + '</div>';

      if (c.terms && c.terms.length) {
        h += '<h2 class="sec">关键术语</h2><div class="card">' + c.terms.map(function (t) {
          return '<div style="margin-bottom:8px"><span class="tag">' + esc(t.t) + '</span><div class="meta">' + esc(t.d) + '</div></div>';
        }).join('') + '</div>';
      }
      if (c.practice) {
        h += '<h2 class="sec">动手任务</h2><div class="card">' + esc(c.practice) + '</div>';
      }
    } else {
      h += '<div class="card"><div class="meta">这一节还没有精编中文讲解。可以让导师按仓库摘要展开，或直接读原文。</div>' +
        '<div class="row wrap" style="margin-top:10px"><button class="btn primary" data-act="act:learn:' + id + '">让导师讲这节</button></div></div>';
    }

    var rel = Rec.related(id, 4);
    if (rel.length) {
      h += '<h2 class="sec">相关章节</h2>' + rel.map(function (x) {
        return '<div class="item" data-act="go:#/lesson/' + x.id + '"><div class="no">' + esc(x.num) + '</div>' +
          '<div class="grow"><div class="t ellip">' + esc(AAM.title(x)) + '</div><div class="d">' + esc(x.phaseZh) + '</div></div></div>';
      }).join('');
    }

    /* 下一节 */
    var nx = Rec.nextLessonOf(id);
    if (nx) h += '<div style="margin:14px 0"><button class="btn block" data-act="go:#/lesson/' + nx.id + '">下一节：' + esc(AAM.title(nx)) + '</button></div>';
    return h;
  };

  /* -------------------------------------------------------------- 对话页 */
  UI.chat = function () {
    var id = state.chatLesson || Store.state.lastLessonId;
    var l = id ? AAM.lesson(id) : null;
    var msgs = id ? Tutor.messages(id) : [];

    var h = '<div class="chatwrap"><div class="chatlog" id="chatlog">';
    h += '<div class="msg"><div class="bubble">👋 我是你的 AI Agent 导师，内容来自开源课程 AI Engineering from Scratch（20 个 Phase / 523 节课）。\n\n你可以直接问概念、问故障、问选型，也可以说「继续」让我按章节讲。' +
      (l ? '\n\n当前上下文：' + esc(AAM.title(l)) : '') + '</div>' +
      '<div class="acts">' + ['什么是 AI Agent', '我该从哪里开始学', 'Agent 为什么会死循环', '给我推荐一节课']
        .map(function (q) { return '<button class="act ghost" data-act="ask:' + esc(q) + '">' + esc(q) + '</button>'; }).join('') + '</div></div>';

    msgs.forEach(function (m) {
      h += '<div class="msg ' + (m.role === 'me' ? 'me' : '') + '"><div class="bubble">' + esc(m.text) + '</div>' +
        (m.actions && m.actions.length ? '<div class="acts">' + m.actions.map(function (a) {
          return '<button class="act ' + (/^(打开|看|换)/.test(a.t) ? 'ghost' : '') + '" data-act="act:' + esc(a.v) + '">' + esc(a.t) + '</button>';
        }).join('') + '</div>' : '') + '</div>';
    });
    if (state.chatBusy) h += '<div class="msg"><div class="bubble">…</div></div>';
    h += '</div>';

    h += '<div class="composer"><textarea id="chatInput" rows="1" placeholder="' +
      (l ? '问「' + esc(AAM.title(l)) + '」相关的问题，或说「继续」' : '问点什么，比如「什么是 MCP」') + '"></textarea>' +
      '<button class="send" data-act="send">发送</button></div></div>';
    return h;
  };

  UI.scrollChat = function () {
    var log = U.$('#chatlog');
    if (log) log.scrollTop = log.scrollHeight;
  };

  /* -------------------------------------------------------------- 复习页 */
  UI.review = function () {
    var today = U.today();
    var due = Store.state.reviews.filter(function (r) { return r.due <= today; });
    var h = '';

    h += '<h2 class="sec">到期复习（' + due.length + '）</h2>';
    if (!due.length) h += '<div class="empty">今天没有到期的内容，去学一节新的吧。</div>';
    due.forEach(function (r) {
      var l = AAM.lesson(r.lessonId);
      if (!l) return;
      var p = Store.state.progress[r.lessonId] || {};
      h += '<div class="item"><div class="no">' + esc(l.num) + '</div><div class="grow"><div class="t ellip">' + esc(AAM.title(l)) + '</div>' +
        '<div class="d">' + esc(l.phaseZh) + ' · 掌握度 ' + (p.mastery || 0) + '%</div></div>' +
        '<button class="btn sm primary" data-act="act:quiz:' + l.id + '">做题</button></div>';
    });

    h += '<h2 class="sec">错题本（' + Store.state.mistakes.length + '）</h2>';
    if (!Store.state.mistakes.length) h += '<div class="empty">还没有错题。</div>';
    Store.state.mistakes.slice(0, 12).forEach(function (m) {
      var l = AAM.lesson(m.lessonId);
      h += '<div class="card" style="margin-bottom:8px"><div class="meta">' + esc(l ? AAM.title(l) : m.lessonId) + '</div>' +
        '<div>' + esc(m.q) + '</div>' +
        '<div class="row" style="margin-top:8px"><button class="btn sm" data-act="act:learn:' + m.lessonId + '">重学这节</button></div></div>';
    });

    var weak = Rec.weakPhases();
    if (weak.length) {
      h += '<h2 class="sec">薄弱环节</h2><div class="card">' + weak.map(function (w) {
        var p = AAM.phaseById(w.phase);
        return '<div class="row between"><span>' + esc(p ? (p.zh || p.en) : w.phase) + '</span><span class="tag w">' + w.count + ' 次答错</span></div>';
      }).join('') + '</div>';
    }

    /* 术语速览 */
    var gl = AAM.catalog.glossary || [];
    if (gl.length) {
      var pick = U.shuffle(gl).slice(0, 5);
      h += '<h2 class="sec">术语速览</h2>';
      pick.forEach(function (g) {
        h += '<details class="acc"><summary><b>' + esc(g.t) + '</b> <span class="meta">' + esc(g.c) + '</span></summary>' +
          '<div class="body"><div>' + esc(g.d) + '</div>' +
          (g.w ? '<div class="meta" style="margin-top:6px"><b>为什么重要：</b>' + esc(g.w) + '</div>' : '') + '</div></details>';
      });
      h += '<div style="margin-top:10px"><button class="btn block" data-act="reroll">换一批术语</button></div>';
    }
    return h;
  };

  /** 全部课程页：Phase 展开时按需渲染，避免一次性建 523 个 DOM 节点 */
  UI.phaseBody = function (pid) {
    var p = AAM.phaseById(pid);
    if (!p) return '';
    return '<div class="meta" style="margin-bottom:8px">' + esc(p.descZh || p.desc) + '</div>' +
      p.lessons.map(function (l) {
        return '<div class="item" data-act="go:#/lesson/' + l.id + '"><div class="no">' + esc(l.num) + '</div>' +
          '<div class="grow"><div class="t ellip">' + esc(AAM.title(l)) + '</div>' +
          '<div class="d">' + esc(l.type === 'Build' ? '动手' : '讲解') + ' · ' + esc(l.lang) + '</div></div>' + statusTag(l) + '</div>';
      }).join('');
  };

  /* ---------------------------------------------------------------- 我的 */
  UI.me = function () {
    var st = Progress.summary();
    var s = Store.state.settings;
    var h = '<div class="statgrid">' +
      '<div class="stat"><b>' + st.learned + '</b><span>学过</span></div>' +
      '<div class="stat"><b>' + st.mastered + '</b><span>掌握</span></div>' +
      '<div class="stat"><b>' + U.fmtMin(st.seconds).replace(' 分钟', '′') + '</b><span>总时长</span></div>' +
      '</div>';

    h += '<h2 class="sec">学习目标</h2><div class="card">' +
      '<div class="field"><label>方向</label><div class="chips">' +
      [['agent', 'Agent 工程'], ['llm', 'LLM 应用'], ['multimodal', '多模态'], ['safety', '安全对齐'], ['infra', '生产化'], ['rag', '检索/RAG']]
        .map(function (x) { return '<button class="chip ' + (Store.state.profile.goal === x[0] ? 'on' : '') + '" data-act="setgoal:' + x[0] + '">' + x[1] + '</button>'; }).join('') +
      '</div></div>' +
      '<div class="field"><label>每天学习时长（决定推荐哪种体量的课）</label><div class="chips">' +
      [5, 15, 30, 60].map(function (m) { return '<button class="chip ' + (Store.state.profile.minutesPerDay === m ? 'on' : '') + '" data-act="setmin:' + m + '">' + m + ' 分钟</button>'; }).join('') +
      '</div></div></div>';

    h += '<h2 class="sec">当前路线</h2><div class="card"><div class="chips">' +
      Rec.routes().slice(0, 8).map(function (r) {
        return '<button class="chip ' + (Store.state.profile.routeId === r.id ? 'on' : '') + '" data-act="setroute:' + r.id + '">' + esc(r.zh) + '</button>';
      }).join('') + '</div></div>';

    h += '<h2 class="sec">模型接入（可选）</h2><div class="card">' +
      '<div class="hint" style="margin-bottom:10px">不填也能用：默认用内置的检索式讲解。填了之后，导师会用检索到的课程片段作为上下文，让模型组织回答。</div>' +
      '<div class="field"><label>启用</label><select data-field="llm.enabled">' +
      '<option value="0"' + (!s.llm.enabled ? ' selected' : '') + '>关闭（离线模式）</option>' +
      '<option value="1"' + (s.llm.enabled ? ' selected' : '') + '>开启（OpenAI 兼容接口）</option></select></div>' +
      '<div class="field"><label>Base URL</label><input data-field="llm.baseUrl" value="' + esc(s.llm.baseUrl) + '"></div>' +
      '<div class="field"><label>API Key</label><input data-field="llm.apiKey" type="password" value="' + esc(s.llm.apiKey) + '"></div>' +
      '<div class="field"><label>模型</label><input data-field="llm.model" value="' + esc(s.llm.model) + '"></div>' +
      '<div class="hint">密钥只保存在本机浏览器 localStorage，不会上传任何地方。</div></div>';

    h += '<h2 class="sec">装到手机桌面（离线可学）</h2><div class="card">' +
      '<div class="meta">安装后全屏运行、断网也能打开，学习和进度都在本机。</div>' +
      '<div class="row wrap" style="margin-top:10px">' +
      '<button class="btn primary" data-act="install">' + (state.installReady ? '添加到主屏幕' : '安装 / 添加到主屏幕') + '</button>' +
      '<button class="btn" data-act="offline">查看离线状态</button></div>' +
      '<div class="hint">iPhone：用 <b>Safari</b> 打开 → 底部「分享」→「添加到主屏幕」。Android / 桌面 Chrome：直接点上面按钮。</div></div>';

    h += '<h2 class="sec">数据</h2><div class="card">' +
      '<div class="row wrap"><button class="btn" data-act="export">导出进度</button>' +
      '<button class="btn" data-act="import">导入进度</button>' +
      '<button class="btn" data-act="reset">清空重来</button></div>' +
      '<div class="hint" style="margin-top:8px">进度存在本地浏览器里；换设备用导出/导入迁移。</div></div>';

    h += '<div class="card"><div class="meta">内容来源：<a href="https://github.com/rohitg00/ai-engineering-from-scratch" target="_blank" rel="noopener">rohitg00/ai-engineering-from-scratch</a>（MIT）。本应用是该仓库课程内容的中文导学外壳，课程原文版权归原作者。</div></div>';
    return h;
  };

})(window.AAM);
