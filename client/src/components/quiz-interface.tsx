import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Quiz, Question, InsertResult } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Maximize, AlertTriangle, Clock } from "lucide-react";

interface QuizInterfaceProps {
  quiz: Quiz & { questions?: Question[] };
  participantId: number;
}

export default function QuizInterface({
  quiz,
  participantId,
}: QuizInterfaceProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit * 60); // in seconds
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isTimeUpDialogOpen, setIsTimeUpDialogOpen] = useState(false);
  const [timeExpired, setTimeExpired] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [fullScreenWarningShown, setFullScreenWarningShown] = useState(false);
  const [lowTimeWarningShown, setLowTimeWarningShown] = useState(false);
  const [showExitFullScreenWarning, setShowExitFullScreenWarning] =
    useState(false);
  const [showLowTimeWarning, setShowLowTimeWarning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const quizContainerRef = useRef<HTMLDivElement>(null);

  const questions = quiz.questions || [];
  const totalQuestions = questions.length;

  // Enter fullscreen on mount
  useEffect(() => {
    const enterFullScreen = async () => {
      try {
        if (
          quizContainerRef.current &&
          document.documentElement.requestFullscreen
        ) {
          await document.documentElement.requestFullscreen();
          setIsFullScreen(true);
        }
      } catch {
        // Fullscreen not supported or denied
      }
    };

    enterFullScreen();

    // Handle fullscreen change events
    const handleFullScreenChange = () => {
      const isCurrentlyFullScreen = !!document.fullscreenElement;
      setIsFullScreen(isCurrentlyFullScreen);

      if (isCurrentlyFullScreen) {
        // Reset warning flag when user re-enters fullscreen (via any method)
        setFullScreenWarningShown(false);
      } else {
        // Show warning if user exits fullscreen
        if (!submitting && !fullScreenWarningShown) {
          setShowExitFullScreenWarning(true);
          setFullScreenWarningShown(true);
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [submitting, fullScreenWarningShown]);

  // Timer with low time warning
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        // Show warning at 5 minutes (300 seconds)
        if (prev === 300 && !lowTimeWarningShown) {
          setShowLowTimeWarning(true);
          setLowTimeWarningShown(true);
        }

        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setTimeExpired(true);
          setIsTimeUpDialogOpen(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [lowTimeWarningShown]);

  // Prevent page navigation/reload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!submitting) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [submitting]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getTimerProgressPercentage = (): number => {
    const totalSeconds = quiz.timeLimit * 60;
    return (timeLeft / totalSeconds) * 100;
  };

  const getTimerColor = (): string => {
    const percentage = getTimerProgressPercentage();
    if (percentage <= 10) return "bg-red-500";
    if (percentage <= 25) return "bg-yellow-500";
    return "bg-primary";
  };

  const handleAnswerSelect = (questionId: number, answerIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answerIndex,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const calculateScore = (): number => {
    let score = 0;
    questions.forEach((question) => {
      if (answers[question.id] === question.correctAnswer) {
        score++;
      }
    });
    return score;
  };

  const submitResultMutation = useMutation({
    mutationFn: async (data: InsertResult) => {
      const res = await apiRequest("POST", "/api/results", data);
      return res.json();
    },
    onSuccess: (data) => {
      setSubmitting(false);
      setTimeExpired(false); // Reset to prevent re-submission

      // Exit fullscreen before navigating
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      toast({
        title: "Quiz Submitted Successfully",
        description:
          "Your quiz has been submitted. Redirecting to results page.",
      });

      navigate(`/results/${data.id}`);
    },
    onError: () => {
      setSubmitting(false);
      setTimeExpired(false);
      toast({
        title: "Error",
        description: "Failed to submit your quiz. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setSubmitting(true);

    const score = calculateScore();
    const timeTaken = quiz.timeLimit * 60 - timeLeft;

    const formattedAnswers = Object.entries(answers).map(
      ([questionId, answerIndex]) => ({
        questionId: parseInt(questionId),
        selectedAnswer: answerIndex,
      }),
    );

    submitResultMutation.mutate({
      participantId,
      quizId: quiz.id,
      score,
      totalQuestions,
      timeTaken,
      answers: formattedAnswers,
    });
  }, [
    answers,
    timeLeft,
    participantId,
    quiz.id,
    quiz.timeLimit,
    totalQuestions,
    submitResultMutation,
    questions,
  ]);

  // Auto-submit when time expires (independent of dialog state)
  useEffect(() => {
    if (timeExpired && !submitting) {
      // Wait a brief moment to show the dialog, then auto-submit
      const autoSubmitTimer = setTimeout(() => {
        handleSubmit();
      }, 2000); // 2 second delay to show the warning

      return () => clearTimeout(autoSubmitTimer);
    }
  }, [timeExpired, submitting, handleSubmit]);

  const handleTimeUp = () => {
    setIsTimeUpDialogOpen(false);
    handleSubmit();
  };

  const handleReenterFullScreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setShowExitFullScreenWarning(false);
        // Note: fullScreenWarningShown is reset in the fullscreenchange handler
      }
    } catch {
      // Fullscreen re-entry failed
    }
  };

  if (totalQuestions === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 text-center max-w-md w-full">
          <h2 className="text-xl font-semibold text-yellow-500">
            No Questions
          </h2>
          <p className="mt-2 text-gray-600">
            This quiz doesn't have any questions yet.
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600 transition-colors"
            data-testid="button-go-back">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={quizContainerRef}
      className="min-h-screen bg-gray-50 flex flex-col"
      data-testid="quiz-container">
      {/* Fixed Header with Timer */}
      <div className="sticky top-0 z-50 bg-white shadow-md border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div className="flex items-center justify-between sm:justify-start gap-4">
                <h1 className="text-lg sm:text-xl font-bold text-primary line-clamp-1">
                  {quiz.title}
                </h1>
                {!isFullScreen && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReenterFullScreen}
                    className="flex-shrink-0"
                    data-testid="button-fullscreen">
                    <Maximize className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Full Screen</span>
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3">
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-full">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Time:</span>
                  <span
                    className={`font-semibold text-sm sm:text-base ${timeLeft <= 300 ? "text-red-500 animate-pulse" : ""}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>

                <div className="text-sm text-gray-600 bg-slate-50 px-3 py-2 rounded-full whitespace-nowrap">
                  {Object.keys(answers).length}/{totalQuestions} answered
                </div>
              </div>
            </div>

            {/* Timer Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div
                className={`${getTimerColor()} h-2 rounded-full transition-all duration-1000`}
                style={{ width: `${getTimerProgressPercentage()}%` }}
                data-testid="timer-progress"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-4 sm:py-6 lg:py-8">
          <div className="bg-white rounded-lg shadow-lg">
            <Tabs defaultValue="single" className="w-full">
              <div className="border-b border-gray-200 px-4 sm:px-6 py-4">
                <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-grid">
                  <TabsTrigger
                    value="single"
                    className="text-sm"
                    data-testid="tab-single">
                    One by One
                  </TabsTrigger>
                  <TabsTrigger
                    value="all"
                    className="text-sm"
                    data-testid="tab-all">
                    All Questions
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Single Question View */}
              <TabsContent value="single" className="p-4 sm:p-6 lg:p-8 mt-0">
                <div className="space-y-6">
                  {questions[currentQuestionIndex] && (
                    <div className="quiz-question">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm sm:text-md text-gray-500">
                          Question {currentQuestionIndex + 1} of{" "}
                          {totalQuestions}
                        </h3>
                      </div>
                      <p className="text-lg sm:text-xl lg:text-2xl mb-6 font-medium">
                        {questions[currentQuestionIndex].text}
                      </p>

                      <RadioGroup
                        value={
                          answers[
                            questions[currentQuestionIndex].id
                          ]?.toString() || ""
                        }
                        onValueChange={(value) =>
                          handleAnswerSelect(
                            questions[currentQuestionIndex].id,
                            parseInt(value),
                          )
                        }
                        className="space-y-3">
                        {questions[currentQuestionIndex].options.map(
                          (option, index) => (
                            <div
                              key={index}
                              className="quiz-option group border-2 border-gray-200 rounded-lg py-4 px-4 sm:px-6 hover:bg-slate-50 hover:border-primary transition-all cursor-pointer"
                              data-testid={`option-${index}`}>
                              <div className="flex items-start sm:items-center space-x-3">
                                <RadioGroupItem
                                  value={index.toString()}
                                  id={`single-q${questions[currentQuestionIndex].id}-option-${index}`}
                                  checked={
                                    answers[
                                      questions[currentQuestionIndex].id
                                    ] === index
                                  }
                                  className="mt-1 sm:mt-0"
                                />
                                <Label
                                  htmlFor={`single-q${questions[currentQuestionIndex].id}-option-${index}`}
                                  className="flex-grow cursor-pointer font-normal text-base sm:text-lg">
                                  {option}
                                </Label>
                              </div>
                            </div>
                          ),
                        )}
                      </RadioGroup>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row justify-between gap-3 mt-8 pt-6 border-t border-gray-200">
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentQuestionIndex === 0}
                      className="w-full sm:w-auto"
                      data-testid="button-previous">
                      Previous
                    </Button>
                    {currentQuestionIndex < totalQuestions - 1 ? (
                      <Button
                        onClick={handleNext}
                        className="w-full sm:w-auto"
                        data-testid="button-next">
                        Next
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        onClick={() => setIsSubmitDialogOpen(true)}
                        className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                        data-testid="button-submit-quiz">
                        Submit Quiz
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* All Questions View */}
              <TabsContent value="all" className="p-4 sm:p-6 lg:p-8 mt-0">
                <div className="space-y-8">
                  {questions.map((question, index) => (
                    <div
                      key={question.id}
                      className="border-b border-gray-200 pb-8 last:border-b-0 last:pb-0"
                      data-testid={`question-${index}`}>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm sm:text-md text-gray-500">
                          Question {index + 1} of {totalQuestions}
                        </h3>
                      </div>
                      <p className="text-lg sm:text-xl mb-4 font-medium">
                        {question.text}
                      </p>

                      <RadioGroup
                        value={answers[question.id]?.toString() || ""}
                        onValueChange={(value) =>
                          handleAnswerSelect(question.id, parseInt(value))
                        }
                        className="space-y-3">
                        {question.options.map((option, optionIndex) => (
                          <div
                            key={optionIndex}
                            className="quiz-option group border-2 border-gray-200 rounded-lg py-3 px-4 sm:px-6 hover:bg-slate-50 hover:border-primary transition-all cursor-pointer">
                            <div className="flex items-start sm:items-center space-x-3">
                              <RadioGroupItem
                                value={optionIndex.toString()}
                                id={`q${question.id}-option-${optionIndex}`}
                                checked={answers[question.id] === optionIndex}
                                className="mt-1 sm:mt-0"
                              />
                              <Label
                                htmlFor={`q${question.id}-option-${optionIndex}`}
                                className="flex-grow cursor-pointer font-normal text-base">
                                {option}
                              </Label>
                            </div>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  ))}

                  <div className="flex justify-center pt-6 border-t border-gray-200">
                    <Button
                      className="w-full sm:w-auto px-8 py-6 bg-green-600 hover:bg-green-700 font-medium text-lg"
                      onClick={() => setIsSubmitDialogOpen(true)}
                      disabled={submitting}
                      data-testid="button-submit-all">
                      {submitting ? "Submitting..." : "Submit Quiz"}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog
        open={isSubmitDialogOpen}
        onOpenChange={setIsSubmitDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to submit?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {Object.keys(answers).length} out of{" "}
              {totalQuestions} questions.
              {Object.keys(answers).length < totalQuestions && (
                <span className="block mt-2 text-red-500 font-medium">
                  Warning: You have{" "}
                  {totalQuestions - Object.keys(answers).length} unanswered
                  questions!
                </span>
              )}
              <span className="block mt-2">
                Once submitted, you won't be able to change your answers.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-submit">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              data-testid="button-confirm-submit">
              Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Time Up Dialog - Auto Submit */}
      <AlertDialog
        open={isTimeUpDialogOpen}
        onOpenChange={setIsTimeUpDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-6 w-6" />
              <AlertDialogTitle>Time's Up!</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Your time for this quiz has ended. Your answers will be submitted
              automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={handleTimeUp}
              data-testid="button-time-up">
              Submit Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Exit Full Screen Warning */}
      <AlertDialog
        open={showExitFullScreenWarning}
        onOpenChange={setShowExitFullScreenWarning}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-yellow-500">
              <AlertTriangle className="h-6 w-6" />
              <AlertDialogTitle>Warning: Full Screen Exited</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              You have exited full screen mode. It is recommended to stay in
              full screen mode during the quiz.
              <span className="block mt-2 font-medium">
                Would you like to return to full screen?
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setShowExitFullScreenWarning(false)}
              data-testid="button-stay-windowed">
              Continue Windowed
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReenterFullScreen}
              data-testid="button-reenter-fullscreen">
              Return to Full Screen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Low Time Warning */}
      <AlertDialog
        open={showLowTimeWarning}
        onOpenChange={setShowLowTimeWarning}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-orange-500">
              <Clock className="h-6 w-6" />
              <AlertDialogTitle>Time Warning</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              You have only 5 minutes remaining to complete the quiz!
              <span className="block mt-2 font-medium">
                Please manage your time wisely.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setShowLowTimeWarning(false)}
              data-testid="button-continue-quiz">
              Continue Quiz
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
