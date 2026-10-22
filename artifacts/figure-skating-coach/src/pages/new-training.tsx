import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useCreateTrainingProgram, useListAthletes, TrainingProgramInputType, TrainingProgramInputDifficulty } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { DIFFICULTY_LABELS, TRAINING_TYPE_LABELS } from "@/lib/labels";
import { useToast } from "@/hooks/use-toast";

export default function NewTraining() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: athletes } = useListAthletes();
  const createProgram = useCreateTrainingProgram();

  const [title, setTitle] = useState("");
  const [type, setType] = useState<TrainingProgramInputType>("on_ice");
  const [duration, setDuration] = useState("");
  const [difficulty, setDifficulty] = useState<TrainingProgramInputDifficulty | "">("");
  const [focus, setFocus] = useState("");
  const [athleteId, setAthleteId] = useState<string>("");
  const [notes, setNotes] = useState("");
  
  const [exercises, setExercises] = useState<string[]>([""]);

  const handleAddExercise = () => setExercises([...exercises, ""]);
  const handleRemoveExercise = (index: number) => {
    if (exercises.length > 1) {
      const newEx = [...exercises];
      newEx.splice(index, 1);
      setExercises(newEx);
    }
  };
  const handleExerciseChange = (index: number, value: string) => {
    const newEx = [...exercises];
    newEx[index] = value;
    setExercises(newEx);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !duration) {
      toast({ title: "خطأ", description: "العنوان والمدة مطلوبان", variant: "destructive" });
      return;
    }

    const filteredExercises = exercises.filter(ex => ex.trim() !== "");

    createProgram.mutate({
      data: {
        title,
        type,
        duration: parseInt(duration, 10),
        difficulty: difficulty || undefined,
        focus,
        athleteId: athleteId && athleteId !== "none" ? parseInt(athleteId, 10) : undefined,
        exercises: JSON.stringify(filteredExercises),
        notes
      }
    }, {
      onSuccess: (program) => {
        toast({ title: "تم", description: "تم إنشاء برنامج التدريب بنجاح." });
        setLocation(`/training/${program.id}`);
      },
      onError: () => {
        toast({ title: "خطأ", description: "تعذّر إنشاء البرنامج.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/training" aria-label="رجوع إلى برامج التدريب"><ArrowLeft className="w-4 h-4 rtl:rotate-180" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إنشاء برنامج تدريب</h1>
          <p className="text-muted-foreground">صمّم برنامج تدريب جديدًا للاعبين</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b border-border pb-2">المعلومات الأساسية</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">عنوان البرنامج</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="مثال: تمرين السرعة قبل المنافسة" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">نوع التدريب</Label>
                  <Select value={type} onValueChange={(v) => setType(v as TrainingProgramInputType)}>
                    <SelectTrigger id="type">
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
                  <Label htmlFor="duration">المدة (بالدقائق)</Label>
                  <Input id="duration" type="number" min="1" value={duration} onChange={(e) => setDuration(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">الصعوبة (اختياري)</Label>
                  <Select value={difficulty} onValueChange={(v) => setDifficulty(v as TrainingProgramInputDifficulty)}>
                    <SelectTrigger id="difficulty">
                      <SelectValue placeholder="اختر الصعوبة" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DIFFICULTY_LABELS).map(([value, text]) => (
                        <SelectItem key={value} value={value}>{text}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="focus">التركيز الأساسي (اختياري)</Label>
                <Input id="focus" value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="مثال: مداخل الأكسل الثلاثي، قوة الجذع" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="athlete">تخصيص للاعب (اختياري)</Label>
                <Select value={athleteId} onValueChange={setAthleteId}>
                  <SelectTrigger id="athlete">
                    <SelectValue placeholder="برنامج عام (غير مخصص)" />
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

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="text-lg font-medium">التمارين</h3>
                <Button type="button" variant="outline" size="sm" onClick={handleAddExercise}>
                  <Plus className="w-4 h-4 me-2" />
                  إضافة تمرين
                </Button>
              </div>

              <div className="space-y-3">
                {exercises.map((ex, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="w-8 h-10 flex-shrink-0 flex items-center justify-center font-bold text-muted-foreground bg-secondary rounded text-sm">
                      {index + 1}
                    </div>
                    <Input 
                      value={ex} 
                      onChange={(e) => handleExerciseChange(index, e.target.value)} 
                      placeholder={`التمرين ${index + 1}`}
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      aria-label={`حذف التمرين ${index + 1}`}
                      onClick={() => handleRemoveExercise(index)}
                      disabled={exercises.length === 1}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات (اختياري)</Label>
              <Textarea 
                id="notes" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="تعليمات المدرب، تحذيرات السلامة..." 
                className="min-h-[100px]"
              />
            </div>

            <div className="pt-4 flex justify-end gap-2 border-t border-border mt-6">
              <Button type="button" variant="outline" onClick={() => setLocation('/training')}>إلغاء</Button>
              <Button type="submit" disabled={createProgram.isPending}>
                {createProgram.isPending ? "جارٍ الإنشاء..." : "إنشاء البرنامج"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
