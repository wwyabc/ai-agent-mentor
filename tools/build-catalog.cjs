/**
 * 内容构建脚本：把仓库 ai-engineering-from-scratch 的权威索引
 * （site/data.js，由 build.js 自动生成）转成导师应用的课程数据层。
 *
 * 用法：node tools/build-catalog.cjs
 * 输出：assets/js/04-catalog.js
 *
 * 对应关系：
 *   PHASES[].lessons[]           -> 课程（id = phaseId-lessonNum）
 *   ROADMAP_PREREQS              -> Phase 依赖图（用于前置知识推荐）
 *   LEARNING_PATHS               -> 学习路线（manifest 顺序）
 *   GLOSSARY                     -> 术语卡（概念速查 / 复习闪卡）
 */
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '../../ai-engineering-from-scratch');
const OUT = path.resolve(__dirname, '../assets/js/04-catalog.js');

const src = fs.readFileSync(path.join(REPO, 'site/data.js'), 'utf8');

// data.js 是纯常量声明，整体求值后按需取用，比正则切片更稳
const scope = new Function(
  src + '\nreturn { PHASES, ROADMAP_PREREQS, LEARNING_PATHS, GLOSSARY };'
)();

const PHASES = scope.PHASES;
const ROADMAP_PREREQS = scope.ROADMAP_PREREQS;
const LEARNING_PATHS = scope.LEARNING_PATHS;
const GLOSSARY = scope.GLOSSARY;

const PHASE_ZH = {
  0: '环境搭建与工具链', 1: '数学基础', 2: '机器学习基础', 3: '深度学习核心',
  4: '计算机视觉', 5: 'NLP：基础到进阶', 6: '语音与音频', 7: 'Transformer 深入',
  8: '生成式 AI', 9: '强化学习', 10: '从零构建大模型', 11: 'LLM 工程',
  12: '多模态 AI', 13: '工具与协议', 14: 'Agent 工程', 15: '自主系统',
  16: '多智能体与群体', 17: '基础设施与生产化', 18: '伦理、安全与对齐', 19: '毕业项目'
};

const PHASE_TAG = {
  0: 'foundation', 1: 'foundation', 2: 'foundation', 3: 'foundation',
  4: 'vision', 5: 'nlp', 6: 'audio', 7: 'llm', 8: 'genai', 9: 'rl',
  10: 'llm', 11: 'llm', 12: 'multimodal', 13: 'agent', 14: 'agent',
  15: 'agent', 16: 'agent', 17: 'infra', 18: 'safety', 19: 'project'
};

const PHASE_DESC_ZH = {
  13: 'AI 与现实世界之间的接口层：工具调用、MCP、Agent Skills。',
  14: '从第一性原理构建 Agent，可靠地使用编码智能体，并在动手前先框定工作。',
  15: '长时程 Agent、自我改进与 2026 安全栈。',
  16: '协作、涌现与集体智能。',
  19: '17 个端到端产品 + 9 条深建轨道，每个项目 20-40 小时。'
};

const clip = (s, n) => {
  s = String(s || '').replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
};

const phases = PHASES.map((p) => {
  const pid = String(p.id).padStart(2, '0');
  const lessons = (p.lessons || []).map((l) => {
    const m = /phases\/([^/]+)\/([^/]+)/.exec(l.url || '');
    const num = (m && m[2].split('-')[0]) || '';
    return {
      id: pid + '-' + num,
      num: num,
      en: l.name,
      type: l.type || 'Learn',
      lang: l.lang || '—',
      dir: m ? m[1] : '',
      slug: m ? m[2] : '',
      p: 'phases/' + (m ? m[1] + '/' + m[2] : ''),
      s: clip(l.summary, 170),
      k: clip(l.keywords, 130),
      min: p.id === 19 ? 150 : l.type === 'Build' ? 30 : 20
    };
  });
  return {
    id: pid,
    dir: (lessons[0] && lessons[0].dir) || '',
    en: p.name,
    zh: PHASE_ZH[p.id] || p.name,
    desc: p.desc || '',
    descZh: PHASE_DESC_ZH[p.id] || '',
    tag: PHASE_TAG[p.id] || 'misc',
    status: p.status || '',
    lessons: lessons
  };
});

const paths = LEARNING_PATHS.map((lp) => ({
  id: lp.id,
  title: lp.title,
  summary: clip(lp.summary, 200),
  minutes: lp.estimatedMinutes || 0,
  lessons: (lp.lessons || []).map((l) => ({
    o: l.order,
    p: l.path,
    m: l.minutes || 0,
    r: !!l.required
  }))
}));

const gl = GLOSSARY.map((g) => ({
  t: g.term || '',
  c: g.category || '',
  d: clip(g.means || g.says, 220),
  w: clip(g.whyItMatters, 150),
  e: clip(g.example, 150)
})).filter((g) => g.t && g.d);

const payload = { phases, paths, glossary: gl, prereqs: ROADMAP_PREREQS };

const banner = `/* =========================================================================
 * 课程目录（自动生成，请勿手改）
 * 生成脚本：tools/build-catalog.cjs
 * 数据来源：ai-engineering-from-scratch/site/data.js（仓库权威索引）
 * 共 ${phases.length} 个 Phase / ${phases.reduce((a, p) => a + p.lessons.length, 0)} 节课 / ${paths.length} 条路线 / ${gl.length} 条术语
 * ========================================================================= */`;

fs.writeFileSync(
  OUT,
  banner + '\n(function (AAM) {\n  AAM.loadCatalog(' + JSON.stringify(payload) + ');\n})(window.AAM);\n',
  'utf8'
);
console.log('已生成', OUT);
console.log('phases', phases.length, 'lessons', phases.reduce((a, p) => a + p.lessons.length, 0), 'paths', paths.length, 'glossary', gl.length);
