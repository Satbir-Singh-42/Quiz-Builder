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
import { ROUTES } from "@shared/constants";

function Router() {
  return (
    <Switch>
      <Route path={ROUTES.HOME} component={HomePage} />
      <Route path={ROUTES.AUTH} component={AuthPage} />
      <Route path={ROUTES.TAKE_QUIZ} component={TakeQuizPage} />
      <Route path={ROUTES.RESULTS} component={QuizResultsPage} />

      {/* Admin routes */}
      <ProtectedRoute path={ROUTES.ADMIN} component={AdminDashboard} />
      <ProtectedRoute
        path={ROUTES.ADMIN_DASHBOARD}
        component={AdminDashboard}
      />
      <ProtectedRoute
        path={ROUTES.ADMIN_CREATE_QUIZ}
        component={AdminCreateQuiz}
      />
      <ProtectedRoute
        path={ROUTES.ADMIN_MANAGE_QUIZZES}
        component={AdminManageQuizzes}
      />
      <ProtectedRoute
        path={ROUTES.ADMIN_USER_RESULTS}
        component={AdminUserResults}
      />

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
