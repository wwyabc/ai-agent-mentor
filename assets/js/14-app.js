/* =========================================================================
 * 启动器：状态装载 → 路由 → 事件委托 → 学习计时
 * ========================================================================= */
(function (AAM) {
  'use strict';

  var U = AAM.util, Store = AAM.store, Progress = AAM.progress, Tutor = AAM.tutor, UI = AAM.ui;

  var ROUTES = {
    home: { title: 'AI Agent 随身导师', render: function () { return UI.home(); } },
    paths: { title: '学习路线', render: function (p) { return UI.paths(p[0]); } },
    route: { title: '路线详情', render: function (p) { return UI.route(p[0]); }, back: '#/paths' },
    lesson: { title: '课程详情', render: function (p) { return UI.lesson(p[0]); }, back: '#/paths' },
    chat: { title: '导师对话', render: function () { return UI.chat(); } },
    review: { title: '复习与错题', render: function () { return UI.review(); } },
    me: { title: '我的', render: function () { return UI.me(); } }
  };

  var current = { name: 'home', params: [] };

  function parseHash() {
    var h = (location.hash || '#/home').replace(/^#\/?/, '');
    var seg = h.split('/').filter(Boolean);
    return { name: seg[0] || 'home', params: seg.slice(1) };
  }

  function render() {
    current = parseHash();
    var r = ROUTES[current.name] || ROUTES.home;
    UI.renderTop(r.title, current.name === 'lesson' ? '' : '', r.back);
    UI.renderTabs('#/' + current.name);
    var view = U.$('#view');
    view.innerHTML = '<section class="view">' + r.render(current.params) + '</section>';
    window.scrollTo(0, 0);
    afterRender();
  }

  function afterRender() {
    if (current.name === 'chat') {
      UI.scrollChat();
      var ta = U.$('#chatInput');
      if (ta) {
        ta.addEventListener('input', function () {
          ta.style.height = 'auto';
          ta.style.height = Math.min(ta.scrollHeight, 110) + 'px';
        });
        ta.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); }
        });
        ta.focus();
      }
    }
  }

  function renderChatOnly() {
    if (current.name !== 'chat') { UI.go('#/chat'); return; }
    var view = U.$('#view');
    view.innerHTML = '<section class="view">' + UI.chat() + '</section>';
    UI.scrollChat();
    afterRender();
  }

  /* ------------------------------------------------------------ 对话动作 */
  function pushBot(id, res) {
    Tutor.push(id, 'ai', res.text, { actions: res.actions || [] });
  }

  function startLearn(id) {
    var l = AAM.lesson(id);
    if (!l) return;
    Store.state.lastLessonId = id;
    UI.state.chatLesson = id;
    Progress.touch(id);
    pushBot(id, Tutor.start(id));
    UI.go('#/chat');
  }

  function doAction(v) {
    var id = UI.state.chatLesson || Store.state.lastLessonId;

    if (v.indexOf('learn:') === 0) { startLearn(v.slice(6)); return; }
    if (v.indexOf('quiz:') === 0) {
      var qid = v.slice(5);
      Store.state.lastLessonId = qid; UI.state.chatLesson = qid;
      Progress.touch(qid);
      var s = Tutor.session(qid); s.mode = 'quiz'; s.quizIdx = 0; Store.save();
      pushBot(qid, Tutor.respond('考我', { lessonId: qid }));
      renderChatOnly();
      return;
    }
    if (v.indexOf('mastered:') === 0) {
      Progress.markMastered(v.slice(9));
      UI.toast('已标记为掌握');
      render();
      return;
    }
    if (v.indexOf('repo:') === 0) { window.open(AAM.repoUrl(AAM.lesson(v.slice(5))), '_blank'); return; }
    if (v.indexOf('site:') === 0) { window.open(AAM.siteUrl(AAM.lesson(v.slice(5))), '_blank'); return; }
    if (v.indexOf('goto:') === 0) { UI.go('#/' + v.slice(5)); return; }
    if (v === 'nextLesson') {
      var nx = AAM.recommend.nextLessonOf(id);
      if (nx) startLearn(nx.id); else UI.toast('这条路线学完了 🎉');
      return;
    }
    if (v.indexOf('ans:') === 0) {
      var s2 = Tutor.session(id);
      pushBot(id, Tutor.submitQuiz(id, s2.quizIdx, parseInt(v.slice(4), 10)));
      renderChatOnly();
      return;
    }
    if (v === 'recommend') {
      var rec = Tutor.recommend();
      var gid = 'general';
      pushBot(gid, rec);
      UI.state.chatLesson = null;
      renderChatOnly();
      return;
    }
    /* 其余：next / quiz / practice / restart */
    var res = Tutor.respond(v, { lessonId: id });
    pushBot(id || 'general', res);
    renderChatOnly();
  }

  function doSend() {
    var ta = U.$('#chatInput');
    if (!ta) return;
    var text = ta.value.trim();
    if (!text) return;
    ta.value = '';
    var id = UI.state.chatLesson || Store.state.lastLessonId || 'general';
    Tutor.push(id, 'me', text);
    UI.state.chatBusy = true;
    renderChatOnly();
    Tutor.respondSmart(text, { lessonId: id === 'general' ? null : id }).then(function (res) {
      UI.state.chatBusy = false;
      if (res.refs && res.refs[0]) UI.state.chatLesson = res.refs[0];
      pushBot(id, res);
      renderChatOnly();
    });
  }

  function doAsk(q) {
    Store.state.lastLessonId = Store.state.lastLessonId || null;
    UI.go('#/chat');
    setTimeout(function () {
      var id = UI.state.chatLesson || Store.state.lastLessonId || 'general';
      Tutor.push(id, 'me', q);
      UI.state.chatBusy = true;
      renderChatOnly();
      Tutor.respondSmart(q, { lessonId: id === 'general' ? null : id }).then(function (res) {
        UI.state.chatBusy = false;
        if (res.refs && res.refs[0]) UI.state.chatLesson = res.refs[0];
        pushBot(id, res);
        renderChatOnly();
      });
    }, 30);
  }

  /* -------------------------------------------------------------- 设置项 */
  function setField(path, val) {
    var seg = path.split('.'), obj = Store.state.settings;
    for (var i = 0; i < seg.length - 1; i++) obj = obj[seg[i]];
    obj[seg[seg.length - 1]] = val;
    Store.save();
  }

  /* -------------------------------------------------------- 事件委托绑定 */
  document.addEventListener('click', function (e) {
    /* Phase 折叠面板：首次展开时再渲染课程列表 */
    var det = e.target.closest ? e.target.closest('details[data-phase]') : null;
    if (det) {
      var body = det.querySelector('[data-lazy]');
      if (body && !body.innerHTML) body.innerHTML = AAM.ui.phaseBody(det.getAttribute('data-phase'));
    }

    var t = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!t) return;
    var v = t.getAttribute('data-act');

    if (v.indexOf('go:') === 0) { UI.go(v.slice(3)); return; }
    if (v === 'back') { history.back(); return; }
    if (v.indexOf('act:') === 0) { doAction(v.slice(4)); return; }
    if (v.indexOf('ask:') === 0) { doAsk(v.slice(4)); return; }
    if (v.indexOf('open:') === 0) { window.open(v.slice(5), '_blank', 'noopener'); return; }
    if (v.indexOf('setgoal:') === 0) { Store.state.profile.goal = v.slice(8); Store.save(); render(); return; }
    if (v.indexOf('setmin:') === 0) { Store.state.profile.minutesPerDay = parseInt(v.slice(7), 10); Store.save(); render(); return; }
    if (v.indexOf('setroute:') === 0) { Store.state.profile.routeId = v.slice(9); Store.save(); UI.toast('已切换路线'); render(); return; }
    if (v === 'onboarded') { Store.state.profile.onboarded = true; Store.save(); UI.toast('已按你的目标排好推荐'); render(); return; }
    if (v === 'send') { doSend(); return; }
    if (v === 'install') { doInstall(); return; }
    if (v === 'offline') { offlineStatus(); return; }
    if (v === 'reroll') { render(); return; }
    if (v === 'export') {
      var blob = new Blob([Store.export()], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'ai-agent-mentor-progress.json';
      a.click();
      UI.toast('已导出');
      return;
    }
    if (v === 'import') {
      var inp = document.createElement('input');
      inp.type = 'file'; inp.accept = '.json,application/json';
      inp.onchange = function () {
        var f = inp.files[0]; if (!f) return;
        var fr = new FileReader();
        fr.onload = function () {
          try { Store.import(fr.result); UI.toast('导入成功'); render(); }
          catch (err) { UI.toast('文件格式不对'); }
        };
        fr.readAsText(f);
      };
      inp.click();
      return;
    }
    if (v === 'reset') {
      if (window.confirm('清空所有学习进度？此操作不可恢复。')) { Store.reset(); UI.toast('已清空'); render(); }
      return;
    }
  });

  document.addEventListener('change', function (e) {
    var f = e.target.getAttribute && e.target.getAttribute('data-field');
    if (!f) return;
    var val = e.target.value;
    if (e.target.tagName === 'SELECT') val = val === '1';
    setField(f, val);
    UI.toast('已保存');
  });

  /* ------------------------------------------------------- PWA 安装提示 */
  var deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    UI.state.installReady = true;
    if (current.name === 'me') render();
  });
  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    UI.toast('已安装到桌面，之后断网也能学');
  });

  function doInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function () { deferredPrompt = null; });
      return;
    }
    var standalone = (window.navigator.standalone) ||
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
    if (standalone) UI.toast('已经在桌面模式运行了');
    else UI.toast('iPhone：Safari → 分享 → 添加到主屏幕');
  }

  function offlineStatus() {
    var sw = navigator.serviceWorker && navigator.serviceWorker.controller;
    UI.toast((navigator.onLine ? '当前在线' : '当前离线') +
      (sw ? ' · 离线包已就绪，断网也能学' : ' · 离线包尚未安装，先访问一次页面'));
  }

  /* ---------------------------------------------------------- 学习计时器 */
  var TICK = 30;
  setInterval(function () {
    if (document.visibilityState !== 'visible') return;
    var id = UI.state.chatLesson || Store.state.lastLessonId;
    if (!id) return;
    if (current.name === 'chat' || current.name === 'lesson') Progress.addTime(id, TICK);
  }, TICK * 1000);

  /* ------------------------------------------------------------------ 启动 */
  Store.load();
  if (!Store.state.profile.routeId) Store.state.profile.routeId = 'agent-core';
  window.addEventListener('hashchange', render);
  render();

})(window.AAM);
