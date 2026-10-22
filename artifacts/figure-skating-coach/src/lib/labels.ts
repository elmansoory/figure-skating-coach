// Arabic display labels for API enums and shared skating terms. Keep every
// user-visible term here so the same thing is always called the same name.
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export const DISCIPLINE_LABELS: Record<string, string> = {
  singles_men: "فردي رجال",
  singles_ladies: "فردي سيدات",
  pairs: "الأزواج",
  ice_dance: "الرقص على الجليد",
};

export const LEVEL_LABELS: Record<string, string> = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم",
  junior: "ناشئين",
  senior: "كبار",
};

export const SESSION_TYPE_LABELS: Record<string, string> = {
  short_program: "البرنامج القصير",
  free_skate: "البرنامج الحر",
  exhibition: "استعراض",
  practice: "تمرين",
};

export const ELEMENT_TYPE_LABELS: Record<string, string> = {
  jump: "قفزة",
  spin: "دوران",
  step_sequence: "تسلسل خطوات",
  choreographic: "تسلسل كوريوغرافي",
};

export const TRAINING_TYPE_LABELS: Record<string, string> = {
  on_ice: "على الجليد",
  off_ice: "خارج الجليد",
  drill: "تمرين تقني",
  conditioning: "لياقة بدنية",
  choreography: "كوريوغرافيا",
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "سهل",
  medium: "متوسط",
  hard: "صعب",
  elite: "نخبة",
};

export const RULE_CATEGORY_LABELS: Record<string, string> = {
  jumps: "القفزات",
  spins: "الدورانات",
  steps: "الخطوات",
  goe: "درجة التنفيذ (GOE)",
  pcs: "مكونات البرنامج (PCS)",
  general: "عام",
  penalties: "الخصومات",
};

/** ISU program component names as they appear in the protocols */
export const COMPONENT_LABELS: Record<string, string> = {
  Composition: "التركيب",
  Presentation: "التقديم",
  "Skating Skills": "مهارات التزلج",
  Transitions: "الانتقالات",
  Performance: "الأداء",
  "Interpretation of the Music": "تفسير الموسيقى",
  Timing: "التوقيت",
};

export const DISCIPLINE_NAME: Record<string, string> = {
  Men: "الرجال",
  Women: "السيدات",
  Pairs: "الأزواج",
  "Ice Dance": "الرقص على الجليد",
};

export const label = (map: Record<string, string>, key: string | null | undefined) => (key ? map[key] ?? key : "");

export const formatDate = (date: string | Date, pattern = "d MMMM yyyy") => format(new Date(date), pattern, { locale: ar });
