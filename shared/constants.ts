// ─────────────────────────────────────────────────────────
// Centralized static configuration for the entire Quiz Builder app.
// Edit values here to propagate changes across client & server.
// ─────────────────────────────────────────────────────────

// ── App Metadata ──────────────────────────────────────────
export const APP_NAME = "Quiz Builder";
export const APP_DESCRIPTION = "Complete quizzes and track your progress";
export const APP_TAGLINE = "Admin Dashboard";

// ── Auth & Session ────────────────────────────────────────
export const AUTH = {
  MIN_USERNAME_LENGTH: 3,
  MIN_PASSWORD_LENGTH: 8,
  SESSION_MAX_AGE_MS: 24 * 60 * 60 * 1000, // 24 hours
  SESSION_SECRET_FALLBACK: "quiz-builder-dev-fallback-secret",
  ADMIN_SECRET_FALLBACK: "change-me-in-production",
} as const;

// ── Route Paths ───────────────────────────────────────────
export const ROUTES = {
  HOME: "/",
  AUTH: "/auth",
  TAKE_QUIZ: "/take-quiz/:id",
  RESULTS: "/results/:id",
  ADMIN: "/admin",
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_CREATE_QUIZ: "/admin/create-quiz",
  ADMIN_MANAGE_QUIZZES: "/admin/manage-quizzes",
  ADMIN_USER_RESULTS: "/admin/user-results",
} as const;

// ── API Endpoints (used by server routes & client fetchers) ─
export const API = {
  USER: "/api/user",
  LOGIN: "/api/login",
  LOGOUT: "/api/logout",
  REGISTER: "/api/register",
  PARTICIPANTS: "/api/participants",
  QUIZZES: "/api/quizzes",
  QUESTIONS: "/api/questions",
  RESULTS: "/api/results",
} as const;

// ── localStorage Keys ─────────────────────────────────────
export const STORAGE_KEYS = {
  PARTICIPANT_ID: "participantId",
  PARTICIPANT_ROLL: "participantRollNumber",
} as const;

// ── Quiz Defaults ─────────────────────────────────────────
export const QUIZ_DEFAULTS = {
  DEFAULT_TIME_LIMIT: 30, // minutes
  DEFAULT_PASSING_SCORE: 60, // percentage
  MIN_OPTIONS: 2,
  MIN_QUESTIONS: 1,
} as const;

// ── Timer & Submission ────────────────────────────────────
export const TIMER = {
  LOW_TIME_WARNING_SECONDS: 300, // 5 minutes
  AUTO_SUBMIT_DELAY_MS: 2000, // delay before auto-submit on time-up
  REDIRECT_DELAY_MS: 2000, // delay before redirect after certain actions
  PARTICIPANT_LOAD_TIMEOUT_MS: 2000, // fallback timeout for participant loading
  MAX_FULLSCREEN_EXITS: 3, // auto-submit quiz after this many fullscreen exits
} as const;

// ── Score Thresholds (for color coding) ───────────────────
export const SCORE_THRESHOLDS = {
  HIGH: 80, // >= 80% → green
  MEDIUM: 60, // >= 60% → blue
  // < 60% → red
} as const;

export const getScoreColor = (percentage: number) => {
  if (percentage >= SCORE_THRESHOLDS.HIGH) return "text-green-600";
  if (percentage >= SCORE_THRESHOLDS.MEDIUM) return "text-blue-600";
  return "text-red-600";
};

export const getScoreDotColor = (percentage: number) => {
  if (percentage >= SCORE_THRESHOLDS.HIGH) return "bg-green-500";
  if (percentage >= SCORE_THRESHOLDS.MEDIUM) return "bg-blue-500";
  return "bg-red-500";
};

// ── Score Distribution Bands (analytics) ──────────────────
export const SCORE_BANDS = [
  { range: "0-25%", min: 0, max: 25, color: "bg-red-500" },
  { range: "26-50%", min: 26, max: 50, color: "bg-orange-500" },
  { range: "51-75%", min: 51, max: 75, color: "bg-blue-500" },
  { range: "76-100%", min: 76, max: 100, color: "bg-green-500" },
] as const;

