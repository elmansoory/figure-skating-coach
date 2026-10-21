import { useState } from "react";
import { useListAthletes, useCreateAthlete, AthleteInputDiscipline, AthleteInputLevel, getListAthletesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Plus, User, Trophy, Activity, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { DISCIPLINE_LABELS, LEVEL_LABELS, label } from "@/lib/labels";

const formatDiscipline = (d: string) => label(DISCIPLINE_LABELS, d);

export default function Athletes() {
  const { data: athletes, isLoading } = useListAthletes();
  const createAthlete = useCreateAthlete();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [discipline, setDiscipline] = useState<AthleteInputDiscipline>("singles_ladies");
  const [level, setLevel] = useState<AthleteInputLevel>("senior");
  const [nationality, setNationality] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    createAthlete.mutate({
      data: {
        name,
        discipline,
        level,
        nationality
      }
    }, {
      onSuccess: () => {
        toast({ title: "تم", description: "تمت إضافة اللاعب بنجاح" });
        queryClient.invalidateQueries({ queryKey: getListAthletesQueryKey() });
        setOpen(false);
        // Reset form
        setName("");
        setDiscipline("singles_ladies");
        setLevel("senior");
        setNationality("");
      },
      onError: () => {
        toast({ title: "خطأ", description: "تعذّرت إضافة اللاعب", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">اللاعبون</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 me-2" />
              إضافة لاعب
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة لاعب جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">الاسم الكامل</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="مثال: Yuzuru Hanyu" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discipline">التخصص</Label>
                  <Select value={discipline} onValueChange={(v) => setDiscipline(v as AthleteInputDiscipline)}>
                    <SelectTrigger id="discipline">
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
                  <Label htmlFor="level">المستوى</Label>
                  <Select value={level} onValueChange={(v) => setLevel(v as AthleteInputLevel)}>
                    <SelectTrigger id="level">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LEVEL_LABELS).map(([value, text]) => (
                        <SelectItem key={value} value={value}>{text}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality">الجنسية (اختياري)</Label>
                <Input id="nationality" value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="مثال: EGY" />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                <Button type="submit" disabled={createAthlete.isPending}>
                  {createAthlete.isPending ? "جارٍ الحفظ..." : "حفظ اللاعب"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {athletes?.map(athlete => (
            <Link key={athlete.id} href={`/athletes/${athlete.id}`} className="block">
              <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold">
                        {athlete.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg leading-tight">{athlete.name}</h3>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <span>{label(LEVEL_LABELS, athlete.level)}</span>
                          <span>•</span>
                          <span>{formatDiscipline(athlete.discipline)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/50">
                    <div className="flex gap-4 text-sm">
                      {athlete.personalBestScore && (
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">أفضل نتيجة</span>
                          <span className="font-mono font-bold text-primary">{athlete.personalBestScore.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {athletes?.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
              <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <h3 className="font-medium text-foreground">لا يوجد لاعبون بعد</h3>
              <p className="text-sm mt-1">أضف أول لاعب للبدء</p>
              <Button variant="outline" className="mt-4" onClick={() => setOpen(true)}>إضافة لاعب</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
