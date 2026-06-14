"use client";

import React from "react";
import Link from "next/link";
import { PageTransition } from "@/components/shared/PageTransition";
import { useListMockTests } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Clock, FileText, Award, Play, ClipboardCheck } from "lucide-react";

export default function MockTests() {
  const { data: testsRes, isLoading } = useListMockTests({
    query: { staleTime: 0 },
  });
  const tests = testsRes?.data ?? [];

  return (
    <PageTransition className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Full Length Mock Tests</h1>
        <p className="text-muted-foreground">Simulate the real exam experience with our full-length mock tests.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-3xl" />)
        ) : tests.length === 0 ? (
          <div className="col-span-full">
            <Empty>
              <ClipboardCheck className="w-10 h-10 text-gray-300" />
              <EmptyTitle>No mock tests available</EmptyTitle>
              <EmptyDescription>There are no mock tests available at the moment. Check back later for new tests.</EmptyDescription>
            </Empty>
          </div>
        ) : (
          tests.map((test) => (
            <Card key={test.id} className="card-hover border-border/50 rounded-3xl bg-card overflow-hidden relative border-t-4 border-t-primary">
              {test.isFeatured && (
                <div className="absolute top-4 right-4 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shadow-sm shadow-amber-500/20">
                  Featured
                </div>
              )}
              <CardContent className="p-6 flex flex-col h-full gap-4">
                <div className="space-y-2">
                  <h3 className="font-bold text-xl leading-tight pr-12">{test.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{test.description}</p>
                </div>
                
                <div className="flex flex-wrap justify-between items-center gap-y-3 gap-x-2 text-sm mt-4 bg-muted/30 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 font-medium">
                    <Clock className="w-4 h-4 text-muted-foreground" /> {test.durationMins}m
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <FileText className="w-4 h-4 text-muted-foreground" /> {test.questionCount ?? test.questionIds?.length ?? 0} Qs
                  </div>
                  <div className="flex items-center gap-2 font-medium col-span-2">
                    <Award className="w-4 h-4 text-muted-foreground" /> Max Marks: {test.maxMarks}
                  </div>
                </div>

                <Link href={`/mock-tests/${test.id}`} className="mt-auto pt-4">
                  <Button className="w-full rounded-xl h-12 bg-foreground text-background hover:bg-foreground/90 shadow-xl shadow-foreground/10 text-base font-semibold">
                    Launch Session
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </PageTransition>
  );
}
