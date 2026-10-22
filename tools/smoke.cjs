/**
 * 冒烟测试：在 Node 里用最小桩件加载数据层与引擎层，验证核心链路可用。
 * 用法：node tools/smoke.cjs
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const files = [
  '01-core.js', '02-curriculum-a.js', '03-curriculum-b.js', '04-catalog.js',
  '05-zh-titles.js', '06-zh-p19.js', '07-content-a.js', '08-content-b.js', '09-topics.js',
  '10-retriever.js', '11-tutor.js', '12-recommend.js'
];

const storage = {};
const fakeLS = {
  getItem: (k) => (k in storage ? storage[k] : null),
  setItem: (k, v) => { storage[k] = String(v); }
};
const fakeDoc = { querySelector: () => null, querySelectorAll: () => [], createElement: () => ({ style: {} }), addEventListener: () => {} };

global.window = global;
global.document = fakeDoc;
global.localStorage = fakeLS;
global.fetch = () => Promise.reject(new Error('no network in smoke test'));

files.forEach((f) => {
  const code = fs.readFileSync(path.join(root, 'assets/js', f), 'utf8');
  new Function('window', 'document', 'localStorage', 'fetch', code)(global, fakeDoc, fakeLS, global.fetch);
});

const AAM = global.AAM;
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✅ ' + name); }
  else { fail++; console.log('  ❌ ' + name + (extra ? '  → ' + extra : '')); }
}

AAM.store.load();

console.log('\n[目录]');
const all = AAM.allLessons();
ok('课程总数 523', all.length === 523, all.length);
ok('中文标题覆盖 Phase 14', AAM.lesson('14-01').zh === 'Agent 循环', AAM.lesson('14-01').zh);
ok('中文标题覆盖 Phase 19 项目', AAM.lesson('19-01').zh === '终端原生编码 Agent', AAM.lesson('19-01').zh);
ok('Phase 名中文', AAM.phaseById('13').zh === '工具与协议', AAM.phaseById('13').zh);
ok('术语表非空', (AAM.catalog.glossary || []).length > 100, (AAM.catalog.glossary || []).length);
ok('路线数 ≥ 12', AAM.recommend.routes().length >= 12, AAM.recommend.routes().length);
ok('仓库链接可拼', /phases\/14-agent-engineering\/01-the-agent-loop$/.test(AAM.repoUrl(AAM.lesson('14-01'))), AAM.repoUrl(AAM.lesson('14-01')));

console.log('\n[检索]');
const s1 = AAM.search('什么是 MCP');
ok('中文问法命中 MCP 概念卡/课程', s1.length > 0 && s1[0].score > 0.1, JSON.stringify(s1[0]));
const s2 = AAM.search('Agent 为什么会死循环');
ok('故障类问题可检索', s2.length > 0, JSON.stringify(s2[0]));
ok('概念卡匹配', !!AAM.matchTopic('什么是 AI Agent'), '');

console.log('\n[导师]');
const t1 = AAM.tutor.respond('什么是 AI Agent');
ok('概念问答有内容', t1.text.indexOf('工具') >= 0, t1.text.slice(0, 40));
const t2 = AAM.tutor.respond('RAG 还是微调');
ok('选型问答命中概念卡', t2.refs.length > 0, JSON.stringify(t2.refs));
AAM.tutor.start('14-01');
const t3 = AAM.tutor.respond('继续', { lessonId: '14-01' });
ok('讲解脚本可推进', t3.text.indexOf('第 1/') >= 0, t3.text.slice(0, 30));
AAM.tutor.session('14-01').mode = 'quiz';
AAM.tutor.session('14-01').quizIdx = 0;
const t4 = AAM.tutor.respond('A', { lessonId: '14-01' });
ok('选择题可作答', /答对|答错/.test(t4.text), t4.text.slice(0, 20));

console.log('\n[推荐]');
const recs = AAM.recommend.next({ limit: 3 });
ok('推荐返回课程', recs.length === 3 && !!recs[0].lesson, '');
ok('路线进度可算', AAM.recommend.routeProgress('agent-core').total > 0, JSON.stringify(AAM.recommend.routeProgress('agent-core')));
const r2 = AAM.recommend.route('model-context-protocol');
ok('MCP 路线可解析', r2 && r2.items.length > 10, r2 && r2.items.length);

console.log('\n[进度]');
AAM.progress.answer('13-06', true, 'test');
ok('答题提升掌握度', AAM.progress.get('13-06').mastery === 18, AAM.progress.get('13-06').mastery);
ok('复习计划已排', !!AAM.progress.get('13-06').nextReview, '');
AAM.progress.addTime('13-06', 600);
ok('学习时长已累计', AAM.progress.summary().seconds >= 600, '');

console.log('\n结果：' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
