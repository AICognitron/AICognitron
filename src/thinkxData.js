// Think-X – Campus Edition: event content (from the official poster)

export const PHASES = [
  {
    n: 1, week: 'WEEK 1', name: 'SPOT-X', cls: 'tx-w1',
    heading: 'Find a Problem Nobody is Solving.',
    text: 'Walk around your campus and identify one genuine problem, inefficiency or inconvenience experienced by students, faculty, visitors or support staff.',
    submit: ['Problem observed', 'Evidence of observation', 'Who is affected?', 'Why does it happen?', 'Your proposed solution'],
    twistLabel: 'Twist',
    twist: 'The problem cannot be copied from an internet/AI-generated list. It must be something you personally observed.',
    award: 'Best Problem Discovery Award',
  },
  {
    n: 2, week: 'WEEK 2', name: 'SOLVE-X', cls: 'tx-w2',
    heading: '₹5,000 Campus Innovation Challenge',
    text: 'Choose one campus problem from Week 1. Design a practical technology/AI solution with a maximum budget of ₹5,000.',
    submit: ['Problem statement', 'Proposed solution', 'AI/technology involved', 'Block diagram', 'Components/software required', 'Estimated cost', 'Expected impact'],
    twistLabel: 'Secret twist',
    twist: 'After submission, your budget is now reduced to ₹2,500. Modify your solution.',
    award: 'Best Solution Award',
  },
  {
    n: 3, week: 'WEEK 3', name: 'DATA-X', cls: 'tx-w3',
    heading: 'Can You Prove the Problem?',
    text: 'Analyse a campus-related dataset provided by the THINK-X team. Find hidden patterns and propose an AI/data-driven solution.',
    submit: ['Observation', 'Pattern', 'Reasoning', 'Decision', 'AI solution'],
    twistLabel: 'Twist',
    twist: 'An additional piece of information will be given midway. You must reconsider your conclusion.',
    award: 'Data Detective Award',
  },
  {
    n: 4, week: 'WEEK 4', name: 'CAMPUS-X', cls: 'tx-w4',
    heading: 'If You Were the AI Innovation Head of SRM VEC…',
    text: 'Identify ONE campus problem and design a technology/AI solution that could be implemented within the next 12 months.',
    submit: ['Problem', 'Evidence', 'Root Cause', 'Solution', 'AI Component', 'Architecture', 'Cost', 'Impact', 'Limitations', 'Future Scope'],
    submitNote: '10 points',
    twistLabel: null,
    twist: null,
    award: 'Grand Finale Winner – Campus Champion',
  },
];

export const LEADERBOARD = [
  ['Week 1 Winner', 100],
  ['Week 1 Runner-up', 60],
  ['Week 1 Finalist', 30],
  ['Week 2 Winner', 100],
  ['Week 3 Winner', 100],
  ['Week 4 Winner', 200],
  ['Participation', 10],
];

export const PRIZES = [
  ['🏆', 'Weekly Winners', '₹500 – ₹2,000 (each week)'],
  ['🎖️', 'Top 3 Overall', 'Certificates + Special Prizes'],
  ['⭐', 'Campus Champion (End of Month)', '₹5,000 + Certificate + Recognition'],
];

export const JUDGE_QUESTIONS = [
  'Why did you choose this?',
  'What evidence do you have?',
  'Why AI?',
  'What if your assumption is wrong?',
  'Can you implement it for ₹5,000?',
  'What if the budget is halved?',
];

export const COORDINATORS = ['Ms. M. Abinaya – AP/AI&DS', 'Ms. G. Illakiya – AP/AI&DS', 'Ms. J. Renganayagi – AP/AI&DS'];
export const CONVENER = 'Dr. B. Muthusenthil – Head, AI&DS';

export const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
export const RESULTS = ['Pending', 'Winner', 'Runner-up', 'Finalist', 'Participation', 'Rejected'];

// ---------------------------------------------------------------------
// Submission forms for each phase (used by BOTH the website and the server)
// ---------------------------------------------------------------------
const KB = 1024;
const MB = 1024 * 1024;
const WORD = ['.doc', '.docx'];
const IMG_PDF = ['.png', '.jpg', '.jpeg', '.pdf'];

export const FILE_RULES = {
  // Phase 1 abstract: Word only, with a minimum and maximum size
  abstract: { label: 'Abstract (Word file)', ext: WORD, minSize: 5 * KB, maxSize: 10 * MB },
  blockDiagram: { label: 'Block diagram (image or PDF)', ext: IMG_PDF, minSize: 1 * KB, maxSize: 10 * MB },
  solutionDoc: { label: 'Solution document (Word or PPT)', ext: [...WORD, '.ppt', '.pptx'], minSize: 5 * KB, maxSize: 25 * MB },
  revisedDiagram: { label: 'Revised block diagram (image or PDF)', ext: IMG_PDF, minSize: 1 * KB, maxSize: 10 * MB },
  analysis: { label: 'Analysis file (Notebook / Excel / CSV / PDF / Word / ZIP)', ext: ['.ipynb', '.xlsx', '.xls', '.csv', '.pdf', '.doc', '.docx', '.zip', '.py'], minSize: 100, maxSize: 20 * MB },
  architectureDiagram: { label: 'Architecture diagram (image or PDF)', ext: IMG_PDF, minSize: 1 * KB, maxSize: 10 * MB },
  finalDeck: { label: 'Final presentation / report (PPT, PDF or Word)', ext: ['.ppt', '.pptx', '.pdf', ...WORD], minSize: 5 * KB, maxSize: 25 * MB },
};

