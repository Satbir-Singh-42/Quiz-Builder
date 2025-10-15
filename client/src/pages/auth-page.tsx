import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Login schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Register schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .refine((val) => /^admin/.test(val), {
      message: "Invalid password format. Please use a valid admin password.",
    }),
  confirmPassword: z.string().min(1, "Confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const { user, loginMutation, registerMutation, isLoading } = useAuth();
  const [, navigate] = useLocation();
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/admin");
    }
  }, [user, navigate]);
  
  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  // Register form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });
  
  // Handle login submit
  function handleLoginSubmit(values: z.infer<typeof loginSchema>) {
    loginMutation.mutate(values);
  }
  
  // Handle register submit
  function handleRegisterSubmit(values: z.infer<typeof registerSchema>) {
    const { confirmPassword, ...userData } = values;
    // Ensure isAdmin is set to true for admin registration
    registerMutation.mutate({ ...userData, isAdmin: true });
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex">
      {/* Left side - Auth forms */}
      <div className="w-full max-w-md bg-white p-8 flex flex-col justify-center">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-primary">Admin Login</h1>
          <p className="text-gray-600 mt-1">Access the Quiz Builder dashboard</p>
        </div>
        
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="admin" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="register">
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(handleRegisterSubmit)} className="space-y-4">
                <FormField
                  control={registerForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="admin" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={registerForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    "Register"
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 text-center">
          <Button 
            variant="link" 
            className="text-sm text-primary"
            onClick={() => navigate('/')}
          >
            Back to User View
          </Button>
        </div>
      </div>
      
      {/* Right side - Hero section */}
      <div className="hidden md:flex flex-col justify-center items-center bg-primary text-white w-full p-8">
        <div className="max-w-md text-center">
          <h2 className="text-3xl font-bold mb-4">Welcome to Quiz Builder Admin</h2>
          <p className="text-lg mb-6">
            Create and manage quizzes, track student performance, and analyze results with our comprehensive quiz management system.
          </p>
          
          <div className="grid grid-cols-2 gap-6 mt-8">
            <div className="bg-white/10 p-4 rounded-lg">
              <div className="text-2xl font-bold mb-2">Create</div>
              <p className="text-sm">Build quizzes with unlimited questions and customizable time limits</p>
            </div>
            
            <div className="bg-white/10 p-4 rounded-lg">
              <div className="text-2xl font-bold mb-2">Manage</div>
              <p className="text-sm">Edit, update, or delete quizzes with an intuitive interface</p>
            </div>
            
            <div className="bg-white/10 p-4 rounded-lg">
              <div className="text-2xl font-bold mb-2">Track</div>
              <p className="text-sm">Monitor student performance and view detailed analytics</p>
            </div>
            
            <div className="bg-white/10 p-4 rounded-lg">
              <div className="text-2xl font-bold mb-2">Report</div>
              <p className="text-sm">Generate comprehensive reports on quiz results</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
