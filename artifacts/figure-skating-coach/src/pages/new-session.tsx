import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateSession, useListAthletes, PerformanceSessionInputSessionType } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { SESSION_TYPE_LABELS } from "@/lib/labels";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function NewSession() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: athletes } = useListAthletes();
  const createSession = useCreateSession();

  const [athleteId, setAthleteId] = useState<string>("");
  const [sessionType, setSessionType] = useState<PerformanceSessionInputSessionType>("practice");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [venue, setVenue] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!athleteId) {
      toast({ title: "خطأ", description: "يرجى اختيار لاعب", variant: "destructive" });
      return;
    }

    createSession.mutate({
      data: {
        athleteId: parseInt(athleteId, 10),
        sessionType,
        date: new Date(date).toISOString(),
        venue,
        notes
      }
    }, {
      onSuccess: (session) => {
        toast({ title: "تم", description: "تم إنشاء الجلسة، ويمكنك الآن تسجيل العناصر الفنية." });
        setLocation(`/sessions/${session.id}`);
      },
      onError: (err) => {
        toast({ title: "خطأ", description: "تعذّر إنشاء الجلسة.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/sessions" aria-label="رجوع إلى الجلسات"><ArrowLeft className="w-4 h-4 rtl:rotate-180" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">تسجيل جلسة</h1>
          <p className="text-muted-foreground">أنشئ جلسة عرض أو تمرين جديدة</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="athlete">اللاعب</Label>
              <Select value={athleteId} onValueChange={setAthleteId}>
                <SelectTrigger id="athlete">
                  <SelectValue placeholder="اختر لاعبًا" />
                </SelectTrigger>
                <SelectContent>
                  {athletes?.map(a => (
                    <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">نوع الجلسة</Label>
              <Select value={sessionType} onValueChange={(v) => setSessionType(v as PerformanceSessionInputSessionType)}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SESSION_TYPE_LABELS).map(([value, text]) => (
                    <SelectItem key={value} value={value}>{text}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">التاريخ</Label>
              <Input 
                id="date" 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue">المكان (اختياري)</Label>
              <Input 
                id="venue" 
                value={venue} 
                onChange={(e) => setVenue(e.target.value)} 
                placeholder="مثال: مركز التدريب الأولمبي" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات (اختياري)</Label>
              <Textarea 
                id="notes" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="تركيز الجلسة، الظروف، الانطباع العام..." 
                className="min-h-[100px]"
              />
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setLocation('/sessions')}>إلغاء</Button>
              <Button type="submit" disabled={createSession.isPending}>
                {createSession.isPending ? "جارٍ الإنشاء..." : "إنشاء الجلسة"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
