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
import { format } from "date-fns";
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

const formatDiscipline = (d: string) => {
  const map: Record<string, string> = {
    singles_men: "Men's Singles",
    singles_ladies: "Ladies' Singles",
    pairs: "Pairs",
    ice_dance: "Ice Dance"
  };
  return map[d] || d;
};

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
        toast({ title: "Success", description: "Athlete updated" });
        queryClient.invalidateQueries();
        setOpen(false);
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to update athlete", variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="w-4 h-4 mr-2" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Athlete</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Full Name</Label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-discipline">Discipline</Label>
              <Select value={discipline} onValueChange={(v) => setDiscipline(v as AthleteUpdateDiscipline)}>
                <SelectTrigger id="edit-discipline">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="singles_men">Men's Singles</SelectItem>
                  <SelectItem value="singles_ladies">Ladies' Singles</SelectItem>
                  <SelectItem value="pairs">Pairs</SelectItem>
                  <SelectItem value="ice_dance">Ice Dance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-level">Level</Label>
              <Select value={level} onValueChange={(v) => setLevel(v as AthleteUpdateLevel)}>
                <SelectTrigger id="edit-level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="junior">Junior</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-nationality">Nationality</Label>
              <Input id="edit-nationality" value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="e.g., EGY" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dob">Date of Birth</Label>
              <Input id="edit-dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-pb">Personal Best</Label>
              <Input id="edit-pb" type="number" step="0.01" min="0" value={personalBestScore} onChange={(e) => setPersonalBestScore(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea id="edit-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={updateAthlete.isPending}>
              {updateAthlete.isPending ? "Saving..." : "Save Changes"}
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
        toast({ title: "Athlete deleted" });
        queryClient.removeQueries({ queryKey: getGetAthleteQueryKey(id) });
        queryClient.invalidateQueries();
        setLocation("/athletes");
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to delete athlete", variant: "destructive" });
      }
    });
  };

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
        <div className="ml-auto flex gap-2">
          <EditAthleteDialog athlete={athlete} />
          <ConfirmDelete
            trigger={
              <Button variant="outline" size="sm" className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            }
            title={`Delete ${athlete.name}?`}
            description="This permanently deletes the athlete together with all their sessions and recorded elements. Training programs assigned to them are kept but become unassigned."
            onConfirm={handleDelete}
            isPending={deleteAthlete.isPending}
          />
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
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <Tooltip 
                        formatter={(value: number) => [`${value}%`, 'Success Rate']}
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
