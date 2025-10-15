import { useState, useEffect, useRef } from "react";
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

interface QuizInterfaceProps {
  quiz: Quiz & { questions?: Question[] };
  participantId: number;
}

export default function QuizInterface({ quiz, participantId }: QuizInterfaceProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit * 60); // in seconds
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isTimeUpDialogOpen, setIsTimeUpDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const questions = quiz.questions || [];
  const totalQuestions = questions.length;
  
  useEffect(() => {
    // Set up the timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
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
  }, []);
  
  // Reset radio buttons when changing questions (for visual updates)
  useEffect(() => {
    // This will ensure that when the question index changes,
    // the radio buttons will be properly updated to match state
    const currentQuestionId = questions[currentQuestionIndex]?.id;
    const selectedAnswer = answers[currentQuestionId];
    
    // First uncheck all radio buttons
    const radioButtons = document.querySelectorAll('input[type="radio"]');
    radioButtons.forEach(input => {
      if (input instanceof HTMLInputElement) {
        input.checked = false;
      }
    });
    
    // Then check only the one that should be selected
    if (selectedAnswer !== undefined) {
      const radioToCheck = document.getElementById(`single-q${currentQuestionId}-option-${selectedAnswer}`);
      if (radioToCheck && radioToCheck instanceof HTMLInputElement) {
        radioToCheck.checked = true;
      }
    }
  }, [currentQuestionIndex, answers]);
  
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const getTimerProgressPercentage = (): number => {
    const totalSeconds = quiz.timeLimit * 60;
    return (timeLeft / totalSeconds) * 100;
  };
  
  const handleAnswerSelect = (questionId: number, answerIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answerIndex,
    }));
  };
  
  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      // Clear any radio buttons that might be visually selected
      const radioButtons = document.querySelectorAll('input[type="radio"]');
      radioButtons.forEach(input => {
        if (input instanceof HTMLInputElement && input.checked) {
          input.checked = false;
        }
      });
      
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };
  
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      // Clear any radio buttons that might be visually selected
      const radioButtons = document.querySelectorAll('input[type="radio"]');
      radioButtons.forEach(input => {
        if (input instanceof HTMLInputElement && input.checked) {
          input.checked = false;
        }
      });
      
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
      
      // Show success toast
      toast({
        title: "Quiz Submitted Successfully",
        description: "Your quiz has been submitted. Redirecting to results page.",
      });
      
      // Navigate to results page without any automatic redirect
      // User will click the Go to Homepage button on the results page to return to quiz list
      navigate(`/results/${data.id}`);
    },
    onError: (error) => {
      setSubmitting(false);
      toast({
        title: "Error",
        description: "Failed to submit your quiz. Please try again.",
        variant: "destructive",
      });
      console.error(error);
    },
  });
  
  const handleSubmit = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setSubmitting(true);
    
    const score = calculateScore();
    const timeTaken = quiz.timeLimit * 60 - timeLeft;
    
    const formattedAnswers = Object.entries(answers).map(([questionId, answerIndex]) => ({
      questionId: parseInt(questionId),
      selectedAnswer: answerIndex,
    }));
    
    submitResultMutation.mutate({
      participantId,
      quizId: quiz.id,
      score,
      totalQuestions,
      timeTaken,
      answers: formattedAnswers,
    });
  };
  
  const handleTimeUp = () => {
    setIsTimeUpDialogOpen(false);
    handleSubmit();
  };
  
  if (totalQuestions === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-xl font-semibold text-yellow-500">No Questions</h2>
          <p className="mt-2 text-gray-600">This quiz doesn't have any questions yet.</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="mb-6">
        <div className="flex justify-end items-center">
          <div className="bg-slate-50 px-4 py-2 rounded-full">
            <span className="text-gray-600 mr-2">Time Remaining:</span>
            <span className="font-semibold">{formatTime(timeLeft)}</span>
          </div>
        </div>
        
        {/* Timer Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
          <div 
            className="bg-primary h-2.5 rounded-full timer-animation" 
            style={{ width: `${getTimerProgressPercentage()}%` }}
          ></div>
        </div>
      </header>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <Tabs defaultValue="single">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
            <h2 className="text-xl font-semibold text-primary">
              {quiz.title}
            </h2>
            <TabsList className="w-full md:w-auto">
              <TabsTrigger value="single">Answer One by One</TabsTrigger>
              <TabsTrigger value="all">View All Questions</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="single">
            <div className="space-y-6">
              {questions[currentQuestionIndex] && (
                <div className="quiz-question">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-md text-gray-500">Question {currentQuestionIndex + 1} of {totalQuestions}</h3>
                  </div>
                  <p className="text-lg mb-4 font-medium">
                    {questions[currentQuestionIndex].text}
                  </p>
                  
                  <RadioGroup 
                    value={answers[questions[currentQuestionIndex].id]?.toString() || ""}
                    onValueChange={(value) => handleAnswerSelect(questions[currentQuestionIndex].id, parseInt(value))}
                    className="space-y-3"
                  >
                    {questions[currentQuestionIndex].options.map((option, index) => (
                      <div key={index} className="quiz-option group border border-gray-200 rounded-md py-3 px-4 hover:bg-slate-50 hover:border-primary transition-all">
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem 
                            value={index.toString()} 
                            id={`single-q${questions[currentQuestionIndex].id}-option-${index}`}
                            checked={answers[questions[currentQuestionIndex].id] === index}
                          />
                          <Label htmlFor={`single-q${questions[currentQuestionIndex].id}-option-${index}`} className="flex-grow cursor-pointer font-normal">
                            {option}
                          </Label>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}
              
              <div className="flex justify-between mt-8">
                <Button 
                  variant="outline" 
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </Button>
                {currentQuestionIndex < totalQuestions - 1 ? (
                  <Button onClick={handleNext}>
                    Next
                  </Button>
                ) : (
                  <Button 
                    variant="default" 
                    onClick={() => setIsSubmitDialogOpen(true)}
                  >
                    Submit Quiz
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="all">
            <div className="space-y-8">
              {questions.map((question, index) => (
                <div key={question.id} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-md text-gray-500">Question {index + 1} of {totalQuestions}</h3>
                  </div>
                  <p className="text-lg mb-4 font-medium">
                    {question.text}
                  </p>
                  
                  <RadioGroup 
                    value={answers[question.id]?.toString() || ""}
                    onValueChange={(value) => handleAnswerSelect(question.id, parseInt(value))}
                    className="space-y-3"
                  >
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="quiz-option group border border-gray-200 rounded-md py-3 px-4 hover:bg-slate-50 hover:border-primary transition-all">
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem 
                            value={optionIndex.toString()} 
                            id={`q${question.id}-option-${optionIndex}`}
                            checked={answers[question.id] === optionIndex}
                          />
                          <Label htmlFor={`q${question.id}-option-${optionIndex}`} className="flex-grow cursor-pointer font-normal">
                            {option}
                          </Label>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="flex justify-center">
        <Button 
          className="px-6 py-3 bg-accent hover:bg-amber-600 font-medium"
          onClick={() => setIsSubmitDialogOpen(true)}
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit Quiz"}
        </Button>
      </div>
      
      {/* Submit Dialog */}
      <AlertDialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to submit?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {Object.keys(answers).length} out of {totalQuestions} questions.
              Once submitted, you won't be able to change your answers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>Submit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Time Up Dialog */}
      <AlertDialog open={isTimeUpDialogOpen} onOpenChange={setIsTimeUpDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Time's Up!</AlertDialogTitle>
            <AlertDialogDescription>
              Your time for this quiz has ended. Your answers will be submitted automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleTimeUp}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
