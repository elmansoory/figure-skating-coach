import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { EVENT_NAMES, OlympicSection, type SegmentFilter } from "@/components/analytics/olympic-section";
import { DISCIPLINE_NAME, label } from "@/lib/labels";
import { JumpPatterns } from "@/components/analytics/jump-patterns";
import { analytics, DISCIPLINES, OLYMPIC_EVENTS, type Discipline } from "@/data/olympic-analytics";

const SOURCES = [
  {
    name: "cleanskate",
    url: "https://github.com/erleholgersen/cleanskate",
    status: "مستخدَم هنا",
    detail: "نتائج وبروتوكولات ISU محللة منذ موسم 2018/19: النتائج، ودرجات ونداءات كل عنصر، ومكونات البرنامج، والحكام. تشمل أولمبياد 2022 و2026. رخصة MIT.",
  },
  {
    name: "ISU results & protocols",
    url: "https://results.isu.org",
    status: "المصدر الأصلي",
    detail: "صفحات النتائج الرسمية وملفات PDF لتفاصيل الحكام لكل متزلج (Judges Details per Skater) لكل بطولات ISU. كل المصادر الأخرى في هذه القائمة مشتقة منها.",
  },
  {
    name: "BuzzFeedNews/figure-skating-scores",
    url: "https://github.com/BuzzFeedNews/figure-skating-scores",
    status: "تاريخي",
    detail: "ملفات CSV منظمة (الأداءات، والعناصر المحكّمة، ودرجات كل حكم) لـ 17 بطولة كبرى من أكتوبر 2016 إلى ديسمبر 2017، مع أداة تحليل ملفات PDF.",
  },
  {
    name: "mayupei/isu-figure-skating-competitions-web-scraper",
    url: "https://github.com/mayupei/isu-figure-skating-competitions-web-scraper",
    status: "أداة جمع",
    detail: "أداة تجمع بروتوكولات ISU ولجان الحكام من موسم 2004/05 إلى 2024/25؛ تشغّلها بنفسك لإنتاج البيانات.",
  },
  {
    name: "mengyazhu96/figure-skating-analysis",
    url: "https://github.com/mengyazhu96/figure-skating-analysis",
    status: "تاريخي",
    detail: "بيانات أطروحة تخرج ونماذج للتنبؤ بالدرجات، مواسم 2016–2018.",
  },
  {
    name: "edomt/isu-data",
    url: "https://github.com/edomt/isu-data",
    status: "بيانات وصفية",
    detail: "ملف CSV يُحدَّث أسبوعيًا بمدربي ومصممي برامج المتزلجين النشطين من سيرهم على موقع ISU.",
  },
  {
    name: "FSBench (arXiv 2504.19514)",
    url: "https://arxiv.org/abs/2504.19514",
    status: "فيديو وذكاء اصطناعي",
    detail: "معيار من 783 أداءً في الجائزة الكبرى مع تصنيف العناصر وتعليقات GOE، لأبحاث فهم الفيديو.",
  },
  {
    name: "Mercity Figure-Skating-Classification-Data",
    url: "https://huggingface.co/datasets/Mercity/Figure-Skating-Classification-Data",
    status: "فيديو وذكاء اصطناعي",
    detail: "تسلسلات وضعيات الهيكل العظمي لـ 64 فئة من العناصر، من فيديوهات البطولات والتقاط الحركة.",
  },
  {
    name: "Kaggle",
    url: "https://www.kaggle.com/search?q=figure+skating",
    status: "غير متاح",
    detail: "لم يُتحقق من وجود مجموعة بيانات لدرجات ISU على مستوى العناصر في Kaggle عند بناء هذه اللوحة؛ ابحث هناك مباشرة قبل الاعتماد على أي منها.",
  },
];

export default function OlympicAnalytics() {
  const [event, setEvent] = useState(OLYMPIC_EVENTS.at(-1)!);
  const [discipline, setDiscipline] = useState<Discipline>("Men");
  const [segment, setSegment] = useState<SegmentFilter>("combined");
  const [topN, setTopN] = useState(10);
  const dance = discipline === "Ice Dance";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">التحليلات الأولمبية</h1>
        <p className="text-muted-foreground mt-1 max-w-3xl">
          درجات العناصر الفنية (TES) ومكونات البرنامج (PCS) لمتزلجي أولمبياد بكين 2022 وميلانو كورتينا 2026، وما الذي
          يميّز القفزات النظيفة عن الفاشلة في كل البطولات الدولية للكبار. البيانات: مجموعة cleanskate المحللة من نتائج وبروتوكولات ISU، نسخة <span dir="ltr">{analytics.meta.snapshot}</span>.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-lg border border-border bg-card p-4">
        <div className="space-y-1">
          <Label htmlFor="f-event">الألعاب الأولمبية</Label>
          <Select value={event} onValueChange={setEvent}>
            <SelectTrigger id="f-event" className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>{OLYMPIC_EVENTS.map((e) => <SelectItem key={e} value={e}>{EVENT_NAMES[e] ?? e}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="f-disc">التخصص</Label>
          <Select value={discipline} onValueChange={(v) => setDiscipline(v as Discipline)}>
            <SelectTrigger id="f-disc" className="w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>{DISCIPLINES.map((d) => <SelectItem key={d} value={d}>{label(DISCIPLINE_NAME, d)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="f-seg">البرنامج</Label>
          <Select value={segment} onValueChange={(v) => setSegment(v as SegmentFilter)}>
            <SelectTrigger id="f-seg" className="w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="combined">المجموع (البرنامجان)</SelectItem>
              <SelectItem value="SP">{dance ? "رقصة الإيقاع" : "البرنامج القصير"}</SelectItem>
              <SelectItem value="FS">{dance ? "الرقصة الحرة" : "البرنامج الحر"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="f-top">العرض</Label>
          <Select value={String(topN)} onValueChange={(v) => setTopN(Number(v))}>
            <SelectTrigger id="f-top" className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[5, 10, 15, 30].map((n) => <SelectItem key={n} value={String(n)}>{n === 30 ? "الكل" : `أفضل ${n}`}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <OlympicSection key={`${event}-${discipline}-${segment}`} event={event} discipline={discipline} segment={segment} topN={topN} />

      <Separator />

      <JumpPatterns />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">مجموعات بيانات التزلج الفني</CardTitle>
          <CardDescription>المصادر العامة التي رُوجعت لبناء هذه اللوحة. راجع <span dir="ltr">docs/datasets.md</span> في المستودع للتفاصيل وطريقة إعادة بناء البيانات.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {SOURCES.map((s) => (
            <div key={s.name} className="py-3 grid gap-1 md:grid-cols-[260px_110px_1fr] md:gap-4">
              <a href={s.url} target="_blank" rel="noreferrer" dir="ltr" className="font-medium text-primary hover:underline break-words text-start">{s.name}</a>
              <span className="text-xs font-medium text-muted-foreground md:pt-0.5">{s.status}</span>
              <span className="text-sm text-muted-foreground">{s.detail}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
