"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageTransition } from "@/components/shared/PageTransition";
import { useGetMockTest, getGetMockTestQueryKey } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRequireAuth } from "@/components/shared/RequireAuthModal";
import { ArrowLeft, Clock, FileText, Award, AlertCircle, Play } from "lucide-react";

export default function MockTestDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? "";
  const { requireAuth } = useRequireAuth();
  const { data: test, isLoading, isError } = useGetMockTest(id, { query: { enabled: !!id, queryKey: getGetMockTestQueryKey(id), staleTime: 0 } });

  if (isLoading) {
    return <div className="p-8"><Skeleton className="h-[400px] max-w-3xl mx-auto rounded-3xl" /></div>;
  }

  if (isError || !test) {
    return <div className="p-8 text-center text-muted-foreground">Mock test not found.</div>;
  }

  return (
    <PageTransition className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <Link href="/mock-tests">
        <Button variant="ghost" className="-ml-4 text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </Link>

      <Card className="border-border/50 rounded-3xl shadow-sm bg-card overflow-hidden">
        <CardContent className="p-6 md:p-8 space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">{test.title}</h1>
            {test.description && <p className="text-muted-foreground mt-2">{test.description}</p>}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Clock, label: "Duration", value: `${test.durationMins} min` },
              { icon: FileText, label: "Questions", value: test.questionCount },
              { icon: Award, label: "Max Marks", value: test.maxMarks },
              { icon: AlertCircle, label: "Negative", value: `-${test.negativeMarking}` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-muted/50 p-4 rounded-xl border border-border/50 text-center">
                <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="font-bold text-sm">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}                  </div>
                  <Button
                    size="lg"
                    className="w-full rounded-xl bg-primary text-primary-foreground h-14 text-lg gap-2"
                    onClick={async () => {
                      await requireAuth(() => {
                        router.push(`/mock-tests/${test.id}/play`);
                      });
                    }}
                  >
                    <Play className="w-5 h-5" /> Start Mock Test
                  </Button>
        </CardContent>
      </Card>
    </PageTransition>
  );
}
