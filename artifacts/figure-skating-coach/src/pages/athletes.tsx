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

const formatDiscipline = (d: string) => {
  const map: Record<string, string> = {
    singles_men: "Men's Singles",
    singles_ladies: "Ladies' Singles",
    pairs: "Pairs",
    ice_dance: "Ice Dance"
  };
  return map[d] || d;
};

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
        toast({ title: "Success", description: "Athlete added successfully" });
        queryClient.invalidateQueries({ queryKey: getListAthletesQueryKey() });
        setOpen(false);
        // Reset form
        setName("");
        setDiscipline("singles_ladies");
        setLevel("senior");
        setNationality("");
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to add athlete", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Athletes</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Athlete
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Athlete</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g., Yuzuru Hanyu" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discipline">Discipline</Label>
                  <Select value={discipline} onValueChange={(v) => setDiscipline(v as AthleteInputDiscipline)}>
                    <SelectTrigger id="discipline">
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
                  <Label htmlFor="level">Level</Label>
                  <Select value={level} onValueChange={(v) => setLevel(v as AthleteInputLevel)}>
                    <SelectTrigger id="level">
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality (Optional)</Label>
                <Input id="nationality" value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="e.g., JPN" />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createAthlete.isPending}>
                  {createAthlete.isPending ? "Saving..." : "Save Athlete"}
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
                          <span className="capitalize">{athlete.level}</span>
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
                          <span className="text-xs text-muted-foreground">PB Score</span>
                          <span className="font-mono font-bold text-primary">{athlete.personalBestScore.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {athletes?.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
              <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <h3 className="font-medium text-foreground">No athletes yet</h3>
              <p className="text-sm mt-1">Add your first athlete to get started</p>
              <Button variant="outline" className="mt-4" onClick={() => setOpen(true)}>Add Athlete</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
