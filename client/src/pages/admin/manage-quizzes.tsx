import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import SidebarLayout from "@/components/ui/sidebar-layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  PenSquare,
  Trash,
  Eye,
  Plus,
  Clock,
  Search,
} from "lucide-react";
import { QuizWithQuestions } from "@shared/schema";

export default function AdminManageQuizzes() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Get quizzes - admins can see all quizzes including inactive ones
  const { data: quizzes, isLoading } = useQuery<QuizWithQuestions[]>({
    queryKey: ["/api/quizzes"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/quizzes?includeInactive=true");
      return res.json();
    },
  });

  // Delete quiz mutation
  const deleteQuizMutation = useMutation({
    mutationFn: async (quizId: number) => {
      await apiRequest("DELETE", `/api/quizzes/${quizId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      toast({
        title: "Success",
        description:
          "Quiz has been removed from the active list. All related data is still preserved in the database.",
      });
      setDeleteDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete quiz. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Format date
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Filter quizzes
  const filteredQuizzes = quizzes?.filter((quiz) =>
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Handle delete
  const handleDelete = () => {
    if (quizToDelete) {
      deleteQuizMutation.mutate(quizToDelete);
    }
  };

  return (
    <SidebarLayout>
      <header className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manage Quizzes</h1>
          <p className="text-gray-600">View, edit, and delete your quizzes</p>
        </div>
        <Button onClick={() => navigate("/admin/create-quiz")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Quiz
        </Button>
      </header>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle>Quiz Management</CardTitle>
          <CardDescription>
            You have {filteredQuizzes?.length || 0} quiz
            {(filteredQuizzes?.length || 0) !== 1 ? "zes" : ""} available
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by quiz title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4"
                />
              </div>

              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                  className="h-9 px-2 text-xs">
                  Clear
                </Button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredQuizzes && filteredQuizzes.length > 0 ? (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Quiz Title</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Time Information</TableHead>
                    <TableHead>Passing Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuizzes.map((quiz) => (
                    <TableRow key={quiz.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">
                        {quiz.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50">
                          {quiz.questions?.length || 0} questions
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-slate-400" />
                          <span>{quiz.timeLimit} minutes</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            quiz.passingScore >= 80 ? "success" : "outline"
                          }
                          className={
                            quiz.passingScore >= 80
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : "bg-orange-100 text-orange-800 hover:bg-orange-100"
                          }>
                          {quiz.passingScore}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={quiz.isActive ? "default" : "outline"}
                          className={
                            quiz.isActive
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                          }>
                          {quiz.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(quiz.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary"
                            onClick={() =>
                              navigate(`/admin/create-quiz?edit=${quiz.id}`)
                            }
                            title="Edit Quiz">
                            <PenSquare className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-500"
                            onClick={() =>
                              window.open(`/take-quiz/${quiz.id}`, "_blank")
                            }
                            title="Preview Quiz">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500"
                            onClick={() => {
                              setQuizToDelete(quiz.id);
                              setDeleteDialogOpen(true);
                            }}
                            title="Delete Quiz">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 border rounded-md">
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <Search className="h-6 w-6 text-gray-400" />
                </div>
              </div>
              <p className="text-gray-600 font-medium">
                No quizzes found matching your search
              </p>
              <p className="text-gray-500 mt-1">
                Try adjusting your search or create a new quiz
              </p>
              <Button
                onClick={() => navigate("/admin/create-quiz")}
                className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create New Quiz
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this quiz from the active list?
              The quiz will no longer be available to students, but all related
              data (questions and results) will be preserved in the database for
              reference.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteQuizMutation.isPending}>
              {deleteQuizMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Quiz"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarLayout>
  );
}
