import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import QuizInterface from "@/components/quiz-interface";
import { Quiz, Question } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function TakeQuizPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [participantId, setParticipantId] = useState<number | null>(null);
  const [isCheckingPreviousAttempt, setIsCheckingPreviousAttempt] =
    useState(true);

  useEffect(() => {
    const storedParticipantId = localStorage.getItem("participantId");
    if (!storedParticipantId) {
      navigate("/");
      return;
    }
    setParticipantId(parseInt(storedParticipantId));
  }, [navigate]);

  // Check if the participant has already taken this quiz
  useEffect(() => {
    const checkPreviousAttempt = async () => {
      if (!participantId || !id) return;

      try {
        const response = await apiRequest(
          "GET",
          `/api/results/check?participantId=${participantId}&quizId=${id}`,
        );
        if (!response.ok) throw new Error("Failed to check previous attempts");

        const data = await response.json();

        if (data.hasTakenQuiz && !data.canRetake) {
          toast({
            title: "Quiz already completed",
            description:
              "You have already taken this quiz. Redirecting to quiz list.",
            variant: "default",
          });

          setTimeout(() => {
            navigate("/");
          }, 2000);
        }

        setIsCheckingPreviousAttempt(false);
      } catch (error) {
        console.error("Error checking previous attempts:", error);
        setIsCheckingPreviousAttempt(false);
      }
    };

    checkPreviousAttempt();
  }, [participantId, id, navigate]);

  const { data: quiz, isLoading } = useQuery<Quiz & { questions?: Question[] }>(
    {
      queryKey: [`/api/quizzes/${id}`],
      enabled: !!id,
    },
  );

  if (isLoading || !participantId || isCheckingPreviousAttempt) {
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
            onClick={() => navigate("/")}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600 transition-colors">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <QuizInterface quiz={quiz} participantId={participantId} />;
}
