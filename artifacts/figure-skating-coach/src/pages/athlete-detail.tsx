import { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetAthlete,
  useGetAthleteProgress,
  useGetElementStats,
  useListSessions,
  useUpdateAthlete,
  useDeleteAthlete,
  getGetAthleteQueryKey,
  getGetAthleteProgressQueryKey,
  getGetElementStatsQueryKey,
  getListSessionsQueryKey,
  type Athlete,
  type AthleteUpdateDiscipline,
  type AthleteUpdateLevel,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Link } from "wouter";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDelete } from "@/components/confirm-delete";
import { useToast } from "@/hooks/use-toast";
import { DISCIPLINE_LABELS, LEVEL_LABELS, SESSION_TYPE_LABELS, formatDate, label } from "@/lib/labels";

const formatDiscipline = (d: string) => label(DISCIPLINE_LABELS, d);

function EditAthleteDialog({ athlete }: { athlete: Athlete }) {
  const updateAthlete = useUpdateAthlete();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const [name, setName] = useState(athlete.name);
  const [discipline, setDiscipline] = useState<AthleteUpdateDiscipline>(athlete.discipline);
  const [level, setLevel] = useState<AthleteUpdateLevel>(athlete.level);
  const [nationality, setNationality] = useState(athlete.nationality ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(athlete.dateOfBirth ?? "");
  const [personalBestScore, setPersonalBestScore] = useState(athlete.personalBestScore?.toString() ?? "");
  const [notes, setNotes] = useState(athlete.notes ?? "");

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setName(athlete.name);
      setDiscipline(athlete.discipline);
      setLevel(athlete.level);
      setNationality(athlete.nationality ?? "");
      setDateOfBirth(athlete.dateOfBirth ?? "");
      setPersonalBestScore(athlete.personalBestScore?.toString() ?? "");
      setNotes(athlete.notes ?? "");
    }
    setOpen(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    updateAthlete.mutate({
      id: athlete.id,
      data: {
        name: name.trim(),
        discipline,
        level,
        nationality: nationality.trim() || null,
        dateOfBirth: dateOfBirth || null,
        personalBestScore: personalBestScore ? parseFloat(personalBestScore) : null,
        notes: notes.trim() || null,
      }
    }, {
      onSuccess: () => {
        toast({ title: "تم", description: "تم تحديث بيانات اللاعب" });
        queryClient.invalidateQueries();
        setOpen(false);
      },
      onError: () => {
        toast({ title: "خطأ", description: "تعذّر تحديث بيانات اللاعب", variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="w-4 h-4 me-2" />
          تعديل
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تعديل بيانات اللاعب</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">الاسم الكامل</Label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-discipline">التخصص</Label>
              <Select value={discipline} onValueChange={(v) => setDiscipline(v as AthleteUpdateDiscipline)}>
                <SelectTrigger id="edit-discipline">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DISCIPLINE_LABELS).map(([value, text]) => (
                    <SelectItem key={value} value={value}>{text}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-level">المستوى</Label>
              <Select value={level} onValueChange={(v) => setLevel(v as AthleteUpdateLevel)}>
                <SelectTrigger id="edit-level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LEVEL_LABELS).map(([value, text]) => (
                    <SelectItem key={value} value={value}>{text}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-nationality">الجنسية</Label>
              <Input id="edit-nationality" value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="مثال: EGY" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dob">تاريخ الميلاد</Label>
              <Input id="edit-dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-pb">أفضل نتيجة شخصية</Label>
              <Input id="edit-pb" type="number" step="0.01" min="0" value={personalBestScore} onChange={(e) => setPersonalBestScore(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-notes">ملاحظات</Label>
            <Textarea id="edit-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button type="submit" disabled={updateAthlete.isPending}>
              {updateAthlete.isPending ? "جارٍ الحفظ..." : "حفظ التغييرات"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AthleteDetail() {
  const params = useParams();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteAthlete = useDeleteAthlete();

  const { data: athlete, isLoading: isLoadingAthlete } = useGetAthlete(id, { query: { enabled: !!id, queryKey: getGetAthleteQueryKey(id) } });
  const { data: progress, isLoading: isLoadingProgress } = useGetAthleteProgress(id, { query: { enabled: !!id, queryKey: getGetAthleteProgressQueryKey(id) } });
  const { data: elementStats, isLoading: isLoadingStats } = useGetElementStats(id, { query: { enabled: !!id, queryKey: getGetElementStatsQueryKey(id) } });
  const { data: sessions, isLoading: isLoadingSessions } = useListSessions({ athleteId: id }, { query: { enabled: !!id, queryKey: getListSessionsQueryKey({ athleteId: id }) } });

  const handleDelete = () => {
    deleteAthlete.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "تم", description: "تم حذف اللاعب" });
        queryClient.removeQueries({ queryKey: getGetAthleteQueryKey(id) });
        queryClient.invalidateQueries();
        setLocation("/athletes");
      },
      onError: () => {
        toast({ title: "خطأ", description: "تعذّر حذف اللاعب", variant: "destructive" });
      }
    });
  };

  if (isLoadingAthlete) {
    return <div className="space-y-6"><Skeleton className="h-32 w-full" /></div>;
  }

  if (!athlete) return <div>اللاعب غير موجود</div>;

  const formattedProgress = progress?.map(p => ({
    ...p,
    dateStr: formatDate(p.date, 'd MMM')
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/athletes" aria-label="رجوع إلى اللاعبين"><ArrowLeft className="w-4 h-4 rtl:rotate-180" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
            {athlete.name}
            {athlete.nationality && <span className="text-xl font-normal text-muted-foreground">{athlete.nationality}</span>}
          </h1>
          <div className="text-muted-foreground flex gap-2 items-center mt-1">
            <span>{label(LEVEL_LABELS, athlete.level)}</span>
            <span>•</span>
            <span>{formatDiscipline(athlete.discipline)}</span>
          </div>
        </div>
        <div className="ms-auto flex gap-2">
          <EditAthleteDialog athlete={athlete} />
          <ConfirmDelete
            trigger={
              <Button variant="outline" size="sm" className="text-destructive">
                <Trash2 className="w-4 h-4 me-2" />
                حذف
              </Button>
            }
            title={`حذف ${athlete.name}؟`}
            description="سيتم حذف اللاعب نهائيًا مع كل جلساته والعناصر المسجلة. برامج التدريب المخصصة له ستبقى لكن بدون تخصيص."
            onConfirm={handleDelete}
            isPending={deleteAthlete.isPending}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">أفضل نتيجة شخصية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-primary">
              {athlete.personalBestScore ? athlete.personalBestScore.toFixed(2) : '--'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="progress">
        <TabsList>
          <TabsTrigger value="progress">التطور</TabsTrigger>
          <TabsTrigger value="elements">تحليل العناصر</TabsTrigger>
          <TabsTrigger value="sessions">أحدث الجلسات</TabsTrigger>
        </TabsList>
        
        <TabsContent value="progress" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>تطور الدرجات</CardTitle>
              <CardDescription>الدرجة الكلية في كل الجلسات المسجلة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]" dir="ltr">
                {isLoadingProgress ? <Skeleton className="h-full w-full" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formattedProgress}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="dateStr" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val.toFixed(0)} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                        formatter={(value: number) => [value.toFixed(2), 'الدرجة الكلية']}
                      />
                      <Line type="monotone" dataKey="totalScore" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: 'hsl(var(--primary))' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="elements" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>نسبة نجاح العناصر</CardTitle>
              <CardDescription>متوسط نسبة النجاح لكل عنصر</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="h-[400px]" dir="ltr">
                {isLoadingStats ? <Skeleton className="h-full w-full" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={elementStats || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="elementCode" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <Tooltip 
                        formatter={(value: number) => [`${value}%`, 'نسبة النجاح']}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      />
                      <Bar dataKey="successRate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sessions" className="space-y-4 pt-4">
           {isLoadingSessions ? <Skeleton className="h-40 w-full" /> : (
             <div className="grid gap-4">
               {sessions?.map(session => (
                 <Link key={session.id} href={`/sessions/${session.id}`} className="block">
                   <Card className="hover:border-primary transition-colors cursor-pointer">
                     <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-lg">{formatDate(session.date)}</div>
                          <div className="text-sm text-muted-foreground">{label(SESSION_TYPE_LABELS, session.sessionType)}</div>
                        </div>
                        {session.totalScore && (
                          <div className="text-2xl font-mono font-bold">{session.totalScore.toFixed(2)}</div>
                        )}
                     </CardContent>
                   </Card>
                 </Link>
               ))}
               {sessions?.length === 0 && <div className="text-muted-foreground text-center py-8">لم تُسجَّل أي جلسات بعد.</div>}
             </div>
           )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
