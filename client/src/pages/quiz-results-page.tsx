import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import QuizResults from "@/components/quiz-results";
import { ResultWithDetails } from "@shared/schema";

export default function QuizResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const { data: result, isLoading } = useQuery<ResultWithDetails>({
    queryKey: [`/api/results/${id}`],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-xl font-semibold text-red-500">
            Result Not Found
          </h2>
          <p className="mt-2 text-gray-600">
            The quiz result you're looking for doesn't exist or has been
            removed.
          </p>
          <Button onClick={() => navigate("/")} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return <QuizResults result={result} />;
}
