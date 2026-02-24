import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Home,
  Award,
  CheckCheck,
  X,
  ArrowLeft,
  HelpCircle,
} from "lucide-react";
import { ResultWithDetails } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import {
  QUIZ_DEFAULTS,
  STORAGE_KEYS,
  ROUTES,
  getScoreColor,
} from "@shared/constants";

interface QuizResultsProps {
  result: ResultWithDetails;
}

export default function QuizResults({ result }: QuizResultsProps) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const isAdmin = !!user;

  if (!result) return null;

  const scorePercentage = Math.round(
    (result.score / result.totalQuestions) * 100,
  );

  // Determine if passed (using default passing score if not specified)
  const isPassed =
    scorePercentage >=
    (result.quiz.passingScore || QUIZ_DEFAULTS.DEFAULT_PASSING_SCORE);

  // Map answers to questions
  const answersMap = result.answers.reduce(
    (
      acc: Record<number, number>,
      curr: { questionId: number; selectedAnswer: number },
    ) => {
      acc[curr.questionId] = curr.selectedAnswer;
      return acc;
    },
    {} as Record<number, number>,
  );

  // Get performance-based classes
  const getScoreColorClass = () => {
    return getScoreColor(scorePercentage);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="shadow-sm mb-8">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl md:text-3xl font-bold">
            Quiz Results
          </CardTitle>
          <p className="text-gray-600">{result.quiz.title}</p>
        </CardHeader>

        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col items-center justify-center mb-8 py-8 bg-slate-50 rounded-lg">
            <div className={`text-6xl font-bold mb-2 ${getScoreColorClass()}`}>
              {scorePercentage}%
            </div>
            <div className="text-xl mb-3">
              You scored{" "}
              <span className="font-semibold">
                {result.score} out of {result.totalQuestions}
              </span>
            </div>
            <Badge
              variant={isPassed ? "success" : "destructive"}
              className={`text-sm px-3 py-1 ${
                isPassed
                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                  : "bg-red-100 text-red-800 hover:bg-red-100"
              }`}>
              {isPassed ? (
                <div className="flex items-center">
                  <Award className="h-4 w-4 mr-1" />
                  <span>Passed</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <XCircle className="h-4 w-4 mr-1" />
                  <span>Did not pass</span>
                </div>
              )}
            </Badge>
          </div>

          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <CheckCheck className="mr-2 h-5 w-5 text-slate-500" />
            Question Review
          </h2>

          <div className="space-y-6">
            {result.questions &&
              result.questions.map((question, index) => {
                const selectedAnswer = answersMap[question.id];
                // correctAnswer === -1 means hidden (student view)
                const answersHidden = question.correctAnswer === -1;
                const isCorrect =
                  !answersHidden && selectedAnswer === question.correctAnswer;

                return (
                  <div
                    key={question.id}
                    className="border border-gray-200 rounded-md p-4 shadow-sm bg-white">
                    <div className="flex items-start">
                      <div className="mr-3 mt-1 flex-shrink-0">
                        {answersHidden ? (
                          <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center">
                            <HelpCircle className="h-4 w-4 text-gray-400" />
                          </div>
                        ) : isCorrect ? (
                          <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center">
                            <X className="h-4 w-4 text-red-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium">
                          {index + 1}. {question.text}
                        </h3>

                        <div className="mt-3 space-y-2">
                          {question.options.map((option, optIndex) => {
                            let bgColor = "bg-gray-50 border border-gray-200";
                            let statusElement = null;

                            if (optIndex === selectedAnswer) {
                              if (answersHidden) {
                                // Student view — just highlight their pick
                                bgColor = "bg-blue-50 border border-blue-200";
                                statusElement = (
                                  <div className="flex items-center text-sm font-medium text-blue-600 mt-1">
                                    <CheckCheck className="h-3.5 w-3.5 mr-1" />
                                    Your Answer
                                  </div>
                                );
                              } else if (isCorrect) {
                                bgColor = "bg-green-50 border border-green-200";
                                statusElement = (
                                  <div className="flex items-center text-sm font-medium text-green-600 mt-1">
                                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                    Correct
                                  </div>
                                );
                              } else {
                                bgColor = "bg-red-50 border border-red-200";
                                statusElement = (
                                  <div className="flex items-center text-sm font-medium text-red-600 mt-1">
                                    <XCircle className="h-3.5 w-3.5 mr-1" />
                                    Incorrect
                                  </div>
                                );
                              }
                            }

                            return (
                              <div
                                key={optIndex}
                                className={`p-3 rounded-md ${bgColor}`}>
                                {option}
                                {statusElement}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="mt-8 flex justify-center gap-3">
            {isAdmin ? (
              <Button
                onClick={() => navigate(ROUTES.ADMIN_USER_RESULTS)}
                className="px-6">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to User Results
              </Button>
            ) : (
              <Button
                onClick={() => {
                  const participantId = result.participant.id;
                  if (participantId) {
                    localStorage.setItem(
                      STORAGE_KEYS.PARTICIPANT_ID,
                      participantId.toString(),
                    );
                  }
                  navigate(ROUTES.HOME);
                }}
                className="px-6">
                <Home className="h-4 w-4 mr-2" />
                Return to Quiz List
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
