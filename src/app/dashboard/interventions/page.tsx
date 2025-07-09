"use client";

import React, { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { suggestRoadInterventions, SuggestRoadInterventionsOutput } from "@/ai/flows/suggest-road-interventions";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function InterventionsPage() {
  const [accidentData, setAccidentData] = useState("");
  const [analysisData, setAnalysisData] = useState("");
  const [result, setResult] = useState<SuggestRoadInterventionsOutput | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult(null);

    if (!accidentData.trim() || !analysisData.trim()) {
      toast({
        variant: "destructive",
        title: "Input Required",
        description: "Please provide both accident and analysis data.",
      });
      return;
    }

    startTransition(async () => {
      try {
        const res = await suggestRoadInterventions({
          accidentData: accidentData,
          criticalZoneAnalysis: analysisData,
        });
        setResult(res);
      } catch (error) {
        console.error("Suggestion failed:", error);
        toast({
          variant: "destructive",
          title: "Suggestion Failed",
          description: "An error occurred while generating suggestions. Please try again.",
        });
      }
    });
  };

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Road Intervention Suggestions</h1>
      <p className="text-muted-foreground mt-1">
        Get AI-driven recommendations for road interventions.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Suggestion Input</CardTitle>
            <CardDescription>Provide data to generate intervention suggestions.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accident-data">Historical Accident Data</Label>
                <Textarea
                  id="accident-data"
                  placeholder="Paste historical data here..."
                  value={accidentData}
                  onChange={(e) => setAccidentData(e.target.value)}
                  className="h-32"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="analysis-data">Critical Zone Analysis</Label>
                <Textarea
                  id="analysis-data"
                  placeholder="Paste critical zone analysis results here..."
                  value={analysisData}
                  onChange={(e) => setAnalysisData(e.target.value)}
                  className="h-32"
                  disabled={isPending}
                />
              </div>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Get Suggestions
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommended Interventions</CardTitle>
            <CardDescription>AI-generated suggestions will be listed below.</CardDescription>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : result && result.recommendations.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Intervention</TableHead>
                    <TableHead>Justification</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.recommendations.map((rec, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{rec.intervention}</TableCell>
                      <TableCell>{rec.justification}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center text-muted-foreground py-10">
                <p>Suggestions will be displayed here after submission.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
