// ─── Shared mock data for community pages ────────────────────────────────────

export interface User {
  name: string;
  initials: string;
  role: string;
  avatar?: string;
}

export interface Post {
  id: number;
  user: User;
  title: string;
  body: string;
  replies: number;
  likes: number;
  tag: string;
  timeAgo: string;
}

export interface Project {
  id: number;
  user: User;
  title: string;
  pattern: string;
  yarn: string;
  status: 'finished' | 'in-progress' | 'frogged';
  likes: number;
  comments: number;
  timeAgo: string;
  color: string;
  emoji: string;
}

export interface CraftAlong {
  id: number;
  title: string;
  description: string;
  pattern: string;
  startDate: string;
  endDate: string;
  participants: number;
  emoji: string;
  color: string;
  tag: string;
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  emoji: string;
  color: string;
  earnedBy: number;
  category: string;
}

// ─── Forums data ──────────────────────────────────────────────────────────────
export const FORUM_TAGS = ['All', 'Techniques', 'Patterns', 'Yarn', 'Help', 'Showcase', 'Events'];

export const FORUM_POSTS: Post[] = [
  { id: 1, user: { name: 'Amara Osei', initials: 'AO', role: 'Amigurumi Designer' }, title: 'Tips for invisible decrease in amigurumi?', body: 'I keep getting visible holes when I do the standard decrease. Has anyone found a trick that works well with cotton yarn specifically?', replies: 14, likes: 32, tag: 'Techniques', timeAgo: '2h ago' },
  { id: 2, user: { name: 'Clara Hooks', initials: 'CH', role: 'Pattern Designer' }, title: 'Just published my Sunburst Blanket pattern — feedback welcome!', body: 'After 3 months of testing I finally released it. Would love constructive critique from experienced makers before I submit it to Ravelry.', replies: 28, likes: 87, tag: 'Patterns', timeAgo: '5h ago' },
  { id: 3, user: { name: 'Mira Tanaka', initials: 'MT', role: 'Beginner' }, title: 'Yarn weight confusion — is DK the same as light worsted?', body: 'I see both terms used interchangeably but they feel different to me. Can someone clarify once and for all?', replies: 9, likes: 21, tag: 'Yarn', timeAgo: '1d ago' },
  { id: 4, user: { name: 'Elise Johansson', initials: 'EJ', role: 'Knitter' }, title: 'How to fix a dropped stitch 10 rows back?', body: "I only just noticed it and I'm too far along to frog everything. Is there a way to fix this without unravelling?", replies: 17, likes: 45, tag: 'Help', timeAgo: '1d ago' },
  { id: 5, user: { name: 'Sofia Reyes', initials: 'SR', role: 'Fiber Artist' }, title: 'Finished my first fair isle sweater! 🎉', body: "Six months in the making. It's not perfect but I'm so proud. Sharing photos in the project journal.", replies: 41, likes: 203, tag: 'Showcase', timeAgo: '2d ago' },
  { id: 6, user: { name: 'Priya Nair', initials: 'PN', role: 'Crochet Tutor' }, title: 'Best way to join yarn for colorwork in the round?', body: "I've tried the Russian join and the magic knot but both leave bumps. Any alternatives for smooth colorwork?", replies: 12, likes: 38, tag: 'Techniques', timeAgo: '3d ago' },
  { id: 7, user: { name: 'Lena Wolf', initials: 'LW', role: 'Designer' }, title: 'Spring Craft-Along starts March 30th — join us!', body: "We're making the Wildflower Market Bag together. All skill levels welcome. Sign up in the events tab.", replies: 56, likes: 142, tag: 'Events', timeAgo: '3d ago' },
  { id: 8, user: { name: 'Nadia Okonkwo', initials: 'NO', role: 'Maker' }, title: 'What needle material do you prefer for lace?', body: 'Metal vs wood vs bamboo — I find I drop stitches on metal but wood feels slow. Curious what others use for fine lace weight.', replies: 22, likes: 59, tag: 'Yarn', timeAgo: '4d ago' },
];

// ─── Projects data ────────────────────────────────────────────────────────────
export const PROJECT_FILTERS = ['All', 'Finished', 'In Progress', 'Frogged'];

