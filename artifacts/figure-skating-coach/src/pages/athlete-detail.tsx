import { useParams } from "wouter";
import { useGetAthlete, useGetAthleteProgress, useGetElementStats, useListSessions } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const formatDiscipline = (d: string) => {
  const map: Record<string, string> = {
    singles_men: "Men's Singles",
    singles_ladies: "Ladies' Singles",
    pairs: "Pairs",
    ice_dance: "Ice Dance"
  };
  return map[d] || d;
};

export default function AthleteDetail() {
  const params = useParams();
  const id = Number(params.id);

  const { data: athlete, isLoading: isLoadingAthlete } = useGetAthlete(id, { query: { enabled: !!id } });
  const { data: progress, isLoading: isLoadingProgress } = useGetAthleteProgress(id, { query: { enabled: !!id } });
  const { data: elementStats, isLoading: isLoadingStats } = useGetElementStats(id, { query: { enabled: !!id } });
  const { data: sessions, isLoading: isLoadingSessions } = useListSessions({ athleteId: id }, { query: { enabled: !!id } });

  if (isLoadingAthlete) {
    return <div className="space-y-6"><Skeleton className="h-32 w-full" /></div>;
  }

  if (!athlete) return <div>Athlete not found</div>;

  const formattedProgress = progress?.map(p => ({
    ...p,
    dateStr: format(new Date(p.date), 'MMM d')
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/athletes"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            {athlete.name}
            {athlete.nationality && <span className="text-xl font-normal text-muted-foreground">{athlete.nationality}</span>}
          </h1>
          <div className="text-muted-foreground flex gap-2 items-center mt-1">
            <span className="capitalize">{athlete.level}</span>
            <span>•</span>
            <span>{formatDiscipline(athlete.discipline)}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Personal Best</CardTitle>
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
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="elements">Elements Analysis</TabsTrigger>
          <TabsTrigger value="sessions">Recent Sessions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="progress" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Score Progression</CardTitle>
              <CardDescription>Total score across all logged sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {isLoadingProgress ? <Skeleton className="h-full w-full" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formattedProgress}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="dateStr" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val.toFixed(0)} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
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
              <CardTitle>Element Success Rate</CardTitle>
              <CardDescription>Average success rate across all elements</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="h-[400px]">
                {isLoadingStats ? <Skeleton className="h-full w-full" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={elementStats || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="elementCode" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                      <Tooltip 
                        formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Success Rate']}
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
                          <div className="font-semibold text-lg">{format(new Date(session.date), "MMMM d, yyyy")}</div>
                          <div className="text-sm text-muted-foreground capitalize">{session.sessionType.replace('_', ' ')}</div>
                        </div>
                        {session.totalScore && (
                          <div className="text-2xl font-mono font-bold">{session.totalScore.toFixed(2)}</div>
                        )}
                     </CardContent>
                   </Card>
                 </Link>
               ))}
               {sessions?.length === 0 && <div className="text-muted-foreground text-center py-8">No sessions logged yet.</div>}
             </div>
           )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
