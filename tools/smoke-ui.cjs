/**
 * 界面渲染冒烟：用最小 DOM 桩件跑一遍各个页面的渲染函数，确保不抛错且产出内容。
 * 用法：node tools/smoke-ui.cjs
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const files = fs.readdirSync(path.join(root, 'assets/js')).filter((f) => /^\d\d-.*\.js$/.test(f)).sort();

const storage = {};
const fakeLS = { getItem: (k) => (k in storage ? storage[k] : null), setItem: (k, v) => { storage[k] = String(v); } };
const mkNode = () => ({ innerHTML: '', style: {}, className: '', appendChild() {}, remove() {}, addEventListener() {}, focus() {}, scrollTop: 0, scrollHeight: 0, value: '' });
const fakeDoc = {
  querySelector: () => mkNode(),
  querySelectorAll: () => [],
  createElement: () => mkNode(),
  addEventListener: () => {},
  body: { appendChild() {} }
};

global.window = global;
global.addEventListener = () => {};
global.scrollTo = () => {};
global.document = fakeDoc;
global.localStorage = fakeLS;
global.fetch = () => Promise.reject(new Error('offline'));

// 13-ui / 14-app 需要 document.addEventListener，已桩件化
files.forEach((f) => {
  const code = fs.readFileSync(path.join(root, 'assets/js', f), 'utf8');
  new Function('window', 'document', 'localStorage', 'fetch', 'Blob', 'URL', 'FileReader', 'location', code)(
    global, fakeDoc, fakeLS, global.fetch, function () {}, { createObjectURL: () => '' }, function () {}, { hash: '#/home' }
  );
});

const AAM = global.AAM;
AAM.store.load();
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✅ ' + name); } else { fail++; console.log('  ❌ ' + name + (extra ? '  → ' + extra : '')); }
}

const cases = [
  ['首页', () => AAM.ui.home()],
  ['路线页', () => AAM.ui.paths()],
  ['全部课程页', () => AAM.ui.paths('all')],
  ['路线详情(agent-core)', () => AAM.ui.route('agent-core')],
  ['路线详情(MCP)', () => AAM.ui.route('model-context-protocol')],
  ['课程页(有精编)', () => AAM.ui.lesson('14-01')],
  ['课程页(无精编)', () => AAM.ui.lesson('19-05')],
  ['对话页', () => AAM.ui.chat()],
  ['复习页', () => AAM.ui.review()],
  ['我的页', () => AAM.ui.me()]
];

console.log('\n[渲染]');
cases.forEach(function (c) {
  var out = '', err = null;
  try { out = c[1](); } catch (e) { err = e; }
  ok(c[0], !err && String(out).length > 80, err ? err.message : 'len=' + String(out).length);
});

/* 走一遍真实交互：开始学 → 继续 → 做题 */
console.log('\n[交互]');
var err2 = null;
try {
  AAM.tutor.push('14-01', 'ai', AAM.tutor.start('14-01').text);
  AAM.tutor.push('14-01', 'ai', AAM.tutor.respond('继续', { lessonId: '14-01' }).text);
  AAM.tutor.session('14-01').mode = 'quiz';
  AAM.tutor.session('14-01').quizIdx = 0;
  AAM.tutor.push('14-01', 'ai', AAM.tutor.respond('A', { lessonId: '14-01' }).text);
  AAM.ui.chat();
} catch (e) { err2 = e; }
ok('学习→答题→渲染对话', !err2, err2 && err2.message);
ok('会话消息已落库', AAM.tutor.messages('14-01').length >= 3, AAM.tutor.messages('14-01').length);

console.log('\n结果：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
