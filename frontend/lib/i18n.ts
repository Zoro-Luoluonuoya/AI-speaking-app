export type Lang = "en" | "zh";

type Dict = Record<string, { en: string; zh: string }>;

const dict: Dict = {
  // Header
  "app.title": { en: "AI Speaking Practice", zh: "AI 口语陪练" },
  "app.tagline": { en: "Speak Confidently", zh: "自信开口说" },
  "avg.score": { en: "Avg Score", zh: "平均分" },
  "end.practice": { en: "End Practice", zh: "结束练习" },
  "total.sessions": { en: "Sessions", zh: "次练习" },

  // Scenario
  "scenario.interview": { en: "Interview", zh: "面试" },
  "scenario.restaurant": { en: "Restaurant", zh: "点餐" },
  "scenario.meeting": { en: "Meeting", zh: "会议" },
  "scenario.interview.desc": {
    en: "Practice answering professional interview questions with confidence",
    zh: "练习自信地回答专业面试问题",
  },
  "scenario.restaurant.desc": {
    en: "Practice ordering food, asking about menu items, and interacting with staff",
    zh: "练习点餐、询问菜品、与服务员交流",
  },
  "scenario.meeting.desc": {
    en: "Practice discussing projects, giving updates, and proposing ideas",
    zh: "练习讨论项目、汇报进展、提出方案",
  },
  "scenario.interview.badge": { en: "Career", zh: "职场" },
  "scenario.restaurant.badge": { en: "Daily", zh: "日常" },
  "scenario.meeting.badge": { en: "Business", zh: "商务" },
  "hint.interview": {
    en: "Practice answering interview questions professionally",
    zh: "练习专业地回答面试问题",
  },
  "hint.restaurant": {
    en: "Practice ordering food and interacting with staff",
    zh: "练习点餐和服务员交流",
  },
  "hint.meeting": {
    en: "Practice discussing projects and action items",
    zh: "练习讨论项目进展和行动计划",
  },

  // Chat
  "chat.placeholder": {
    en: "Press and hold the mic button to start speaking",
    zh: "长按麦克风按钮开始说话",
  },
  "chat.recording": { en: "Recording...", zh: "录音中..." },
  "chat.thinking": { en: "AI is thinking...", zh: "AI 思考中..." },
  "chat.grammar.tip": { en: "Grammar tip", zh: "语法提示" },
  "chat.grammar.hide": { en: "Hide", zh: "收起" },
  "chat.mic.hint": { en: "Hold to record, release to send", zh: "按住录音，松手发送" },
  "chat.type.placeholder": { en: "Type a message...", zh: "输入消息..." },
  "chat.send": { en: "Send", zh: "发送" },

  // Quick phrases
  "quick.repeat": { en: "Can you repeat that?", zh: "请再说一遍" },
  "quick.slower": { en: "Could you speak slower?", zh: "请说慢一点" },
  "quick.meaning": { en: "What does that mean?", zh: "那是什么意思" },
  "quick.example": { en: "Can you give an example?", zh: "能举个例子吗" },

  // Daily quote
  "daily.title": { en: "Daily Inspiration", zh: "每日一句" },
  "daily.quote": {
    en: "\"The limits of my language mean the limits of my world.\" — Ludwig Wittgenstein",
    zh: "\"我的语言的界限就是我的世界的界限。\" — 维特根斯坦",
  },

  // Summary Modal
  "summary.title": { en: "Practice Report", zh: "练习报告" },
  "summary.loading": { en: "Generating your report...", zh: "正在生成报告..." },
  "summary.overall": { en: "Overall Score", zh: "综合评分" },
  "summary.grammar": { en: "Grammar Review", zh: "语法分析" },
  "summary.vocabulary": { en: "Vocabulary Feedback", zh: "词汇评估" },
  "summary.next": { en: "Next Steps", zh: "改进建议" },
  "summary.close": { en: "Close", zh: "关闭" },
  "summary.score.excellent": { en: "Excellent", zh: "优秀" },
  "summary.score.good": { en: "Good", zh: "良好" },
  "summary.score.needs": { en: "Needs work", zh: "待提高" },
  "summary.messages": { en: "Messages", zh: "消息数" },
  "summary.duration": { en: "Duration", zh: "练习时长" },
  "summary.export": { en: "Export", zh: "导出" },

  // Score badge
  "score.too.short": { en: "Too short", zh: "过短" },
  "score.fair": { en: "Fair", zh: "一般" },
  "score.excellent": { en: "Excellent", zh: "优秀" },
  "score.good": { en: "Good", zh: "良好" },
  "score.needs.work": { en: "Needs work", zh: "待提高" },

  // Language toggle
  "lang.toggle": { en: "中文", zh: "English" },

  // Sidebar
  "sidebar.history": { en: "History", zh: "历史记录" },
  "sidebar.no.history": { en: "No practice sessions yet", zh: "暂无练习记录" },

  // Settings
  "settings.title": { en: "Settings", zh: "设置" },

  // Footer status
  "status.scenario": { en: "Scenario", zh: "场景" },
  "status.duration": { en: "Time", zh: "时长" },
};

export function t(key: string, lang: Lang): string {
  return dict[key]?.[lang] ?? key;
}
