import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, CheckCircle, XCircle, Clock, Trophy, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StudentTest {
  test_id: number;
  title: string;
  description: string;
  subject: string;
  num_questions: number;
  duration_minutes: number;
  status: string;
  is_active: number;
  created_at?: string;
  date?: string;
  score?: number;
  time_taken?: string;
}

interface StudentReportsSectionProps {
  completedTests: StudentTest[];
  profile: any;
}

export const StudentReportsSection: React.FC<StudentReportsSectionProps> = ({ completedTests, profile }) => {
  const handleExportCSV = () => {
    if (!completedTests || completedTests.length === 0) {
      alert("No data to export");
      return;
    }
    const headers = ["Test Name", "Subject", "Score", "Total Questions", "Date Completed"];
    const csvContent = [
      headers.join(','),
      ...completedTests.map(test => [
        `"${test.title}"`,
        `"${test.subject}"`,
        `${test.score}%`,
        test.num_questions,
        test.date ? new Date(test.date).toLocaleDateString() : "N/A"
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${profile?.name || "Student"}_Report.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPerformanceBadge = (score?: number) => {
    if (score === undefined || score === null) return <Badge variant="secondary">N/A</Badge>;
    if (score >= 80) return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Excellent</Badge>;
    if (score >= 60) return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">Good</Badge>;
    if (score >= 40) return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">Average</Badge>;
    return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">Needs Improvement</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Performance Reports</h2>
          <p className="text-muted-foreground">View your detailed assessment history</p>
        </div>
        <Button onClick={handleExportCSV} className="bg-[#262628] hover:bg-black text-white">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      <Card className="rounded-2xl border-none shadow-sm">
        <CardHeader>
          <CardTitle>Assessment History</CardTitle>
          <CardDescription>A comprehensive record of all completed quizzes</CardDescription>
        </CardHeader>
        <CardContent>
          {completedTests.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-3" />
              <p className="text-muted-foreground">You haven't completed any assessments yet.</p>
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>Assessment Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead className="text-center">Questions</TableHead>
                    <TableHead className="text-right">Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedTests.map((test, index) => (
                    <TableRow key={test.test_id || index} className="hover:bg-gray-50/50">
                      <TableCell className="font-medium">{test.title}</TableCell>
                      <TableCell className="text-muted-foreground">{test.subject}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {test.date ? new Date(test.date).toLocaleDateString() : "N/A"}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-bold">{test.score ?? 0}%</span>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {test.num_questions}
                      </TableCell>
                      <TableCell className="text-right">
                        {getPerformanceBadge(test.score)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
