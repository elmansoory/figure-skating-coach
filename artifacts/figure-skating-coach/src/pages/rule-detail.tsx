import { useParams, Link } from "wouter";
import { useGetRule, getGetRuleQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, BookOpen } from "lucide-react";

export default function RuleDetail() {
  const params = useParams();
  const id = Number(params.id);

  const { data: rule, isLoading } = useGetRule(id, { query: { enabled: !!id, queryKey: getGetRuleQueryKey(id) } });

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-32 w-full" /></div>;
  }

  if (!rule) return <div>Rule not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/rules"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div>
          <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            {rule.category}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{rule.title}</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Description
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground leading-relaxed whitespace-pre-wrap">{rule.description}</p>
        </CardContent>
      </Card>

      {rule.details && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detailed Criteria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none text-muted-foreground">
              <p className="whitespace-pre-wrap">{rule.details}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {rule.isuReference && (
        <Card>
          <CardContent className="p-4 flex items-center justify-between bg-secondary/50">
            <div>
              <p className="font-medium text-sm">ISU Reference</p>
              <p className="text-xs text-muted-foreground font-mono mt-1">{rule.isuReference}</p>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="w-4 h-4" />
              View Document
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
