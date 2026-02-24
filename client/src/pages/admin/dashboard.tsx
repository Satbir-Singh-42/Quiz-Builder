import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import SidebarLayout from "@/components/ui/sidebar-layout";
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
  Loader2,
  PenSquare,
  Users,
  FilePlus,
  Award,
  Clock,
} from "lucide-react";

import { QuizWithQuestions, ResultWithDetails } from "@shared/schema";
import {
  DASHBOARD,
  SCORE_THRESHOLDS,
  ROUTES,
  getScoreColor,
  getScoreDotColor,
} from "@shared/constants";

export default function AdminDashboard() {
  const [, navigate] = useLocation();

  const { data: quizzes, isLoading: isLoadingQuizzes } = useQuery<
    QuizWithQuestions[]
  >({
    queryKey: ["/api/quizzes"],
  });

  const { data: results, isLoading: isLoadingResults } = useQuery<
    ResultWithDetails[]
  >({
    queryKey: ["/api/results"],
  });

  const calculateAverageScore = () => {
    if (!results || results.length === 0) return 0;

    const totalScore = results.reduce((acc, result) => {
      return acc + (result.score / result.totalQuestions) * 100;
    }, 0);

    return Math.round(totalScore / results.length);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString(
      DASHBOARD.DATE_LOCALE,
      DASHBOARD.DATE_FORMAT,
    );
  };

  return (
    <SidebarLayout>
      <header className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
          Dashboard
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Overview of quizzes and results
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <Card className="bg-white shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex justify-between items-start">
              <div className="min-w-0">
                <h3 className="text-gray-500 text-xs sm:text-sm">
                  Total Quizzes
                </h3>
                <p className="text-xl sm:text-2xl font-semibold mt-1">
                  {isLoadingQuizzes ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    quizzes?.length || 0
                  )}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-blue-100 text-primary shrink-0">
                <FilePlus className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex justify-between items-start">
              <div className="min-w-0">
                <h3 className="text-gray-500 text-xs sm:text-sm">
                  Submissions
                </h3>
                <p className="text-xl sm:text-2xl font-semibold mt-1">
                  {isLoadingResults ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    results?.length || 0
                  )}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-green-100 text-green-500 shrink-0">
                <Users className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex justify-between items-start">
              <div className="min-w-0">
                <h3 className="text-gray-500 text-xs sm:text-sm">Avg. Score</h3>
                <p className="text-xl sm:text-2xl font-semibold mt-1">
                  {isLoadingResults ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    `${calculateAverageScore()}%`
                  )}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-amber-100 text-amber-600 shrink-0">
                <Award className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex justify-between items-start">
              <div className="min-w-0">
                <h3 className="text-gray-500 text-xs sm:text-sm">Avg. Time</h3>
                <p className="text-xl sm:text-2xl font-semibold mt-1">
                  {isLoadingResults || !results?.length ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    (() => {
                      const avgTime = Math.round(
                        results.reduce((acc, r) => acc + r.timeTaken, 0) /
                          results.length,
                      );
                      return `${Math.floor(avgTime / 60)}m ${avgTime % 60}s`;
                    })()
                  )}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-purple-100 text-purple-600 shrink-0">
                <Clock className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Quizzes */}
      <Card className="mb-6 sm:mb-8 bg-white shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Recent Quizzes</CardTitle>
              <CardDescription>Latest created quiz assessments</CardDescription>
            </div>
            <Button
              onClick={() => navigate(ROUTES.ADMIN_MANAGE_QUIZZES)}
              variant="outline"
              className="text-sm">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {isLoadingQuizzes ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : quizzes && quizzes.length > 0 ? (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Quiz Name</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Time Limit</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quizzes
                      .slice(0, DASHBOARD.RECENT_ITEMS_COUNT)
                      .map((quiz) => (
                        <TableRow key={quiz.id} className="hover:bg-slate-50">
                          <TableCell className="font-medium">
                            {quiz.title}
                          </TableCell>
                          <TableCell>{quiz.questions?.length || 0}</TableCell>
                          <TableCell>{quiz.timeLimit} min</TableCell>
                          <TableCell>{formatDate(quiz.createdAt)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-primary"
                              onClick={() =>
                                navigate(
                                  `${ROUTES.ADMIN_CREATE_QUIZ}?edit=${quiz.id}`,
                                )
                              }>
                              <PenSquare className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
              {/* Mobile cards */}
              <div className="sm:hidden space-y-3">
                {quizzes.slice(0, DASHBOARD.RECENT_ITEMS_COUNT).map((quiz) => (
                  <div
                    key={quiz.id}
                    className="border rounded-lg p-3 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {quiz.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span>{quiz.questions?.length || 0} Q</span>
                          <span>{quiz.timeLimit} min</span>
                          <span>{formatDate(quiz.createdAt)}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary shrink-0 h-8 px-2"
                        onClick={() =>
                          navigate(
                            `${ROUTES.ADMIN_CREATE_QUIZ}?edit=${quiz.id}`,
                          )
                        }>
                        <PenSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No quizzes available yet.</p>
              <Button
                onClick={() => navigate(ROUTES.ADMIN_CREATE_QUIZ)}
                className="mt-4">
                Create Your First Quiz
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Results */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Recent Results</CardTitle>
              <CardDescription>
                Latest quiz submissions from participants
              </CardDescription>
            </div>
            <Button
              onClick={() => navigate(ROUTES.ADMIN_USER_RESULTS)}
              variant="outline"
              className="text-sm">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {isLoadingResults ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : results && results.length > 0 ? (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Student</TableHead>
                      <TableHead>Quiz</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Time Taken</TableHead>
                      <TableHead>Submission Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results
                      .slice(0, DASHBOARD.RECENT_ITEMS_COUNT)
                      .map((result) => {
                        const scorePercentage = Math.round(
                          (result.score / result.totalQuestions) * 100,
                        );
                        let scoreColor = "text-gray-700";

                        if (scorePercentage >= SCORE_THRESHOLDS.HIGH) {
                          scoreColor = "text-green-600";
                        } else if (scorePercentage >= SCORE_THRESHOLDS.MEDIUM) {
                          scoreColor = "text-blue-600";
                        } else {
                          scoreColor = "text-red-600";
                        }

                        return (
                          <TableRow
                            key={result.id}
                            className="hover:bg-slate-50">
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {result.participant.fullName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {result.participant.rollNumber} •{" "}
                                  {result.participant.department}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{result.quiz.title}</TableCell>
                            <TableCell className={scoreColor}>
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-2 h-2 rounded-full ${getScoreDotColor(scorePercentage)}`}
                                />
                                <span>
                                  {scorePercentage}% ({result.score}/
                                  {result.totalQuestions})
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {Math.floor(result.timeTaken / 60)}m{" "}
                              {result.timeTaken % 60}s
                            </TableCell>
                            <TableCell>
                              {formatDate(result.submittedAt)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary"
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
              {/* Mobile cards */}
              <div className="sm:hidden space-y-3">
                {results
                  .slice(0, DASHBOARD.RECENT_ITEMS_COUNT)
                  .map((result) => {
                    const scorePercentage = Math.round(
                      (result.score / result.totalQuestions) * 100,
                    );
                    return (
                      <div
                        key={result.id}
                        className="border rounded-lg p-3 hover:bg-slate-50 transition-colors"
                        onClick={() => navigate(`/results/${result.id}`)}>
                        <div className="flex justify-between items-start">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {result.participant.fullName}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              {result.quiz.title}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <div
                              className={`w-2 h-2 rounded-full ${getScoreDotColor(scorePercentage)}`}
                            />
                            <span
                              className={`text-sm font-medium ${getScoreColor(scorePercentage)}`}>
                              {scorePercentage}%
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span>{result.participant.rollNumber}</span>
                          <span>
                            {Math.floor(result.timeTaken / 60)}m{" "}
                            {result.timeTaken % 60}s
                          </span>
                          <span>{formatDate(result.submittedAt)}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No quiz results available yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </SidebarLayout>
  );
}
