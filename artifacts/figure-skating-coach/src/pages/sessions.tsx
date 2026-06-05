import { useState } from "react";
import { useListSessions, useListAthletes } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Plus, Activity, ArrowRight, Filter } from "lucide-react";
import { format } from "date-fns";

export default function Sessions() {
  const [athleteId, setAthleteId] = useState<number | undefined>();
  
  const { data: sessions, isLoading: isLoadingSessions } = useListSessions(
    athleteId ? { athleteId } : undefined
  );
  const { data: athletes } = useListAthletes();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
        <div className="flex items-center gap-3">
          <select 
            className="h-10 px-3 py-2 bg-background border border-input rounded-md text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            value={athleteId || ""}
            onChange={(e) => setAthleteId(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">All Athletes</option>
            {athletes?.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <Button asChild>
            <Link href="/sessions/new">
              <Plus className="w-4 h-4 mr-2" />
              Log Session
            </Link>
          </Button>
        </div>
      </div>

      {isLoadingSessions ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {sessions?.map(session => (
            <Link key={session.id} href={`/sessions/${session.id}`} className="block">
              <Card className="hover:border-primary transition-colors cursor-pointer">
                <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded bg-secondary flex items-center justify-center text-primary flex-shrink-0">
                      <Activity className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{session.athleteName || 'Unknown Athlete'}</h3>
                      <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <span>{format(new Date(session.date), "MMM d, yyyy")}</span>
                        <span>•</span>
                        <span className="capitalize">{session.sessionType.replace('_', ' ')}</span>
                        {session.venue && (
                          <>
                            <span>•</span>
                            <span>{session.venue}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full border-t sm:border-0 border-border/50 pt-4 sm:pt-0">
                    <div className="flex gap-6">
                      <div className="flex flex-col text-right">
                        <span className="text-xs text-muted-foreground">Total</span>
                        <span className="font-mono font-bold text-primary">{session.totalScore?.toFixed(2) || '--'}</span>
                      </div>
                      <div className="flex flex-col text-right hidden sm:flex">
                        <span className="text-xs text-muted-foreground">TES</span>
                        <span className="font-mono font-semibold">{session.technicalScore?.toFixed(2) || '--'}</span>
                      </div>
                      <div className="flex flex-col text-right hidden sm:flex">
                        <span className="text-xs text-muted-foreground">PCS</span>
                        <span className="font-mono font-semibold">{session.componentScore?.toFixed(2) || '--'}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {sessions?.length === 0 && (
            <div className="py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <h3 className="font-medium text-foreground">No sessions found</h3>
              <p className="text-sm mt-1">Try adjusting filters or log a new session</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
