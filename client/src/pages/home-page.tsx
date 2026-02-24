import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import UserInfoForm from "@/components/user-info-form";
import QuizList from "@/components/quiz-list";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut } from "lucide-react";
import { Participant, Quiz } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import {
  APP_NAME,
  APP_DESCRIPTION,
  STORAGE_KEYS,
  TIMER,
  ROUTES,
} from "@shared/constants";

export default function HomePage() {
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [isLoadingParticipant, setIsLoadingParticipant] = useState(true);
  const [, navigate] = useLocation();
  const { user } = useAuth();

  // Admin should not be on student pages — redirect to admin dashboard
  useEffect(() => {
    if (user?.isAdmin) {
      navigate(ROUTES.ADMIN);
    }
  }, [user, navigate]);

  // Check for participant data in localStorage - optimized for faster loading
  useEffect(() => {
    const loadParticipant = async () => {
      try {
        const storedParticipantId = localStorage.getItem(
          STORAGE_KEYS.PARTICIPANT_ID,
        );

        // Only attempt to load participant data if we have an ID stored
        if (storedParticipantId) {
          const response = await apiRequest(
            "GET",
            `/api/participants/${storedParticipantId}`,
          );

          if (response.ok) {
            const participantData = await response.json();
            setParticipant(participantData);
          } else {
            // If ID lookup fails, clear the stored ID
            localStorage.removeItem(STORAGE_KEYS.PARTICIPANT_ID);

            // Quick fallback to roll number if available
            const storedRollNumber = localStorage.getItem(
              STORAGE_KEYS.PARTICIPANT_ROLL,
            );
            if (storedRollNumber) {
              const rollResponse = await apiRequest(
                "GET",
                `/api/participants/roll/${storedRollNumber}`,
              );
              if (rollResponse.ok) {
                const participantData = await rollResponse.json();
                localStorage.setItem(
                  STORAGE_KEYS.PARTICIPANT_ID,
                  participantData.id.toString(),
                );
                setParticipant(participantData);
              } else {
                localStorage.removeItem(STORAGE_KEYS.PARTICIPANT_ROLL);
              }
            }
          }
        }
      } catch {
        localStorage.removeItem(STORAGE_KEYS.PARTICIPANT_ID);
        localStorage.removeItem(STORAGE_KEYS.PARTICIPANT_ROLL);
      } finally {
        // Always set loading to false when done
        setIsLoadingParticipant(false);
      }
    };

    // Start loading immediately
    loadParticipant();

    // Set a timeout to ensure we don't keep the loading state indefinitely
    const timeoutId = setTimeout(() => {
      setIsLoadingParticipant(false);
    }, TIMER.PARTICIPANT_LOAD_TIMEOUT_MS); // timeout as a fallback

    return () => clearTimeout(timeoutId);
  }, []);

  // For regular users, we only show active quizzes (don't pass includeInactive=true)
  const { data: quizzes, isLoading: isLoadingQuizzes } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes"],
    enabled: !!participant, // Only fetch quizzes after participant info is submitted
  });

  const handleAdminLogin = () => {
    navigate(ROUTES.AUTH);
  };

  const handleLogout = () => {
    // Clear participant data from state and localStorage
    setParticipant(null);
    localStorage.removeItem(STORAGE_KEYS.PARTICIPANT_ID);
    localStorage.removeItem(STORAGE_KEYS.PARTICIPANT_ROLL);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">{APP_NAME}</h1>
          <p className="text-gray-600">{APP_DESCRIPTION}</p>
        </div>

        <Button
          variant="ghost"
          onClick={handleAdminLogin}
          className="text-muted-foreground">
          Admin Login
        </Button>
      </header>

      {isLoadingParticipant ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !participant ? (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Welcome to the Quiz Platform
          </h2>
          <p className="mb-6">Please enter your information to get started.</p>

          <UserInfoForm onSubmit={setParticipant} />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md p-4 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-4 p-3 bg-primary/10 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Welcome</p>
                  <p className="font-medium">{participant.fullName}</p>
                  <p className="text-xs text-gray-500">
                    {participant.rollNumber} • {participant.department}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Available Quizzes</h2>

            {isLoadingQuizzes ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <QuizList
                quizzes={quizzes || []}
                participantId={participant.id}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
