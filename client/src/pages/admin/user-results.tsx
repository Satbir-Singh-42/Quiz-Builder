import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import SidebarLayout from "@/components/ui/sidebar-layout";
import { ResultWithDetails, QuizWithQuestions } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  Download,
  ArrowUpDown,
  Search,
  Filter,
  BarChart2,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AdminUserResults() {
  const [, navigate] = useLocation();
  const [sortBy, setSortBy] = useState<string>("date");
  const [quizFilter, setQuizFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all results
  const { data: results, isLoading: isLoadingResults } = useQuery<
    ResultWithDetails[]
  >({
    queryKey: ["/api/results", sortBy, quizFilter],
    queryFn: async ({ queryKey }) => {
      const [_, sort, quiz] = queryKey;
      let url = `/api/results?sortBy=${sort}`;
      if (quiz !== "all") {
        url += `&quizId=${quiz}`;
      }
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch results");
      return res.json();
    },
  });

  // Fetch all quizzes for filter dropdown
  const { data: quizzes, isLoading: isLoadingQuizzes } = useQuery<
    QuizWithQuestions[]
  >({
    queryKey: ["/api/quizzes"],
  });

  // Format date
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format time taken (seconds to minutes and seconds)
  const formatTimeTaken = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Handle export to CSV
  const exportToCSV = () => {
    if (!results || results.length === 0) return;

    const escapeCsv = (value: string) => {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const headers = [
      "Student Name",
      "Roll Number",
      "Class",
      "Department",
      "Quiz",
      "Score",
      "Percentage",
      "Time Taken",
      "Submission Date",
    ];

    // Map results to CSV rows
    const csvRows = results.map((result) => {
      const percentage = Math.round(
        (result.score / result.totalQuestions) * 100,
      );
      return [
        escapeCsv(result.participant.fullName),
        escapeCsv(result.participant.rollNumber),
        escapeCsv(result.participant.class),
        escapeCsv(result.participant.department),
        escapeCsv(result.quiz.title),
        `${result.score}/${result.totalQuestions}`,
        `${percentage}%`,
        formatTimeTaken(result.timeTaken),
        formatDate(result.submittedAt),
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...csvRows.map((row) => row.join(",")),
    ].join("\n");

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `quiz-results-${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Mutation to toggle retake permission
  const toggleRetakeMutation = useMutation({
    mutationFn: async ({
      resultId,
      canRetake,
    }: {
      resultId: number;
      canRetake: boolean;
    }) => {
      const response = await fetch(`/api/results/${resultId}/retake`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ canRetake }),
      });

      if (!response.ok) {
        throw new Error("Failed to update retake status");
      }

      return await response.json();
    },
    onSuccess: () => {
      // Invalidate the results query to refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/results"] });
      toast({
        title: "Retake status updated",
        description: "The student can now retake this quiz",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating retake status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle retake toggle change
  const handleRetakeToggle = (resultId: number, currentValue: boolean) => {
    toggleRetakeMutation.mutate({
      resultId,
      canRetake: !currentValue,
    });
  };

  // Filter results by search term
  const filteredResults = results?.filter((result) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      result.participant.fullName.toLowerCase().includes(searchLower) ||
      result.participant.rollNumber.toLowerCase().includes(searchLower) ||
      result.quiz.title.toLowerCase().includes(searchLower) ||
      result.participant.department.toLowerCase().includes(searchLower)
    );
  });

  return (
    <SidebarLayout>
      <header className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Results</h1>
          <p className="text-gray-600">
            View and analyze quiz submissions from all users
          </p>
        </div>
        <Button
          onClick={exportToCSV}
          disabled={!results || results.length === 0}
          className="flex items-center gap-2"
          variant="outline">
          <Download className="h-4 w-4" />
          Export Results
        </Button>
      </header>

      <Tabs defaultValue="results" className="mb-8">
        <TabsList className="mb-6">
          <TabsTrigger value="results">Results Table</TabsTrigger>
          <TabsTrigger value="analytics">Analytics Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="results">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Results Overview</CardTitle>
              <CardDescription>
                {filteredResults?.length || 0} result
                {(filteredResults?.length || 0) !== 1 ? "s" : ""} found
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6">
              {/* Filters Section */}
              <div className="bg-slate-50 rounded-md p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="h-4 w-4 text-slate-500" />
                  <h3 className="font-medium">Filters & Search</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Quiz Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Filter by Quiz
                    </label>
                    <Select value={quizFilter} onValueChange={setQuizFilter}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="All Quizzes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Quizzes</SelectItem>
                        {quizzes?.map((quiz) => (
                          <SelectItem key={quiz.id} value={quiz.id.toString()}>
                            {quiz.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort options */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sort by
                    </label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Submission Date</SelectItem>
                        <SelectItem value="score">
                          Score (High to Low)
                        </SelectItem>
                        <SelectItem value="time">Time Taken</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Search
                    </label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by name, roll number, quiz..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Results Table */}
              {isLoadingResults || isLoadingQuizzes ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredResults && filteredResults.length > 0 ? (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead>Student</TableHead>
                        <TableHead>Quiz</TableHead>
                        <TableHead>
                          <div className="flex items-center">
                            Score
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-1 p-0 h-auto"
                              onClick={() =>
                                setSortBy(sortBy === "score" ? "date" : "score")
                              }>
                              <ArrowUpDown
                                className={`h-4 w-4 ${sortBy === "score" ? "text-primary" : "text-gray-400"}`}
                              />
                            </Button>
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center">
                            Time Taken
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-1 p-0 h-auto"
                              onClick={() =>
                                setSortBy(sortBy === "time" ? "date" : "time")
                              }>
                              <ArrowUpDown
                                className={`h-4 w-4 ${sortBy === "time" ? "text-primary" : "text-gray-400"}`}
                              />
                            </Button>
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center">
                            Submission Date
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-1 p-0 h-auto"
                              onClick={() =>
                                setSortBy(sortBy === "date" ? "score" : "date")
                              }>
                              <ArrowUpDown
                                className={`h-4 w-4 ${sortBy === "date" ? "text-primary" : "text-gray-400"}`}
                              />
                            </Button>
                          </div>
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>
                          <div className="flex items-center gap-1">
                            Allow Retake
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="cursor-help text-gray-400">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="lucide lucide-help-circle">
                                      <circle cx="12" cy="12" r="10" />
                                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                      <path d="M12 17h.01" />
                                    </svg>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="w-60 text-xs">
                                    Enable to allow students to retake this
                                    quiz. They will see a "Retake Quiz" button
                                    on their quiz list.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredResults.map((result) => {
                        const scorePercentage = Math.round(
                          (result.score / result.totalQuestions) * 100,
                        );
                        const passingScore = result.quiz.passingScore || 60;
                        const isPassed = scorePercentage >= passingScore;

                        return (
                          <TableRow
                            key={result.id}
                            className="hover:bg-slate-50">
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {result.participant.fullName}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  <span className="inline-block bg-gray-100 rounded-full px-2 py-0.5 text-xs">
                                    {result.participant.rollNumber}
                                  </span>
                                  <span className="mx-1">•</span>
                                  {result.participant.class}
                                  <span className="mx-1">•</span>
                                  {result.participant.department}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {result.quiz.title}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    scorePercentage >= 80
                                      ? "bg-green-500"
                                      : scorePercentage >= 60
                                        ? "bg-blue-500"
                                        : "bg-red-500"
                                  }`}
                                />
                                <span
                                  className={
                                    scorePercentage >= 80
                                      ? "text-green-600 font-medium"
                                      : scorePercentage >= 60
                                        ? "text-blue-600 font-medium"
                                        : "text-red-600 font-medium"
                                  }>
                                  {scorePercentage}%
                                </span>
                                <span className="text-gray-500">
                                  ({result.score}/{result.totalQuestions})
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatTimeTaken(result.timeTaken)}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span>
                                  {formatDate(result.submittedAt).split(",")[0]}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatDate(result.submittedAt).split(",")[1]}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={isPassed ? "success" : "destructive"}
                                className={
                                  isPassed
                                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                                    : "bg-red-100 text-red-800 hover:bg-red-100"
                                }>
                                {isPassed ? "Passed" : "Failed"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Switch
                                  id={`retake-${result.id}`}
                                  checked={result.canRetake || false}
                                  onCheckedChange={() =>
                                    handleRetakeToggle(
                                      result.id,
                                      result.canRetake || false,
                                    )
                                  }
                                  disabled={toggleRetakeMutation.isPending}
                                />
                                {result.canRetake && (
                                  <Badge
                                    variant="outline"
                                    className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">
                                    <RefreshCw className="h-3 w-3 mr-1" />{" "}
                                    Retake Allowed
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary hover:text-primary/80"
                                onClick={() =>
                                  navigate(`/results/${result.id}`)
                                }>
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 border rounded-md">
                  <div className="flex justify-center mb-4">
                    <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <Search className="h-6 w-6 text-gray-400" />
                    </div>
                  </div>
                  {searchTerm ? (
                    <>
                      <p className="text-gray-600 font-medium">
                        No results found
                      </p>
                      <p className="text-gray-500 mt-1">
                        Try adjusting your search or filter criteria
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-600 font-medium">
                        No quiz results available yet
                      </p>
                      <p className="text-gray-500 mt-1">
                        Results will appear here once quizzes are completed
                      </p>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          {filteredResults && filteredResults.length > 0 ? (
            <div className="space-y-6">
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-500">
                          Total Attempts
                        </p>
                        <p className="text-3xl font-bold">
                          {filteredResults.length}
                        </p>
                      </div>
                      <div className="p-3 rounded-full bg-blue-100 text-primary">
                        <BarChart2 className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-500">
                          Average Score
                        </p>
                        <div className="flex items-baseline gap-1">
                          <p className="text-3xl font-bold">
                            {Math.round(
                              filteredResults.reduce(
                                (acc, result) =>
                                  acc +
                                  (result.score / result.totalQuestions) * 100,
                                0,
                              ) / filteredResults.length,
                            )}
                            %
                          </p>
                        </div>
                      </div>
                      <div className="p-3 rounded-full bg-green-100 text-green-600">
                        <BarChart2 className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-500">
                          Average Time
                        </p>
                        <p className="text-3xl font-bold">
                          {formatTimeTaken(
                            Math.round(
                              filteredResults.reduce(
                                (acc, result) => acc + result.timeTaken,
                                0,
                              ) / filteredResults.length,
                            ),
                          )}
                        </p>
                      </div>
                      <div className="p-3 rounded-full bg-amber-100 text-amber-600">
                        <BarChart2 className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-500">
                          Pass Rate
                        </p>
                        <p className="text-3xl font-bold">
                          {Math.round(
                            (filteredResults.filter(
                              (result) =>
                                (result.score / result.totalQuestions) * 100 >=
                                (result.quiz.passingScore || 60),
                            ).length /
                              filteredResults.length) *
                              100,
                          )}
                          %
                        </p>
                      </div>
                      <div className="p-3 rounded-full bg-green-100 text-green-600">
                        <BarChart2 className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Score Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Score Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of participant scores across all quizzes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex items-center justify-center">
                    <div className="grid grid-cols-4 h-full w-full max-w-3xl gap-2 items-end">
                      {/* Score Ranges */}
                      {[
                        {
                          range: "0-25%",
                          count: filteredResults.filter(
                            (r) => (r.score / r.totalQuestions) * 100 <= 25,
                          ).length,
                          color: "bg-red-500",
                        },
                        {
                          range: "26-50%",
                          count: filteredResults.filter(
                            (r) =>
                              (r.score / r.totalQuestions) * 100 > 25 &&
                              (r.score / r.totalQuestions) * 100 <= 50,
                          ).length,
                          color: "bg-orange-500",
                        },
                        {
                          range: "51-75%",
                          count: filteredResults.filter(
                            (r) =>
                              (r.score / r.totalQuestions) * 100 > 50 &&
                              (r.score / r.totalQuestions) * 100 <= 75,
                          ).length,
                          color: "bg-blue-500",
                        },
                        {
                          range: "76-100%",
                          count: filteredResults.filter(
                            (r) => (r.score / r.totalQuestions) * 100 > 75,
                          ).length,
                          color: "bg-green-500",
                        },
                      ].map((band) => {
                        const percent = filteredResults.length
                          ? (band.count / filteredResults.length) * 100
                          : 0;
                        return (
                          <div
                            key={band.range}
                            className="flex flex-col items-center">
                            <div
                              className={`w-full ${band.color} rounded-t-md`}
                              style={{
                                height: `${Math.max(5, percent)}%`,
                              }}></div>
                            <p className="text-sm font-medium mt-2">
                              {band.range}
                            </p>
                            <p className="text-xs text-gray-500">
                              {band.count} students
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12">
                <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <BarChart2 className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-700">
                  No data available for analytics
                </p>
                <p className="text-gray-500 mt-1 text-center max-w-md">
                  Analytics will be displayed once quiz results are available
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </SidebarLayout>
  );
}
