import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Sidebar from "@/components/layout/sidebar";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash } from "lucide-react";
import { Switch } from "@/components/ui/switch";

// Define the form schema
const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  timeLimit: z.coerce.number().int().positive("Time limit must be positive"),
  passingScore: z.coerce.number().int().min(1, "Min 1%").max(100, "Max 100%"),
  isActive: z.boolean().default(true),
  password: z.string().optional(),
  questions: z.array(
    z.object({
      text: z.string().min(3, "Question must be at least 3 characters"),
      options: z.array(z.string().min(1, "Option cannot be empty")).min(2, "At least 2 options required"),
      correctAnswer: z.number(),
    })
  ).min(1, "At least one question is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function AdminCreateQuiz() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Check if editing existing quiz - use window.location.search to get query params
  const searchParams = new URLSearchParams(window.location.search);
  const editQuizId = searchParams.get('edit');
  
  // Debug
  console.log("Window Location:", window.location.href);
  console.log("Search Params:", window.location.search);
  console.log("Edit Quiz ID:", editQuizId);
  const [isLoading, setIsLoading] = useState(false);
  const [existingQuiz, setExistingQuiz] = useState<any>(null);
  
  // Create a ref to track if we need to reset form
  const formResetRef = useRef(false);
  
  // Get existing quiz data if editing
  useEffect(() => {
    const fetchQuizData = async () => {
      if (editQuizId) {
        setIsLoading(true);
        
        try {
          // Use apiRequest instead of fetch to ensure auth headers are included
          const quizResponse = await apiRequest("GET", `/api/quizzes/${editQuizId}`);
          if (!quizResponse.ok) throw new Error('Failed to fetch quiz');
          
          const quizData = await quizResponse.json();
          
          const questionsResponse = await apiRequest("GET", `/api/quizzes/${editQuizId}/questions`);
          if (!questionsResponse.ok) throw new Error('Failed to fetch questions');
          
          const questionsData = await questionsResponse.json();
          
          console.log("Loaded quiz data:", quizData);
          console.log("Loaded questions data:", questionsData);
          
          // Set the existing quiz data
          const quizWithQuestions = {
            ...quizData,
            questions: questionsData
          };
          
          setExistingQuiz(quizWithQuestions);
          
          // Flag form to be reset with new values
          formResetRef.current = true;
          
          // Reset form with new values
          form.reset({
            title: quizData.title,
            timeLimit: quizData.timeLimit,
            passingScore: quizData.passingScore,
            isActive: quizData.isActive,
            questions: questionsData.map((q: any) => ({
              text: q.text,
              options: q.options,
              correctAnswer: q.correctAnswer,
            }))
          });
        } catch (error) {
          console.error('Error fetching quiz data:', error);
          toast({
            title: 'Error',
            description: 'Failed to load quiz data',
            variant: 'destructive'
          });
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchQuizData();
  }, [editQuizId, toast]);
  
  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      timeLimit: 30,
      passingScore: 60,
      isActive: true,
      questions: [
        {
          text: "",
          options: ["", ""],
          correctAnswer: 0,
        },
      ],
    },
  });
  
  // Use field array for dynamic questions and options
  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control: form.control,
    name: "questions",
  });
  
  // Create or update quiz mutation
  const quizMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      let quiz;
      
      if (editQuizId) {
        // Update existing quiz
        const quizRes = await apiRequest("PUT", `/api/quizzes/${editQuizId}`, {
          title: data.title,
          timeLimit: data.timeLimit,
          passingScore: data.passingScore,
          isActive: data.isActive,
        });
        
        quiz = await quizRes.json();
        
        // Fetch existing questions to determine which to delete
        const existingQuestionsRes = await apiRequest("GET", `/api/quizzes/${editQuizId}/questions`);
        const existingQuestions = await existingQuestionsRes.json();
        console.log("Existing questions for deletion:", existingQuestions);
        
        // Delete all existing questions
        for (const question of existingQuestions) {
          await apiRequest("DELETE", `/api/questions/${question.id}`);
        }
        
        // Add new questions
        for (const question of data.questions) {
          await apiRequest("POST", "/api/questions", {
            quizId: quiz.id,
            text: question.text,
            options: question.options,
            correctAnswer: question.correctAnswer,
          });
        }
      } else {
        // Create new quiz
        const quizRes = await apiRequest("POST", "/api/quizzes", {
          title: data.title,
          timeLimit: data.timeLimit,
          passingScore: data.passingScore,
          isActive: data.isActive,
        });
        
        quiz = await quizRes.json();
        
        // Add questions
        for (const question of data.questions) {
          await apiRequest("POST", "/api/questions", {
            quizId: quiz.id,
            text: question.text,
            options: question.options,
            correctAnswer: question.correctAnswer,
          });
        }
      }
      
      return quiz;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      toast({
        title: "Success",
        description: editQuizId ? "Quiz updated successfully" : "Quiz created successfully",
      });
      navigate("/admin/manage-quizzes");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: editQuizId ? "Failed to update quiz. Please try again." : "Failed to create quiz. Please try again.",
        variant: "destructive",
      });
      console.error(error);
    },
  });
  
  // Handle form submission
  function onSubmit(data: FormValues) {
    quizMutation.mutate(data);
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar />
        
        <main className="ml-64 flex-1 p-8">
          <header className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading Quiz...
                </span>
              ) : editQuizId ? "Edit Quiz" : "Create New Quiz"}
            </h1>
            <p className="text-gray-600">
              {editQuizId ? "Update questions and quiz parameters" : "Add questions and set quiz parameters"}
            </p>
          </header>
          
          <Card>
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Quiz Details */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quiz Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Introduction to JavaScript" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="timeLimit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time Limit (minutes)</FormLabel>
                            <FormControl>
                              <Input type="number" min={1} {...field} />
                            </FormControl>
                            <FormDescription>
                              Maximum time allowed for the quiz
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="passingScore"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Passing Score (%)</FormLabel>
                            <FormControl>
                              <Input type="number" min={1} max={100} {...field} />
                            </FormControl>
                            <FormDescription>
                              Minimum percentage to pass the quiz
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Quiz Visibility</FormLabel>
                            <FormDescription>
                              When active, this quiz will be visible to students on the quiz list.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Questions */}
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-semibold">Questions</h2>
                      <FormMessage>
                        {form.formState.errors.questions?.message}
                      </FormMessage>
                    </div>
                    
                    {questionFields.map((field, questionIndex) => (
                      <div 
                        key={field.id} 
                        className="border border-gray-200 rounded-lg p-4 space-y-4"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-medium">Question {questionIndex + 1}</h3>
                          {questionFields.length > 1 && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeQuestion(questionIndex)}
                            >
                              <Trash className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          )}
                        </div>
                        
                        <FormField
                          control={form.control}
                          name={`questions.${questionIndex}.text`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Question Text</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Enter your question here"
                                  className="resize-none"
                                  rows={2}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="space-y-4">
                          <FormLabel>Answer Options</FormLabel>
                          
                          <FormField
                            control={form.control}
                            name={`questions.${questionIndex}.correctAnswer`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <RadioGroup
                                    onValueChange={(value) => field.onChange(parseInt(value))}
                                    value={field.value.toString()}
                                    className="space-y-3"
                                  >
                                    {form.watch(`questions.${questionIndex}.options`)?.map((_, optionIndex) => (
                                      <div key={optionIndex} className="flex items-center">
                                        <RadioGroupItem
                                          value={optionIndex.toString()}
                                          id={`q${questionIndex}-option-${optionIndex}`}
                                          className="mr-2"
                                        />
                                        <FormField
                                          control={form.control}
                                          name={`questions.${questionIndex}.options.${optionIndex}`}
                                          render={({ field: optionField }) => (
                                            <FormItem className="flex-grow">
                                              <FormControl>
                                                <Input
                                                  placeholder="Enter answer option"
                                                  {...optionField}
                                                />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                        {form.watch(`questions.${questionIndex}.options`).length > 2 && (
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="ml-2 text-red-500"
                                            onClick={() => {
                                              const currentOptions = form.getValues(`questions.${questionIndex}.options`);
                                              const currentCorrectAnswer = form.getValues(`questions.${questionIndex}.correctAnswer`);
                                              
                                              // Remove the option
                                              const newOptions = [...currentOptions];
                                              newOptions.splice(optionIndex, 1);
                                              
                                              // Update correct answer if needed
                                              let newCorrectAnswer = currentCorrectAnswer;
                                              if (optionIndex === currentCorrectAnswer) {
                                                newCorrectAnswer = 0;
                                              } else if (optionIndex < currentCorrectAnswer) {
                                                newCorrectAnswer--;
                                              }
                                              
                                              form.setValue(`questions.${questionIndex}.options`, newOptions);
                                              form.setValue(`questions.${questionIndex}.correctAnswer`, newCorrectAnswer);
                                            }}
                                          >
                                            <Trash className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                    ))}
                                  </RadioGroup>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const currentOptions = form.getValues(`questions.${questionIndex}.options`);
                              form.setValue(`questions.${questionIndex}.options`, [...currentOptions, ""]);
                            }}
                            className="text-primary"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Another Option
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        appendQuestion({
                          text: "",
                          options: ["", ""],
                          correctAnswer: 0,
                        });
                      }}
                      className="w-full border-dashed"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Another Question
                    </Button>
                  </div>
                  
                  {/* Submit */}
                  <div className="flex justify-end mt-8 space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/admin/manage-quizzes")}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={quizMutation.isPending}
                    >
                      {quizMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {editQuizId ? "Updating..." : "Creating..."}
                        </>
                      ) : (
                        editQuizId ? "Update Quiz" : "Create Quiz"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
