import { useParams, Link } from "wouter";
import { useGetTrainingProgram } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Target, Info } from "lucide-react";

export default function TrainingDetail() {
  const params = useParams();
  const id = Number(params.id);

  const { data: program, isLoading } = useGetTrainingProgram(id, { query: { enabled: !!id } });

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-32 w-full" /></div>;
  }

  if (!program) return <div>Program not found</div>;

  let exercises: string[] = [];
  try {
    exercises = JSON.parse(program.exercises);
  } catch (e) {
    // ignore parsing errors
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/training"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{program.title}</h1>
            {program.difficulty && (
              <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded
                ${program.difficulty === 'elite' ? 'bg-primary/20 text-primary' : 
                  program.difficulty === 'hard' ? 'bg-destructive/20 text-destructive' : 
                  'bg-secondary text-secondary-foreground'}`}>
                {program.difficulty}
              </span>
            )}
          </div>
          <div className="text-muted-foreground flex gap-2 items-center mt-1">
            <span className="capitalize">{program.type.replace('_', ' ')}</span>
            {program.athleteName && (
              <>
                <span>•</span>
                <span>Assigned to: {program.athleteName}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
         <Card>
           <CardContent className="p-4 flex items-center gap-4">
             <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center text-primary">
               <Clock className="w-5 h-5" />
             </div>
             <div>
               <p className="text-sm font-medium text-muted-foreground">Duration</p>
               <p className="text-lg font-bold">{program.duration} minutes</p>
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
                 <p className="text-sm font-medium text-muted-foreground">Primary Focus</p>
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
              <CardTitle>Exercises & Drills</CardTitle>
              <CardDescription>Step-by-step breakdown of the program</CardDescription>
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
                  <p className="text-muted-foreground">No exercises defined for this program.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {program.notes && (
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Coach's Notes</CardTitle>
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
