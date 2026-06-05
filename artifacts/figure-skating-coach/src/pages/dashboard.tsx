import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Activity, ClipboardList, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: summary, isLoading } = useGetDashboardSummary();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Athletes</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalAthletes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Logged Sessions</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalSessions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Training Programs</CardTitle>
            <ClipboardList className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalTrainingPrograms}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.avgScore.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
            <CardDescription>Latest logged performances and practices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.recentSessions.map(session => (
                <Link key={session.id} href={`/sessions/${session.id}`} className="block group">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border group-hover:border-primary transition-colors">
                    <div>
                      <div className="font-semibold text-sm">{session.athleteName}</div>
                      <div className="text-xs text-muted-foreground flex gap-2">
                        <span>{format(new Date(session.date), "MMM d, yyyy")}</span>
                        <span>•</span>
                        <span className="capitalize">{session.sessionType.replace('_', ' ')}</span>
                      </div>
                    </div>
                    {session.totalScore ? (
                      <div className="font-mono font-bold text-primary">{session.totalScore.toFixed(2)}</div>
                    ) : null}
                  </div>
                </Link>
              ))}
              {summary.recentSessions.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">No recent sessions found.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Athletes</CardTitle>
            <CardDescription>Athletes by personal best score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.topAthletes.map(athlete => (
                <Link key={athlete.id} href={`/athletes/${athlete.id}`} className="block group">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border group-hover:border-primary transition-colors">
                    <div>
                      <div className="font-semibold text-sm">{athlete.name}</div>
                      <div className="text-xs text-muted-foreground flex gap-2">
                        <span className="capitalize">{athlete.level}</span>
                        <span>•</span>
                        <span className="capitalize">{athlete.discipline.replace('_', ' ')}</span>
                      </div>
                    </div>
                    {athlete.personalBestScore ? (
                      <div className="font-mono font-bold">{athlete.personalBestScore.toFixed(2)}</div>
                    ) : (
                      <div className="text-xs text-muted-foreground">No score</div>
                    )}
                  </div>
                </Link>
              ))}
              {summary.topAthletes.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">No athletes found.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
