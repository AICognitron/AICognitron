// =====================================================================
// THINK-X event settings — edit this file, then restart the server.
// (There is no coordinator login any more: everything is set here.)
// Times are India time (+05:30).
// =====================================================================

// Event start and the deadline of each phase (1 week per phase).
// Each phase opens automatically when the previous one's deadline passes.
export const EVENT_START = '2026-10-04T09:00:00+05:30';
export const DEADLINES = {
  1: '2026-10-11T09:00:00+05:30',
  2: '2026-10-18T09:00:00+05:30',
  3: '2026-10-25T09:00:00+05:30',
  4: '2026-11-01T09:00:00+05:30',
};

// Phase 1 domains (shown to everyone once the event starts).
// Keep each id the same once teams have submitted under it.
export const DOMAINS = [
  { id: '0e945ea7-3af2-4027-a024-5fae53ee2191', title: 'Campus', description: 'Problems you are facing in your school, college or office campus.' },
];

// Datasets / briefs for Phases 2–4. Put the files in server/content/
// Teams can see and download them once that phase has opened.
export const RESOURCES = [
  // { id: 'p3-dataset', phase: 3, title: 'Canteen footfall – Aug 2026', description: 'Analyse this dataset.', file: 'canteen.csv' },
];

// Twists: revealed to participants automatically at revealAt.
// Leave revealAt empty ('') to keep a twist hidden. Optional file goes in server/content/
export const TWISTS = {
  2: { revealAt: '2026-10-14T09:00:00+05:30', text: 'Your budget is now reduced to ₹2,500. Modify your solution and send your revised entry below.', file: '' },
  3: { revealAt: '', text: 'NEW INFORMATION: (write the Phase 3 twist here and set revealAt)', file: '' },
};
