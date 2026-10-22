import { useState } from "react";
import { useListTrainingPrograms } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Plus, ClipboardList, Timer, Target } from "lucide-react";
import { DIFFICULTY_LABELS, TRAINING_TYPE_LABELS, label } from "@/lib/labels";

export default function Training() {
  const { data: programs, isLoading } = useListTrainingPrograms();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">برامج التدريب</h1>
        <Button asChild>
          <Link href="/training/new">
            <Plus className="w-4 h-4 me-2" />
            إنشاء برنامج
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {programs?.map(program => (
            <Link key={program.id} href={`/training/${program.id}`} className="block">
              <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center text-primary flex-shrink-0">
                      <ClipboardList className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg leading-tight">{program.title}</h3>
                      <div className="text-sm text-muted-foreground mt-1">
                        {label(TRAINING_TYPE_LABELS, program.type)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto space-y-3">
                    {program.focus && (
                      <div className="flex items-center gap-2 text-sm">
                        <Target className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground truncate">{program.focus}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t border-border/50 pt-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Timer className="w-4 h-4" />
                        <span>{program.duration} دقيقة</span>
                      </div>
                      {program.difficulty && (
                        <div className={`text-xs font-semibold px-2 py-1 rounded
                          ${program.difficulty === 'elite' ? 'bg-primary/20 text-primary' : 
                            program.difficulty === 'hard' ? 'bg-destructive/20 text-destructive' : 
                            'bg-secondary text-secondary-foreground'}`}>
                          {label(DIFFICULTY_LABELS, program.difficulty)}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {programs?.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <h3 className="font-medium text-foreground">لا توجد برامج تدريب</h3>
              <p className="text-sm mt-1">أنشئ أول برنامج تدريب لتخصيصه للاعبين</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/training/new">إنشاء برنامج</Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
