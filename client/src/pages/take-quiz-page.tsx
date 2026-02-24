import { useEffect, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import QuizInterface from "@/components/quiz-interface";
import { Quiz, Question } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { STORAGE_KEYS, TIMER, ROUTES } from "@shared/constants";

export default function TakeQuizPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();

  // Admin must not take quizzes — redirect to admin dashboard
  useEffect(() => {
    if (user?.isAdmin) {
      navigate(ROUTES.ADMIN);
    }
  }, [user, navigate]);

  // Read participantId synchronously — no useEffect delay
  const participantId = useMemo(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.PARTICIPANT_ID);
    return stored ? parseInt(stored) : null;
  }, []);

  // Redirect immediately if no participant
  useEffect(() => {
    if (!participantId) navigate(ROUTES.HOME);
  }, [participantId, navigate]);

  // Fetch quiz data and check previous attempt in parallel
  const { data: quiz, isLoading: quizLoading } = useQuery<
    Quiz & { questions?: Question[] }
  >({
    queryKey: [`/api/quizzes/${id}`],
    enabled: !!id && !!participantId,
  });

  const { data: attemptCheck, isLoading: checkLoading } = useQuery<{
    hasTakenQuiz: boolean;
    canRetake: boolean;
  }>({
    queryKey: [`/api/results/check`, participantId, id],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/results/check?participantId=${participantId}&quizId=${id}`,
      );
      return res.json();
    },
    enabled: !!id && !!participantId,
  });

  // Redirect if already taken and can't retake
  useEffect(() => {
    if (attemptCheck?.hasTakenQuiz && !attemptCheck?.canRetake) {
      toast({
        title: "Quiz already completed",
        description:
          "You have already taken this quiz. Redirecting to quiz list.",
        variant: "default",
      });
      setTimeout(() => navigate(ROUTES.HOME), TIMER.REDIRECT_DELAY_MS);
    }
  }, [attemptCheck, navigate]);

  if (quizLoading || checkLoading || !participantId) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!quiz || !quiz.id) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-xl font-semibold text-red-500">Quiz Not Found</h2>
          <p className="mt-2 text-gray-600">
            The quiz you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate(ROUTES.HOME)}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600 transition-colors">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <QuizInterface quiz={quiz} participantId={participantId} />;
}
