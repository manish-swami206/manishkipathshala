"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PageTransition } from "@/components/shared/PageTransition";
import { useQuery } from "@tanstack/react-query";
import { quizzesApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import {
  Clock,
  Play,
  FileText,
  CheckCircle2,
  ClipboardList,
  Heading,
} from "lucide-react";
import type { QuizListItem } from "@/lib/types/api";
import PageHeading from "@/components/shared/PageHeading";

export default function QuizListing() {
  const [activeTab, setActiveTab] = useState<"ongoing" | "history">("ongoing");

  const { data: quizzes, isLoading } = useQuery({
    queryKey: queryKeys.quizzes.list({ status: activeTab }),
    queryFn: () => quizzesApi.list({ status: activeTab }),
    staleTime: 0,
  });

  return (
    <PageTransition className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="space-y-2">
        <PageHeading heading="Daily Free Quizzes" />
        <p className="text-muted-foreground">
          Test your knowledge with our daily curated quizzes.
        </p>
      </div>
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "ongoing" | "history")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="ongoing" className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              Array(6)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-2xl" />
                ))
            ) : !quizzes || quizzes.length === 0 ? (
              <div className="col-span-full">
                <Empty>
                  <ClipboardList className="w-10 h-10 text-gray-300" />
                  <EmptyTitle>No ongoing quizzes</EmptyTitle>
                  <EmptyDescription>
                    There are no ongoing quizzes right now. Check back tomorrow
                    for new quizzes!
                  </EmptyDescription>
                </Empty>
              </div>
            ) : (
              quizzes?.map((quiz: QuizListItem) => (
                <QuizCard key={quiz.id} quiz={quiz} type="ongoing" />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              Array(6)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-2xl" />
                ))
            ) : !quizzes || quizzes.length === 0 ? (
              <div className="col-span-full">
                <Empty>
                  <ClipboardList className="w-10 h-10 text-gray-300" />
                  <EmptyTitle>No quiz history</EmptyTitle>
                  <EmptyDescription>
                    You haven't attempted any quizzes yet. Start one now!
                  </EmptyDescription>
                </Empty>
              </div>
            ) : (
              quizzes?.map((quiz: QuizListItem) => (
                <QuizCard key={quiz.id} quiz={quiz} type="history" />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>{" "}
    </PageTransition>
  );
}

function QuizCard({
  quiz,
  type,
}: {
  quiz: QuizListItem;
  type: "ongoing" | "history";
}) {
  return (
    <Card className="card-hover border-border/50 rounded-2xl bg-card overflow-hidden flex flex-col">
      <CardContent className="p-5 flex flex-col flex-1 space-y-4">
        <div className="flex justify-between items-start gap-2">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-md inline-block mb-1">
              {quiz.subject}
            </span>
            <h3 className="font-bold text-foreground line-clamp-2 leading-tight">
              {quiz.title}
            </h3>
          </div>
          {type === "history" && (
            <div className="shrink-0 p-1.5 bg-emerald-500/10 rounded-full text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground mt-auto pt-4 border-t border-border/50">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> {quiz.durationMins} mins
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" /> {quiz.questionCount} Qs
          </div>
          <div className="col-span-2 text-xs">
            Negative Marking: -{quiz.negativeMarking}
          </div>
        </div>

        {type === "ongoing" && (
          <Link href={`/daily-quiz/${quiz.id}`}>
            <Button className="w-full mt-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
              <Play className="w-4 h-4 mr-2" /> Start Quiz
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
