import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import {
  useGetSession,
  useListElements,
  useCreateElement,
  useUpdateElement,
  useDeleteElement,
  useUpdateSession,
  useDeleteSession,
  SkatingElementInputElementType,
  PerformanceSessionUpdateSessionType,
  getListElementsQueryKey,
  getGetSessionQueryKey,
  type PerformanceSession,
  type SkatingElement,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDelete } from "@/components/confirm-delete";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { ELEMENT_TYPE_LABELS, SESSION_TYPE_LABELS, formatDate, label } from "@/lib/labels";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const optionalNumber = (value: string) => (value.trim() === "" ? null : parseFloat(value));

function EditSessionDialog({ session }: { session: PerformanceSession }) {
  const updateSession = useUpdateSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const [sessionType, setSessionType] = useState<PerformanceSessionUpdateSessionType>(session.sessionType);
  const [date, setDate] = useState("");
  const [totalScore, setTotalScore] = useState("");
  const [technicalScore, setTechnicalScore] = useState("");
  const [componentScore, setComponentScore] = useState("");
  const [deductions, setDeductions] = useState("");
  const [venue, setVenue] = useState("");
  const [notes, setNotes] = useState("");

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setSessionType(session.sessionType);
      setDate(format(new Date(session.date), "yyyy-MM-dd"));
      setTotalScore(session.totalScore?.toString() ?? "");
      setTechnicalScore(session.technicalScore?.toString() ?? "");
      setComponentScore(session.componentScore?.toString() ?? "");
      setDeductions(session.deductions?.toString() ?? "");
      setVenue(session.venue ?? "");
      setNotes(session.notes ?? "");
    }
    setOpen(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;

    updateSession.mutate({
      id: session.id,
      data: {
        sessionType,
        date: new Date(date).toISOString(),
        totalScore: optionalNumber(totalScore),
        technicalScore: optionalNumber(technicalScore),
        componentScore: optionalNumber(componentScore),
        deductions: optionalNumber(deductions),
        venue: venue.trim() || null,
        notes: notes.trim() || null,
      }
    }, {
      onSuccess: () => {
        toast({ title: "تم", description: "تم تحديث الجلسة" });
        queryClient.invalidateQueries();
        setOpen(false);
      },
      onError: () => {
        toast({ title: "خطأ", description: "تعذّر تحديث الجلسة", variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="w-4 h-4 me-2" />
          تعديل
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تعديل الجلسة</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-type">نوع الجلسة</Label>
              <Select value={sessionType} onValueChange={(v) => setSessionType(v as PerformanceSessionUpdateSessionType)}>
                <SelectTrigger id="edit-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SESSION_TYPE_LABELS).map(([value, text]) => (
                    <SelectItem key={value} value={value}>{text}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-date">التاريخ</Label>
              <Input id="edit-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-total">الدرجة الكلية</Label>
              <Input id="edit-total" type="number" step="0.01" value={totalScore} onChange={(e) => setTotalScore(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tes">TES</Label>
              <Input id="edit-tes" type="number" step="0.01" value={technicalScore} onChange={(e) => setTechnicalScore(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-pcs">PCS</Label>
              <Input id="edit-pcs" type="number" step="0.01" value={componentScore} onChange={(e) => setComponentScore(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-deductions">الخصومات</Label>
              <Input id="edit-deductions" type="number" step="0.01" min="0" value={deductions} onChange={(e) => setDeductions(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-venue">المكان</Label>
            <Input id="edit-venue" value={venue} onChange={(e) => setVenue(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-notes">ملاحظات</Label>
            <Textarea id="edit-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button type="submit" disabled={updateSession.isPending}>
              {updateSession.isPending ? "جارٍ الحفظ..." : "حفظ التغييرات"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function SessionDetail() {
  const params = useParams();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: session, isLoading: isLoadingSession } = useGetSession(id, { query: { enabled: !!id, queryKey: getGetSessionQueryKey(id) } });
  const { data: elements, isLoading: isLoadingElements } = useListElements({ sessionId: id }, { query: { enabled: !!id, queryKey: getListElementsQueryKey({ sessionId: id }) } });
  const createElement = useCreateElement();
  const updateElement = useUpdateElement();
  const deleteElement = useDeleteElement();
  const deleteSession = useDeleteSession();

  const [open, setOpen] = useState(false);
  // null while adding a new element, otherwise the element being edited
  const [editingElement, setEditingElement] = useState<SkatingElement | null>(null);
  const [elementCode, setElementCode] = useState("");
  const [elementType, setElementType] = useState<SkatingElementInputElementType>("jump");
  const [baseValue, setBaseValue] = useState("");
  const [goe, setGoe] = useState("");
  const [isUnderRotated, setIsUnderRotated] = useState(false);
  const [isFallDown, setIsFallDown] = useState(false);

  const openElementDialog = (element: SkatingElement | null) => {
    setEditingElement(element);
    setElementCode(element?.elementCode ?? "");
    setElementType(element?.elementType ?? "jump");
    setBaseValue(element?.baseValue.toString() ?? "");
    setGoe(element?.goe.toString() ?? "");
    setIsUnderRotated(element?.isUnderRotated ?? false);
    setIsFallDown(element?.isFallDown ?? false);
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!elementCode || !baseValue || !goe) return;

    const data = {
      elementCode,
      elementType,
      baseValue: parseFloat(baseValue),
      goe: parseFloat(goe),
      isUnderRotated,
      isFallDown
    };
    const callbacks = {
      onSuccess: () => {
        toast({ title: "تم", description: editingElement ? "تم تحديث العنصر" : "تمت إضافة العنصر بنجاح" });
        queryClient.invalidateQueries();
        setOpen(false);
      },
      onError: () => {
        toast({ title: "خطأ", description: editingElement ? "تعذّر تحديث العنصر" : "تعذّرت إضافة العنصر", variant: "destructive" });
      }
    };

    if (editingElement) {
      updateElement.mutate({ id: editingElement.id, data }, callbacks);
    } else {
      createElement.mutate({ data: { sessionId: id, ...data } }, callbacks);
    }
  };

  const handleDeleteElement = (elementId: number) => {
    deleteElement.mutate({ id: elementId }, {
      onSuccess: () => {
        toast({ title: "تم", description: "تم حذف العنصر" });
        queryClient.invalidateQueries();
      },
      onError: () => {
        toast({ title: "خطأ", description: "تعذّر حذف العنصر", variant: "destructive" });
      }
    });
  };

  const handleDeleteSession = () => {
    deleteSession.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "تم", description: "تم حذف الجلسة" });
        queryClient.removeQueries({ queryKey: getGetSessionQueryKey(id) });
        queryClient.invalidateQueries();
        setLocation("/sessions");
      },
      onError: () => {
        toast({ title: "خطأ", description: "تعذّر حذف الجلسة", variant: "destructive" });
      }
    });
  };

  const isSavingElement = createElement.isPending || updateElement.isPending;

  if (isLoadingSession) {
    return <div className="space-y-6"><Skeleton className="h-32 w-full" /></div>;
  }

  if (!session) return <div>الجلسة غير موجودة</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/sessions" aria-label="رجوع إلى الجلسات"><ArrowLeft className="w-4 h-4 rtl:rotate-180" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            <bdi>{session.athleteName || 'لاعب غير معروف'}</bdi> – <bdi>{formatDate(session.date)}</bdi>
          </h1>
          <div className="text-muted-foreground flex gap-2 items-center mt-1">
            <span>{label(SESSION_TYPE_LABELS, session.sessionType)}</span>
            {session.venue && (
              <>
                <span>•</span>
                <span>{session.venue}</span>
              </>
            )}
          </div>
        </div>
        <div className="ms-auto flex gap-2">
          <EditSessionDialog session={session} />
          <ConfirmDelete
            trigger={
              <Button variant="outline" size="sm" className="text-destructive">
                <Trash2 className="w-4 h-4 me-2" />
                حذف
              </Button>
            }
            title="حذف هذه الجلسة؟"
            description="سيتم حذف الجلسة نهائيًا مع كل العناصر المسجلة فيها."
            onConfirm={handleDeleteSession}
            isPending={deleteSession.isPending}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">الدرجة الكلية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-primary">
              {session.totalScore ? session.totalScore.toFixed(2) : '--'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">درجة العناصر الفنية (TES)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {session.technicalScore ? session.technicalScore.toFixed(2) : '--'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">درجة مكونات البرنامج (PCS)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {session.componentScore ? session.componentScore.toFixed(2) : '--'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">الخصومات</CardTitle>
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
            <CardTitle>العناصر الفنية</CardTitle>
            <CardDescription>تفاصيل العناصر المنفّذة</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <Button variant="outline" size="sm" onClick={() => openElementDialog(null)}>
              <Plus className="w-4 h-4 me-2" />
              إضافة عنصر
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingElement ? "تعديل عنصر فني" : "إضافة عنصر فني"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">رمز العنصر</Label>
                    <Input id="code" value={elementCode} onChange={(e) => setElementCode(e.target.value)} required placeholder="مثال: 4T، CCoSp4" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">النوع</Label>
                    <Select value={elementType} onValueChange={(v) => setElementType(v as SkatingElementInputElementType)}>
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ELEMENT_TYPE_LABELS).map(([value, text]) => (
                          <SelectItem key={value} value={value}>{text}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bv">القيمة الأساسية</Label>
                    <Input id="bv" type="number" step="0.01" value={baseValue} onChange={(e) => setBaseValue(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goe">درجة التنفيذ GOE (+/-)</Label>
                    <Input id="goe" type="number" step="0.01" value={goe} onChange={(e) => setGoe(e.target.value)} required />
                  </div>
                </div>
                
                <div className="flex gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <Checkbox id="underRotated" checked={isUnderRotated} onCheckedChange={(checked) => setIsUnderRotated(!!checked)} />
                    <Label htmlFor="underRotated" className="font-normal cursor-pointer">ناقصة الدوران (&lt;)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="fall" checked={isFallDown} onCheckedChange={(checked) => setIsFallDown(!!checked)} />
                    <Label htmlFor="fall" className="font-normal cursor-pointer text-destructive">سقوط</Label>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                  <Button type="submit" disabled={isSavingElement}>
                    {isSavingElement ? "جارٍ الحفظ..." : editingElement ? "حفظ التغييرات" : "إضافة العنصر"}
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
            <div className="relative w-full overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-start font-medium pb-2 pe-4">#</th>
                    <th className="text-start font-medium pb-2 pe-4">العنصر</th>
                    <th className="text-start font-medium pb-2 pe-4">النوع</th>
                    <th className="text-end font-medium pb-2 pe-4">القيمة الأساسية</th>
                    <th className="text-end font-medium pb-2 pe-4">GOE</th>
                    <th className="text-end font-medium pb-2 pe-4">الدرجة</th>
                    <th className="pb-2"><span className="sr-only">إجراءات</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {elements?.map((el, idx) => (
                    <tr key={el.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-3 pe-4 text-muted-foreground">{idx + 1}</td>
                      <td className="py-3 pe-4">
                        <span className="font-mono font-bold bg-secondary px-2 py-1 rounded text-foreground">{el.elementCode}</span>
                        {(el.isUnderRotated || el.isFallDown) && (
                           <div className="flex gap-1 mt-1">
                             {el.isUnderRotated && <span className="text-xs text-destructive font-bold">&lt;</span>}
                             {el.isFallDown && <span className="text-xs text-destructive font-bold">سقوط</span>}
                           </div>
                        )}
                      </td>
                      <td className="py-3 pe-4 text-muted-foreground">{label(ELEMENT_TYPE_LABELS, el.elementType)}</td>
                      <td className="py-3 pe-4 text-end font-mono text-foreground">{el.baseValue.toFixed(2)}</td>
                      <td className={`py-3 pe-4 text-end font-mono font-semibold ${el.goe > 0 ? 'text-green-500 dark:text-green-400' : el.goe < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {el.goe > 0 ? '+' : ''}{el.goe.toFixed(2)}
                      </td>
                      <td className="py-3 pe-4 text-end font-mono font-bold text-foreground">
                        {el.executedScore?.toFixed(2) || (el.baseValue + el.goe).toFixed(2)}
                      </td>
                      <td className="py-3 text-end whitespace-nowrap">
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`تعديل ${el.elementCode}`} onClick={() => openElementDialog(el)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <ConfirmDelete
                          trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" aria-label={`حذف ${el.elementCode}`}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          }
                          title={`حذف ${el.elementCode}؟`}
                          description="سيتم حذف هذا العنصر من الجلسة."
                          onConfirm={() => handleDeleteElement(el.id)}
                          isPending={deleteElement.isPending}
                        />
                      </td>
                    </tr>
                  ))}
                  {elements?.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">لا توجد عناصر مسجلة.</td>
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