export const PROJECTS: Project[] = [
  { id: 1, user: { name: 'Sofia Reyes', initials: 'SR', role: 'Fiber Artist' }, title: 'Autumn Fair Isle Sweater', pattern: 'Nordic Bloom by Lena Wolf', yarn: 'Merino DK in Rust + Cream', status: 'finished', likes: 203, comments: 41, timeAgo: '2d ago', color: 'hsl(18,55%,62%)', emoji: '🧥' },
  { id: 2, user: { name: 'Amara Osei', initials: 'AO', role: 'Amigurumi Designer' }, title: 'Honey Bear Family', pattern: 'Honey Bear Amigurumi by Maria Stitches', yarn: 'Paintbox Cotton DK, Caramel', status: 'finished', likes: 178, comments: 34, timeAgo: '4d ago', color: 'hsl(35,70%,65%)', emoji: '🧸' },
  { id: 3, user: { name: 'Mira Tanaka', initials: 'MT', role: 'Beginner' }, title: 'My First Granny Square Blanket', pattern: 'Classic Granny Square', yarn: 'Stylecraft Special DK, Multicolour', status: 'in-progress', likes: 54, comments: 12, timeAgo: '1d ago', color: 'hsl(105,30%,60%)', emoji: '🌈' },
  { id: 4, user: { name: 'Clara Hooks', initials: 'CH', role: 'Pattern Designer' }, title: 'Wildflower Market Bag', pattern: 'Wildflower Market Bag (own design)', yarn: 'Rico Ricorumi Cotton, Sage', status: 'finished', likes: 312, comments: 67, timeAgo: '1w ago', color: 'hsl(120,25%,58%)', emoji: '👜' },
  { id: 5, user: { name: 'Priya Nair', initials: 'PN', role: 'Crochet Tutor' }, title: 'Summer Lace Shawlette', pattern: 'Autumn Lace Shawl adapted', yarn: 'Drops Lace, Dusty Pink', status: 'in-progress', likes: 89, comments: 18, timeAgo: '3d ago', color: 'hsl(340,40%,70%)', emoji: '🧣' },
  { id: 6, user: { name: 'Elise Johansson', initials: 'EJ', role: 'Knitter' }, title: 'Cabled Aran Pullover', pattern: 'Traditional Aran Cables', yarn: 'Rowan Aran, Natural', status: 'frogged', likes: 23, comments: 9, timeAgo: '5d ago', color: 'hsl(40,30%,65%)', emoji: '🫧' },
  { id: 7, user: { name: 'Lena Wolf', initials: 'LW', role: 'Designer' }, title: 'Baby Booties Set', pattern: 'Sunshine Baby Booties', yarn: 'Paintbox Simply DK, Butter', status: 'finished', likes: 145, comments: 29, timeAgo: '6d ago', color: 'hsl(48,75%,70%)', emoji: '🥿' },
  { id: 8, user: { name: 'Nadia Okonkwo', initials: 'NO', role: 'Maker' }, title: 'Geometric Tapestry Crochet Bag', pattern: 'Own design', yarn: 'Paintbox Cotton Aran, Black + White', status: 'in-progress', likes: 67, comments: 14, timeAgo: '2d ago', color: 'hsl(0,0%,35%)', emoji: '🏺' },
];

// ─── Craft-Alongs data ────────────────────────────────────────────────────────
export const CRAFTALONG_FILTERS = ['All', 'Active', 'Upcoming', 'Finished'];

