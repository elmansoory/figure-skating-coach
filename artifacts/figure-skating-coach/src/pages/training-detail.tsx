import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import {
  useGetTrainingProgram,
  useUpdateTrainingProgram,
  useDeleteTrainingProgram,
  useListAthletes,
  getGetTrainingProgramQueryKey,
  type TrainingProgram,
  type TrainingProgramUpdateType,
  type TrainingProgramUpdateDifficulty,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDelete } from "@/components/confirm-delete";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Clock, Target, Info, Pencil, Plus, Trash2 } from "lucide-react";
import { DIFFICULTY_LABELS, TRAINING_TYPE_LABELS, label } from "@/lib/labels";

const parseExercises = (raw: string): string[] => {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};

function EditTrainingDialog({ program }: { program: TrainingProgram }) {
  const updateProgram = useUpdateTrainingProgram();
  const { data: athletes } = useListAthletes();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<TrainingProgramUpdateType>(program.type);
  const [duration, setDuration] = useState("");
  const [difficulty, setDifficulty] = useState<TrainingProgramUpdateDifficulty>("medium");
  const [focus, setFocus] = useState("");
  const [athleteId, setAthleteId] = useState("none");
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState<string[]>([""]);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      const current = parseExercises(program.exercises);
      setTitle(program.title);
      setType(program.type);
      setDuration(program.duration.toString());
      setDifficulty(program.difficulty ?? "medium");
      setFocus(program.focus ?? "");
      setAthleteId(program.athleteId ? program.athleteId.toString() : "none");
      setNotes(program.notes ?? "");
      setExercises(current.length > 0 ? current : [""]);
    }
    setOpen(next);
  };

  const handleExerciseChange = (index: number, value: string) => {
    const newEx = [...exercises];
    newEx[index] = value;
    setExercises(newEx);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !duration) return;

    updateProgram.mutate({
      id: program.id,
      data: {
        title: title.trim(),
        type,
        duration: parseInt(duration, 10),
        difficulty,
        focus: focus.trim() || null,
        athleteId: athleteId === "none" ? null : parseInt(athleteId, 10),
        exercises: JSON.stringify(exercises.filter(ex => ex.trim() !== "")),
        notes: notes.trim() || null,
      }
    }, {
      onSuccess: () => {
        toast({ title: "تم", description: "تم تحديث البرنامج" });
        queryClient.invalidateQueries();
        setOpen(false);
      },
      onError: () => {
        toast({ title: "خطأ", description: "تعذّر تحديث البرنامج", variant: "destructive" });
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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تعديل برنامج التدريب</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">عنوان البرنامج</Label>
            <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-type">نوع التدريب</Label>
              <Select value={type} onValueChange={(v) => setType(v as TrainingProgramUpdateType)}>
                <SelectTrigger id="edit-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TRAINING_TYPE_LABELS).map(([value, text]) => (
                    <SelectItem key={value} value={value}>{text}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-duration">المدة (بالدقائق)</Label>
              <Input id="edit-duration" type="number" min="1" value={duration} onChange={(e) => setDuration(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-difficulty">الصعوبة</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as TrainingProgramUpdateDifficulty)}>
                <SelectTrigger id="edit-difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DIFFICULTY_LABELS).map(([value, text]) => (
                    <SelectItem key={value} value={value}>{text}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-athlete">اللاعب المخصص</Label>
              <Select value={athleteId} onValueChange={setAthleteId}>
                <SelectTrigger id="edit-athlete">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">برنامج عام (غير مخصص)</SelectItem>
                  {athletes?.map(a => (
                    <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-focus">التركيز الأساسي</Label>
            <Input id="edit-focus" value={focus} onChange={(e) => setFocus(e.target.value)} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>التمارين</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setExercises([...exercises, ""])}>
                <Plus className="w-4 h-4 me-2" />
                إضافة تمرين
              </Button>
            </div>
            {exercises.map((ex, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  value={ex}
                  onChange={(e) => handleExerciseChange(index, e.target.value)}
                  placeholder={`التمرين ${index + 1}`}
                  aria-label={`التمرين ${index + 1}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`حذف التمرين ${index + 1}`}
                  onClick={() => setExercises(exercises.filter((_, i) => i !== index))}
                  disabled={exercises.length === 1}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-notes">ملاحظات</Label>
            <Textarea id="edit-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button type="submit" disabled={updateProgram.isPending}>
              {updateProgram.isPending ? "جارٍ الحفظ..." : "حفظ التغييرات"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function TrainingDetail() {
  const params = useParams();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteProgram = useDeleteTrainingProgram();

  const { data: program, isLoading } = useGetTrainingProgram(id, { query: { enabled: !!id, queryKey: getGetTrainingProgramQueryKey(id) } });

  const handleDelete = () => {
    deleteProgram.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "تم", description: "تم حذف البرنامج" });
        queryClient.removeQueries({ queryKey: getGetTrainingProgramQueryKey(id) });
        queryClient.invalidateQueries();
        setLocation("/training");
      },
      onError: () => {
        toast({ title: "خطأ", description: "تعذّر حذف البرنامج", variant: "destructive" });
      }
    });
  };

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-32 w-full" /></div>;
  }

  if (!program) return <div>البرنامج غير موجود</div>;

  const exercises = parseExercises(program.exercises);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/training" aria-label="رجوع إلى برامج التدريب"><ArrowLeft className="w-4 h-4 rtl:rotate-180" /></Link>
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{program.title}</h1>
            {program.difficulty && (
              <span className={`text-xs font-semibold px-2 py-1 rounded
                ${program.difficulty === 'elite' ? 'bg-primary/20 text-primary' : 
                  program.difficulty === 'hard' ? 'bg-destructive/20 text-destructive' : 
                  'bg-secondary text-secondary-foreground'}`}>
                {label(DIFFICULTY_LABELS, program.difficulty)}
              </span>
            )}
          </div>
          <div className="text-muted-foreground flex gap-2 items-center mt-1">
            <span>{label(TRAINING_TYPE_LABELS, program.type)}</span>
            {program.athleteName && (
              <>
                <span>•</span>
                <span>مخصص لـ: {program.athleteName}</span>
              </>
            )}
          </div>
        </div>
        <div className="ms-auto flex gap-2">
          <EditTrainingDialog program={program} />
          <ConfirmDelete
            trigger={
              <Button variant="outline" size="sm" className="text-destructive">
                <Trash2 className="w-4 h-4 me-2" />
                حذف
              </Button>
            }
            title={`حذف «${program.title}»؟`}
            description="سيتم حذف برنامج التدريب نهائيًا."
            onConfirm={handleDelete}
            isPending={deleteProgram.isPending}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
         <Card>
           <CardContent className="p-4 flex items-center gap-4">
             <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center text-primary">
               <Clock className="w-5 h-5" />
             </div>
             <div>
               <p className="text-sm font-medium text-muted-foreground">المدة</p>
               <p className="text-lg font-bold">{program.duration} دقيقة</p>
             </div>
           </CardContent>
         </Card>
         {program.focus && (
           <Card className="md:col-span-2">
             <CardContent className="p-4 flex items-center gap-4">
               <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center text-primary">
                 <Target className="w-5 h-5" />
               </div>
               <div>
                 <p className="text-sm font-medium text-muted-foreground">التركيز الأساسي</p>
                 <p className="text-lg font-medium">{program.focus}</p>
               </div>
             </CardContent>
           </Card>
         )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>التمارين والتدريبات</CardTitle>
              <CardDescription>خطوات البرنامج بالتفصيل</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {exercises.length > 0 ? (
                  exercises.map((exercise, index) => (
                    <div key={index} className="flex gap-4 p-4 rounded-lg bg-secondary/50 border border-border">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-background flex items-center justify-center font-bold text-sm text-muted-foreground">
                        {index + 1}
                      </div>
                      <div className="pt-1">
                        <p className="font-medium text-foreground">{exercise}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">لا توجد تمارين محددة لهذا البرنامج.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {program.notes && (
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ملاحظات المدرب</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 text-muted-foreground bg-secondary/30 p-4 rounded-md">
                  <Info className="w-5 h-5 flex-shrink-0 text-primary" />
                  <p className="text-sm whitespace-pre-wrap">{program.notes}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
