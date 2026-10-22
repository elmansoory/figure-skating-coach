import { useState } from "react";
import { useListRules } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { BookOpen, AlertCircle, Award } from "lucide-react";
import { ListRulesCategory } from "@workspace/api-client-react";
import { RULE_CATEGORY_LABELS, label } from "@/lib/labels";

export default function Rules() {
  const [category, setCategory] = useState<ListRulesCategory | undefined>();
  const { data: rules, isLoading } = useListRules(category ? { category } : undefined);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">مرجع قواعد ISU</h1>
        <select 
          aria-label="التصنيف"
          className="h-10 px-3 py-2 bg-background border border-input rounded-md text-sm ring-offset-background"
          value={category || ""}
          onChange={(e) => setCategory(e.target.value as ListRulesCategory || undefined)}
        >
          <option value="">كل التصنيفات</option>
          {Object.entries(ListRulesCategory).map(([k, v]) => (
            <option key={k} value={v}>{label(RULE_CATEGORY_LABELS, v)}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : (
        <div className="grid gap-4">
          {rules?.map(rule => (
            <Link key={rule.id} href={`/rules/${rule.id}`} className="block">
              <Card className="hover:border-primary transition-colors cursor-pointer">
                <CardContent className="p-4 sm:p-6 flex items-start gap-4">
                  <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center text-primary flex-shrink-0 mt-1">
                    {rule.category === 'penalties' ? <AlertCircle className="w-5 h-5 text-destructive" /> : 
                     rule.category === 'goe' || rule.category === 'pcs' ? <Award className="w-5 h-5 text-primary" /> :
                     <BookOpen className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {label(RULE_CATEGORY_LABELS, rule.category)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg leading-tight mb-2">{rule.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{rule.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {rules?.length === 0 && (
            <div className="py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <h3 className="font-medium text-foreground">لا توجد قواعد</h3>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