export const CRAFTALONGS: CraftAlong[] = [
  { id: 1, title: 'Spring Wildflower CAL', description: "Crochet the Wildflower Market Bag together! All skill levels welcome. We'll share progress every Friday.", pattern: 'Wildflower Market Bag', startDate: 'Mar 30', endDate: 'Apr 27', participants: 342, emoji: '🌸', color: 'hsl(340,45%,68%)', tag: 'Active' },
  { id: 2, title: 'Amigurumi April', description: 'A full month dedicated to tiny stuffed creatures. Pick any amigurumi pattern and share your progress daily.', pattern: 'Any Amigurumi', startDate: 'Apr 1', endDate: 'Apr 30', participants: 187, emoji: '🧸', color: 'hsl(35,65%,62%)', tag: 'Upcoming' },
  { id: 3, title: 'Cozy Blanket KAL', description: "Knit-along for the Sunburst Granny Blanket. Beginner-friendly with weekly video check-ins.", pattern: 'Sunburst Granny Blanket', startDate: 'Feb 1', endDate: 'Mar 15', participants: 521, emoji: '🧶', color: 'hsl(18,50%,58%)', tag: 'Finished' },
  { id: 4, title: 'Autumn Shawl KAL', description: 'Work through the Autumn Lace Shawl at your own pace with support from our experienced members.', pattern: 'Autumn Lace Shawl', startDate: 'May 1', endDate: 'May 31', participants: 94, emoji: '🍂', color: 'hsl(25,55%,58%)', tag: 'Upcoming' },
  { id: 5, title: 'Baby Shower Knitalong', description: 'Knit adorable baby items in time for spring! Booties, bonnets, and blankets, all welcome.', pattern: 'Various Baby Patterns', startDate: 'Mar 10', endDate: 'Mar 29', participants: 278, emoji: '🌿', color: 'hsl(105,28%,55%)', tag: 'Active' },
];

// ─── Badges data ──────────────────────────────────────────────────────────────
export const BADGE_CATEGORIES = ['All', 'Skills', 'Community', 'Milestones', 'Events'];

export const BADGES: Badge[] = [
  { id: 1,  name: 'First Stitch',       description: 'Logged your very first project.',                    emoji: '🪡', color: 'hsl(48,75%,68%)',  earnedBy: 12403, category: 'Milestones' },
  { id: 2,  name: 'Chain Gang',         description: 'Completed 10 projects.',                             emoji: '🔗', color: 'hsl(18,52%,56%)',  earnedBy: 4821,  category: 'Milestones' },
  { id: 3,  name: 'Centurion',          description: 'Completed 100 projects.',                            emoji: '💯', color: 'hsl(35,70%,60%)',  earnedBy: 382,   category: 'Milestones' },
  { id: 4,  name: 'Lace Weaver',        description: 'Finished a lace weight project.',                    emoji: '🕸️', color: 'hsl(200,40%,62%)', earnedBy: 1893,  category: 'Skills' },
  { id: 5,  name: 'Colourwork Queen',   description: 'Completed a fair isle or tapestry project.',         emoji: '🌈', color: 'hsl(280,40%,65%)', earnedBy: 2104,  category: 'Skills' },
  { id: 6,  name: 'Amigurumi Artisan',  description: 'Completed 5 amigurumi projects.',                   emoji: '🧸', color: 'hsl(25,65%,62%)',  earnedBy: 1547,  category: 'Skills' },
  { id: 7,  name: 'Forum Friend',       description: 'Made 50 helpful forum posts.',                       emoji: '💬', color: 'hsl(105,30%,58%)', earnedBy: 3201,  category: 'Community' },
  { id: 8,  name: 'CAL Champ',          description: 'Completed a craft-along from start to finish.',      emoji: '🏅', color: 'hsl(48,80%,62%)',  earnedBy: 2876,  category: 'Events' },
  { id: 9,  name: 'Early Bird',         description: 'One of the first 1,000 members to join Loopcraft.',  emoji: '🐦', color: 'hsl(185,45%,58%)', earnedBy: 1000,  category: 'Milestones' },
  { id: 10, name: 'Frog Survivor',      description: "Frogged a project and restarted — you're resilient!", emoji: '🐸', color: 'hsl(120,35%,55%)', earnedBy: 6712,  category: 'Community' },
  { id: 11, name: 'Yarn Stash Builder', description: 'Added 20+ yarns to your stash.',                    emoji: '🧺', color: 'hsl(340,40%,62%)', earnedBy: 4309,  category: 'Skills' },
  { id: 12, name: 'Pattern Fiend',      description: 'Favourited 50+ patterns.',                          emoji: '❤️', color: 'hsl(0,60%,62%)',   earnedBy: 5891,  category: 'Community' },
];
