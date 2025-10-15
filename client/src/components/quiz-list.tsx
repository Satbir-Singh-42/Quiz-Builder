import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Quiz } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, Eye, RefreshCw } from "lucide-react";

interface QuizListProps {
  quizzes: Quiz[];
  participantId: number;
}

export default function QuizList({ quizzes, participantId }: QuizListProps) {
  const [, navigate] = useLocation();
  const [completedQuizzes, setCompletedQuizzes] = useState<Record<number, { id: number, canRetake: boolean }>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch completed quizzes for this participant
  useEffect(() => {
    const fetchCompletedQuizzes = async () => {
      try {
        const response = await apiRequest('GET', `/api/participants/${participantId}/results`);
        if (response.ok) {
          const results = await response.json();
          
          // Create a mapping of quizId to result info (id and retake status)
          const completed: Record<number, { id: number, canRetake: boolean }> = {};
          results.forEach((result: any) => {
            completed[result.quizId] = { 
              id: result.id, 
              canRetake: result.canRetake || false 
            };
          });
          
          setCompletedQuizzes(completed);
        }
      } catch (error) {
        console.error("Error fetching completed quizzes:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCompletedQuizzes();
  }, [participantId]);
  
  const handleTakeQuiz = (quizId: number) => {
    // Store participantId in localStorage for later use
    localStorage.setItem('participantId', participantId.toString());
    navigate(`/take-quiz/${quizId}`);
  };
  
  const handleViewResult = (resultId: number) => {
    navigate(`/results/${resultId}`);
  };
  
  if (quizzes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No quizzes available at the moment.</p>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Loading quizzes...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {quizzes.map((quiz) => {
        const isCompleted = quiz.id in completedQuizzes;
        const quizResult = isCompleted ? completedQuizzes[quiz.id] : null;
        const canRetake = quizResult?.canRetake || false;
        
        return (
          <div 
            key={quiz.id} 
            className="border border-gray-200 rounded-md p-4 hover:border-primary transition-colors"
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-lg">{quiz.title}</h3>
                  {isCompleted && (
                    <Badge 
                      variant="outline" 
                      className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" /> Completed
                    </Badge>
                  )}
                  {canRetake && (
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" /> Retake Available
                    </Badge>
                  )}
                </div>
                <p className="text-gray-500 text-sm">
                  Time limit: {quiz.timeLimit} minutes
                </p>
              </div>
              
              <div className="flex gap-2">
                {isCompleted && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex items-center"
                    onClick={() => handleViewResult(quizResult!.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" /> View Result
                  </Button>
                )}
                
                {(!isCompleted || canRetake) && (
                  <Button 
                    size="sm" 
                    onClick={() => handleTakeQuiz(quiz.id)}
                    className="flex items-center"
                  >
                    {canRetake ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-1" /> Retake Quiz
                      </>
                    ) : (
                      <>Take Quiz</>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
