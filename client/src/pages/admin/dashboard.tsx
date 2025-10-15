import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import SidebarLayout from "@/components/ui/sidebar-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Clock
} from "lucide-react";

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  
  const { data: quizzes, isLoading: isLoadingQuizzes } = useQuery({
    queryKey: ["/api/quizzes"],
  });
  
  const { data: results, isLoading: isLoadingResults } = useQuery({
    queryKey: ["/api/results"],
  });
  
  const calculateAverageScore = () => {
    if (!results || results.length === 0) return 0;
    
    const totalScore = results.reduce((acc, result) => {
      return acc + (result.score / result.totalQuestions) * 100;
    }, 0);
    
    return Math.round(totalScore / results.length);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <SidebarLayout>
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">Overview of quizzes and results</p>
      </header>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-gray-500 text-sm">Total Quizzes</h3>
                <p className="text-2xl font-semibold mt-1">
                  {isLoadingQuizzes ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    quizzes?.length || 0
                  )}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 text-primary">
                <FilePlus className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-gray-500 text-sm">Quiz Submissions</h3>
                <p className="text-2xl font-semibold mt-1">
                  {isLoadingResults ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    results?.length || 0
                  )}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100 text-green-500">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-gray-500 text-sm">Average Score</h3>
                <p className="text-2xl font-semibold mt-1">
                  {isLoadingResults ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    `${calculateAverageScore()}%`
                  )}
                </p>
              </div>
              <div className="p-3 rounded-full bg-amber-100 text-amber-600">
                <Award className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-gray-500 text-sm">Avg. Completion Time</h3>
                <p className="text-2xl font-semibold mt-1">
                  {isLoadingResults || !results?.length ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    (() => {
                      const avgTime = Math.round(
                        results.reduce((acc, r) => acc + r.timeTaken, 0) / results.length
                      );
                      return `${Math.floor(avgTime / 60)}m ${avgTime % 60}s`;
                    })()
                  )}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Quizzes */}
      <Card className="mb-8 bg-white shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Recent Quizzes</CardTitle>
              <CardDescription>Latest created quiz assessments</CardDescription>
            </div>
            <Button 
              onClick={() => navigate("/admin/manage-quizzes")}
              variant="outline"
              className="text-sm"
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isLoadingQuizzes ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : quizzes && quizzes.length > 0 ? (
            <div className="overflow-x-auto">
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
                  {quizzes.slice(0, 5).map((quiz) => (
                    <TableRow key={quiz.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">{quiz.title}</TableCell>
                      <TableCell>{quiz.questions?.length || 0}</TableCell>
                      <TableCell>{quiz.timeLimit} minutes</TableCell>
                      <TableCell>{formatDate(quiz.createdAt)}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-primary"
                          onClick={() => navigate(`/admin/create-quiz?edit=${quiz.id}`)}
                        >
                          <PenSquare className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No quizzes available yet.</p>
              <Button 
                onClick={() => navigate("/admin/create-quiz")}
                className="mt-4"
              >
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
              <CardDescription>Latest quiz submissions from participants</CardDescription>
            </div>
            <Button 
              onClick={() => navigate("/admin/user-results")}
              variant="outline"
              className="text-sm"
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isLoadingResults ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : results && results.length > 0 ? (
            <div className="overflow-x-auto">
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
                  {results.slice(0, 5).map((result) => {
                    const scorePercentage = Math.round((result.score / result.totalQuestions) * 100);
                    let scoreColor = "text-gray-700";
                    
                    if (scorePercentage >= 80) {
                      scoreColor = "text-green-600";
                    } else if (scorePercentage >= 60) {
                      scoreColor = "text-blue-600";
                    } else {
                      scoreColor = "text-red-600";
                    }
                    
                    return (
                      <TableRow key={result.id} className="hover:bg-slate-50">
                        <TableCell>
                          <div>
                            <div className="font-medium">{result.participant.fullName}</div>
                            <div className="text-xs text-gray-500">
                              {result.participant.rollNumber} • {result.participant.department}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{result.quiz.title}</TableCell>
                        <TableCell className={scoreColor}>
                          <div className="flex items-center gap-2">
                            <div 
                              className={`w-2 h-2 rounded-full ${
                                scorePercentage >= 80 ? 'bg-green-500' : 
                                scorePercentage >= 60 ? 'bg-blue-500' : 
                                'bg-red-500'
                              }`} 
                            />
                            <span>
                              {scorePercentage}% ({result.score}/{result.totalQuestions})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s
                        </TableCell>
                        <TableCell>{formatDate(result.submittedAt)}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-primary"
                            onClick={() => navigate(`/results/${result.id}`)}
                          >
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
            <div className="text-center py-8 text-gray-500">
              <p>No quiz results available yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </SidebarLayout>
  );
}