// ── Timer Progress Colors ─────────────────────────────────
export const TIMER_COLORS = {
  CRITICAL_THRESHOLD: 10, // <= 10% → red
  WARNING_THRESHOLD: 25, // <= 25% → yellow
  CRITICAL_CLASS: "bg-red-500",
  WARNING_CLASS: "bg-yellow-500",
  NORMAL_CLASS: "bg-primary",
} as const;

// ── Dashboard ─────────────────────────────────────────────
export const DASHBOARD = {
  RECENT_ITEMS_COUNT: 5, // number of recent quizzes/results shown
  DATE_FORMAT: {
    year: "numeric" as const,
    month: "short" as const,
    day: "numeric" as const,
  },
  DATE_FORMAT_WITH_TIME: {
    year: "numeric" as const,
    month: "short" as const,
    day: "numeric" as const,
    hour: "2-digit" as const,
    minute: "2-digit" as const,
  },
  DATE_LOCALE: "en-US",
} as const;

// ── Departments ───────────────────────────────────────────
export const DEPARTMENTS = [
  { value: "CE", label: "Civil Engineering" },
  { value: "CSE", label: "Computer Science and Engineering" },
  { value: "EE", label: "Electrical Engineering" },
  { value: "ECE", label: "Electronics and Communication Engineering" },
  { value: "IT", label: "Information Technology" },
  { value: "ME", label: "Mechanical Engineering" },
  { value: "other", label: "Other (write your own)" },
] as const;

/** List of known department values (excludes "other") — used for validation. */
export const KNOWN_DEPARTMENT_VALUES = DEPARTMENTS.filter(
  (d) => d.value !== "other",
).map((d) => d.value);

// ── Year Options ──────────────────────────────────────────
export const YEAR_OPTIONS = [
  { value: "1st-year", label: "1st Year" },
  { value: "2nd-year", label: "2nd Year" },
  { value: "3rd-year", label: "3rd Year" },
  { value: "4th-year", label: "4th Year" },
] as const;

// ── Sidebar Menu Items ────────────────────────────────────
// Icon names are strings here; each consumer maps them to actual icon components.
export const SIDEBAR_MENU = [
  { title: "Dashboard", iconName: "LayoutDashboard", path: ROUTES.ADMIN },
  {
    title: "Create Quiz",
    iconName: "FilePlus",
    path: ROUTES.ADMIN_CREATE_QUIZ,
  },
  {
    title: "Manage Quizzes",
    iconName: "FileQuestion",
    path: ROUTES.ADMIN_MANAGE_QUIZZES,
  },
  { title: "User Results", iconName: "Users", path: ROUTES.ADMIN_USER_RESULTS },
] as const;

// ── CSV Export Headers ────────────────────────────────────
export const CSV_HEADERS = [
  "Student Name",
  "Roll Number",
  "Class",
  "Department",
  "Quiz",
  "Score",
  "Percentage",
  "Status",
  "Time Taken",
  "Submission Date",
  "IP Address",
  "Retake Allowed",
] as const;

// ── Live Results Polling ──────────────────────────────────
export const LIVE_RESULTS = {
  POLL_INTERVAL_MS: 5_000, // 5 seconds
} as const;

// ── Query Client Config ───────────────────────────────────
export const QUERY_CONFIG = {
  STALE_TIME_MS: 5 * 60 * 1000, // 5 minutes
  RETRY: false,
} as const;

// ── Responsive Breakpoints ────────────────────────────────
export const BREAKPOINTS = {
  MOBILE: 768,
} as const;

// ── Auth Page Feature Cards ───────────────────────────────
export const AUTH_FEATURES = [
  {
    title: "Create",
    description:
      "Build quizzes with unlimited questions and customizable time limits",
  },
  {
    title: "Manage",
    description: "Edit, update, or delete quizzes with an intuitive interface",
  },
  {
    title: "Track",
    description: "Monitor student performance and view detailed analytics",
  },
  {
    title: "Report",
    description: "Generate comprehensive reports on quiz results",
  },
] as const;

// ── Form Validation Lengths ───────────────────────────────
export const VALIDATION = {
  MIN_NAME_LENGTH: 2,
  MIN_QUESTION_LENGTH: 3,
  MIN_QUIZ_TITLE_LENGTH: 3,
} as const;