export const PHASE_FORMS = {
  1: {
    needsDomain: true,
    fields: [
      { key: 'problem', label: 'Problem observed', ph: 'Describe the campus problem you personally observed.' },
      { key: 'evidence', label: 'Evidence of observation', ph: 'Where/when did you see it? Photos, counts, conversations, etc.' },
      { key: 'whoAffected', label: 'Who is affected?', ph: 'Students, faculty, visitors, support staff…' },
      { key: 'whyHappens', label: 'Why does it happen?', ph: 'The root cause as you understand it.' },
      { key: 'solution', label: 'Your proposed solution', ph: 'How would you fix it?' },
    ],
    files: [{ key: 'abstract', required: true }],
  },
  2: {
    fields: [
      { key: 'problemStatement', label: 'Problem statement', ph: 'The Week 1 campus problem you chose.' },
      { key: 'proposedSolution', label: 'Proposed solution', ph: 'Your practical technology/AI solution.' },
      { key: 'aiTech', label: 'AI / technology involved', ph: 'Models, sensors, apps, platforms…' },
      { key: 'components', label: 'Components / software required', ph: 'List each component or tool.' },
      { key: 'estimatedCost', label: 'Estimated cost (₹)', type: 'number', max: 5000, ph: 'Maximum ₹5,000' },
      { key: 'expectedImpact', label: 'Expected impact', ph: 'Who benefits and how much?' },
    ],
    files: [{ key: 'solutionDoc', required: true }, { key: 'blockDiagram', required: false }],
    twist: {
      title: 'Secret twist: budget cut to ₹2,500',
      fields: [
        { key: 'revisedSolution', label: 'Modified solution', ph: 'How does your solution change with half the budget?' },
        { key: 'changes', label: 'What did you remove, replace or simplify?', ph: 'Explain your trade-offs.' },
        { key: 'revisedCost', label: 'Revised cost (₹)', type: 'number', max: 2500, ph: 'Maximum ₹2,500' },
      ],
      files: [{ key: 'revisedDiagram', required: false }],
    },
  },
  3: {
    resourcesLabel: 'Datasets',
    fields: [
      { key: 'observation', label: 'Observation', ph: 'What do you see in the data?' },
      { key: 'pattern', label: 'Pattern', ph: 'The hidden pattern you found.' },
      { key: 'reasoning', label: 'Reasoning', ph: 'Why does this pattern exist?' },
      { key: 'decision', label: 'Decision', ph: 'What should the campus do?' },
      { key: 'aiSolution', label: 'AI solution', ph: 'Your AI/data-driven solution.' },
    ],
    files: [{ key: 'analysis', required: false }],
    twist: {
      title: 'Twist: new information',
      fields: [
        { key: 'revisedConclusion', label: 'Reconsidered conclusion', ph: 'Given the new information, what is your conclusion now?' },
        { key: 'whatChanged', label: 'What changed and why?', ph: 'Did the new information change your decision?' },
      ],
      files: [],
    },
  },
  4: {
    fields: [
      { key: 'problem', label: 'Problem' },
      { key: 'evidence', label: 'Evidence' },
      { key: 'rootCause', label: 'Root cause' },
      { key: 'solution', label: 'Solution' },
      { key: 'aiComponent', label: 'AI component' },
      { key: 'architecture', label: 'Architecture' },
      { key: 'cost', label: 'Cost (₹)' },
      { key: 'impact', label: 'Impact' },
      { key: 'limitations', label: 'Limitations' },
      { key: 'futureScope', label: 'Future scope' },
    ],
    files: [{ key: 'architectureDiagram', required: false }, { key: 'finalDeck', required: true }],
  },
};

// Points per result (from the Think-X poster).
export const RESULT_POINTS_BY_PHASE = {
  1: { Pending: 0, Winner: 100, 'Runner-up': 60, Finalist: 30, Participation: 10, Rejected: 0 },
  2: { Pending: 0, Winner: 100, 'Runner-up': 60, Finalist: 30, Participation: 10, Rejected: 0 },
  3: { Pending: 0, Winner: 100, 'Runner-up': 60, Finalist: 30, Participation: 10, Rejected: 0 },
  4: { Pending: 0, Winner: 200, 'Runner-up': 100, Finalist: 30, Participation: 10, Rejected: 0 },
};

// File types allowed for datasets / resources / twists
export const RESOURCE_EXT = ['.csv', '.xlsx', '.xls', '.json', '.zip', '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt', '.png', '.jpg', '.jpeg', '.ipynb'];

export const fmtSize = n => (n >= MB ? `${(n / MB).toFixed(n % MB ? 1 : 0)} MB` : n < KB ? `${n} bytes` : `${Math.round(n / KB)} KB`);

// =====================================================================
// THINK-X SETTINGS — edit here (no backend: registration and all
// submissions are done through Google Forms; answers are written in
// the Word template of each phase).
// =====================================================================
export const EVENT_START = '2026-10-04T09:00:00+05:30';
// Last date to submit each phase (the next phase is shown as live after this)
export const DEADLINES = {
  1: '2026-10-11T09:00:00+05:30',
  2: '2026-10-18T09:00:00+05:30',
  3: '2026-10-25T09:00:00+05:30',
  4: '2026-11-01T09:00:00+05:30',
};
export const REGISTER_FORM = 'https://forms.gle/kw4DpRn3e2EPZCY58';
// Google Form link for each phase submission ('' = not published yet)
export const SUBMIT_FORMS = { 1: '', 2: '', 3: '', 4: '' };
// Word template for each phase: put the .docx file in public/templates/
// and write its file name here, e.g. 'ThinkX_Phase1_Template.docx' ('' = not available yet)
export const TEMPLATES = { 1: '', 2: '', 3: '', 4: '' };

// Phases students can open. Others show as 🔒 Locked.
// To unlock a phase add its number, e.g. [1, 2] opens Phase 1 and Phase 2.
export const OPEN_PHASES = [1];
