import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateSession, useListAthletes, PerformanceSessionInputSessionType } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function NewSession() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: athletes } = useListAthletes();
  const createSession = useCreateSession();

  const [athleteId, setAthleteId] = useState<string>("");
  const [sessionType, setSessionType] = useState<PerformanceSessionInputSessionType>("practice");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [venue, setVenue] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!athleteId) {
      toast({ title: "Error", description: "Please select an athlete", variant: "destructive" });
      return;
    }

    createSession.mutate({
      data: {
        athleteId: parseInt(athleteId, 10),
        sessionType,
        date: new Date(date).toISOString(),
        venue,
        notes
      }
    }, {
      onSuccess: (session) => {
        toast({ title: "Session created", description: "You can now log technical elements." });
        setLocation(`/sessions/${session.id}`);
      },
      onError: (err) => {
        toast({ title: "Failed to create session", description: "An error occurred.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/sessions"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Log Session</h1>
          <p className="text-muted-foreground">Create a new performance or practice session</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="athlete">Athlete</Label>
              <Select value={athleteId} onValueChange={setAthleteId}>
                <SelectTrigger id="athlete">
                  <SelectValue placeholder="Select athlete" />
                </SelectTrigger>
                <SelectContent>
                  {athletes?.map(a => (
                    <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Session Type</Label>
              <Select value={sessionType} onValueChange={(v) => setSessionType(v as PerformanceSessionInputSessionType)}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short_program">Short Program</SelectItem>
                  <SelectItem value="free_skate">Free Skate</SelectItem>
                  <SelectItem value="exhibition">Exhibition</SelectItem>
                  <SelectItem value="practice">Practice</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input 
                id="date" 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue">Venue (Optional)</Label>
              <Input 
                id="venue" 
                value={venue} 
                onChange={(e) => setVenue(e.target.value)} 
                placeholder="e.g. Olympic Training Center" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea 
                id="notes" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="Session focus, conditions, overall feeling..." 
                className="min-h-[100px]"
              />
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setLocation('/sessions')}>Cancel</Button>
              <Button type="submit" disabled={createSession.isPending}>
                {createSession.isPending ? "Creating..." : "Create Session"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
