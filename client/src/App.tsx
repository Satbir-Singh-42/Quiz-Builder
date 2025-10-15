import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import TakeQuizPage from "@/pages/take-quiz-page";
import QuizResultsPage from "@/pages/quiz-results-page";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminCreateQuiz from "@/pages/admin/create-quiz";
import AdminManageQuizzes from "@/pages/admin/manage-quizzes";
import AdminUserResults from "@/pages/admin/user-results";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/take-quiz/:id" component={TakeQuizPage} />
      <Route path="/results/:id" component={QuizResultsPage} />
      
      {/* Admin routes */}
      <ProtectedRoute path="/admin" component={AdminDashboard} />
      <ProtectedRoute path="/admin/dashboard" component={AdminDashboard} />
      <ProtectedRoute path="/admin/create-quiz" component={AdminCreateQuiz} />
      <ProtectedRoute path="/admin/manage-quizzes" component={AdminManageQuizzes} />
      <ProtectedRoute path="/admin/user-results" component={AdminUserResults} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
