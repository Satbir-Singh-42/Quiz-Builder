import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, FileQuestion } from "lucide-react";
import { APP_NAME, ROUTES } from "@shared/constants";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 px-4">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
        {/* Icon */}
        <div className="mb-6 p-5 rounded-full bg-primary/10">
          <FileQuestion className="h-12 w-12 text-primary" />
        </div>

        {/* Error code */}
        <h1 className="text-8xl sm:text-9xl font-extrabold text-primary/20 leading-none select-none">
          404
        </h1>

        {/* Heading */}
        <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">
          Page Not Found
        </h2>

        {/* Description */}
        <p className="mt-3 text-gray-600 leading-relaxed">
          The page you're looking for doesn't exist or has been moved. Head back
          to <span className="font-semibold text-primary">{APP_NAME}</span> and
          try again.
        </p>

        {/* Action buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button
            onClick={() => navigate(ROUTES.HOME)}
            className="flex items-center gap-2 px-6">
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-6">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
