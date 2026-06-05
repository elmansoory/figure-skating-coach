import { useState } from "react";
import { useParams, Link } from "wouter";
import { useGetSession, useListElements, useCreateElement, SkatingElementInputElementType, getListElementsQueryKey, getGetSessionQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Plus } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function SessionDetail() {
  const params = useParams();
  const id = Number(params.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: session, isLoading: isLoadingSession } = useGetSession(id, { query: { enabled: !!id } });
  const { data: elements, isLoading: isLoadingElements } = useListElements({ sessionId: id }, { query: { enabled: !!id } });
  const createElement = useCreateElement();

  const [open, setOpen] = useState(false);
  const [elementCode, setElementCode] = useState("");
  const [elementType, setElementType] = useState<SkatingElementInputElementType>("jump");
  const [baseValue, setBaseValue] = useState("");
  const [goe, setGoe] = useState("");
  const [isUnderRotated, setIsUnderRotated] = useState(false);
  const [isFallDown, setIsFallDown] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!elementCode || !baseValue || !goe) return;

    createElement.mutate({
      data: {
        sessionId: id,
        elementCode,
        elementType,
        baseValue: parseFloat(baseValue),
        goe: parseFloat(goe),
        isUnderRotated,
        isFallDown
      }
    }, {
      onSuccess: () => {
        toast({ title: "Success", description: "Element added successfully" });
        queryClient.invalidateQueries({ queryKey: getListElementsQueryKey({ sessionId: id }) });
        queryClient.invalidateQueries({ queryKey: getGetSessionQueryKey(id) });
        setOpen(false);
        // Reset form
        setElementCode("");
        setBaseValue("");
        setGoe("");
        setIsUnderRotated(false);
        setIsFallDown(false);
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to add element", variant: "destructive" });
      }
    });
  };

  if (isLoadingSession) {
    return <div className="space-y-6"><Skeleton className="h-32 w-full" /></div>;
  }

  if (!session) return <div>Session not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/sessions"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {session.athleteName || 'Unknown Athlete'} - {format(new Date(session.date), "MMMM d, yyyy")}
          </h1>
          <div className="text-muted-foreground flex gap-2 items-center mt-1">
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

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-primary">
              {session.totalScore ? session.totalScore.toFixed(2) : '--'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Technical Elements (TES)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {session.technicalScore ? session.technicalScore.toFixed(2) : '--'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Program Components (PCS)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {session.componentScore ? session.componentScore.toFixed(2) : '--'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Deductions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-destructive">
              {session.deductions ? `-${session.deductions.toFixed(2)}` : '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Technical Elements</CardTitle>
            <CardDescription>Detailed breakdown of executed elements</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Element
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Technical Element</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Element Code</Label>
                    <Input id="code" value={elementCode} onChange={(e) => setElementCode(e.target.value)} required placeholder="e.g., 4T, CCoSp4" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select value={elementType} onValueChange={(v) => setElementType(v as SkatingElementInputElementType)}>
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="jump">Jump</SelectItem>
                        <SelectItem value="spin">Spin</SelectItem>
                        <SelectItem value="step_sequence">Step Sequence</SelectItem>
                        <SelectItem value="choreographic">Choreographic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bv">Base Value</Label>
                    <Input id="bv" type="number" step="0.01" value={baseValue} onChange={(e) => setBaseValue(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goe">GOE (+/-)</Label>
                    <Input id="goe" type="number" step="0.01" value={goe} onChange={(e) => setGoe(e.target.value)} required />
                  </div>
                </div>
                
                <div className="flex gap-4 pt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="underRotated" checked={isUnderRotated} onCheckedChange={(checked) => setIsUnderRotated(!!checked)} />
                    <Label htmlFor="underRotated" className="font-normal cursor-pointer">Under-rotated (&lt;)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="fall" checked={isFallDown} onCheckedChange={(checked) => setIsFallDown(!!checked)} />
                    <Label htmlFor="fall" className="font-normal cursor-pointer text-destructive">Fall</Label>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createElement.isPending}>
                    {createElement.isPending ? "Adding..." : "Add Element"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoadingElements ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : (
            <div className="w-full overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left font-medium pb-2 pr-4">#</th>
                    <th className="text-left font-medium pb-2 pr-4">Element</th>
                    <th className="text-left font-medium pb-2 pr-4">Type</th>
                    <th className="text-right font-medium pb-2 pr-4">Base Value</th>
                    <th className="text-right font-medium pb-2 pr-4">GOE</th>
                    <th className="text-right font-medium pb-2">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {elements?.map((el, idx) => (
                    <tr key={el.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-3 pr-4 text-muted-foreground">{idx + 1}</td>
                      <td className="py-3 pr-4">
                        <span className="font-mono font-bold bg-secondary px-2 py-1 rounded text-foreground">{el.elementCode}</span>
                        {(el.isUnderRotated || el.isFallDown) && (
                           <div className="flex gap-1 mt-1">
                             {el.isUnderRotated && <span className="text-xs text-destructive font-bold">&lt;</span>}
                             {el.isFallDown && <span className="text-xs text-destructive font-bold">Fall</span>}
                           </div>
                        )}
                      </td>
                      <td className="py-3 pr-4 capitalize text-muted-foreground">{el.elementType.replace('_', ' ')}</td>
                      <td className="py-3 pr-4 text-right font-mono text-foreground">{el.baseValue.toFixed(2)}</td>
                      <td className={`py-3 pr-4 text-right font-mono font-semibold ${el.goe > 0 ? 'text-green-500 dark:text-green-400' : el.goe < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {el.goe > 0 ? '+' : ''}{el.goe.toFixed(2)}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-foreground">
                        {el.executedScore?.toFixed(2) || (el.baseValue + el.goe).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {elements?.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">No elements logged.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
