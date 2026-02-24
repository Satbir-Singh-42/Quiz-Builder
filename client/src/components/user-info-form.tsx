import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { InsertParticipant, Participant } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  rollNumber: z.string().min(1, "Roll number is required"),
  class: z.string().min(1, "Year is required"),
  department: z.string().min(1, "Department is required"),
  customDepartment: z.string().optional(),
});

interface UserInfoFormProps {
  onSubmit: (participant: Participant) => void;
}

export default function UserInfoForm({ onSubmit }: UserInfoFormProps) {
  const { toast } = useToast();
  const [showCustomDepartment, setShowCustomDepartment] = useState(false);
  const [checking, setChecking] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      rollNumber: localStorage.getItem("participantRollNumber") || "",
      class: "",
      department: "",
      customDepartment: "",
    },
  });

  // We need to handle a React linter issue with the checkRollNumber dependency
  const initialRollNumberCheck = () => {
    const savedRollNumber = localStorage.getItem("participantRollNumber");
    if (savedRollNumber) {
      // Use a slight delay to ensure component is fully mounted
      setTimeout(() => {
        checkRollNumber(savedRollNumber);
      }, 100);
    }
  };

  // Check for saved roll number on component mount
  useEffect(() => {
    initialRollNumberCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createParticipantMutation = useMutation({
    mutationFn: async (data: InsertParticipant) => {
      // The server will check if a participant with this roll number already exists
      // and return the existing one instead of creating a new one
      const res = await apiRequest("POST", "/api/participants", data);
      return res.json();
    },
    onSuccess: (data: Participant) => {
      toast({
        title: "Success",
        description: "Your information has been saved successfully.",
      });
      // Save participant ID in localStorage for persistence
      localStorage.setItem("participantId", data.id.toString());

      // Also save roll number in localStorage for additional identification
      localStorage.setItem("participantRollNumber", data.rollNumber);

      onSubmit(data);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save your information. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Look up participant by roll number when it's entered
  const checkRollNumber = async (rollNumber: string) => {
    if (!rollNumber || rollNumber.trim() === "") return;

    try {
      setChecking(true);
      const response = await apiRequest(
        "GET",
        `/api/participants/roll/${rollNumber}`,
      );

      if (response.ok) {
        const participant = await response.json();
        // Autofill the form with existing data
        form.setValue("fullName", participant.fullName);
        form.setValue("class", participant.class);
        form.setValue("department", participant.department);

        // If department is custom, show custom department field
        if (
          ![
            "Civil-Engineering",
            "CSE",
            "EE",
            "ECE",
            "IT",
            "mechanical-engineering",
          ].includes(participant.department)
        ) {
          form.setValue("department", "other");
          form.setValue("customDepartment", participant.department);
          setShowCustomDepartment(true);
        }

        toast({
          title: "Found your information",
          description:
            "We've filled in your details based on your roll number.",
        });
      }
    } catch {
      // Participant not found — let the user fill in the form
    } finally {
      setChecking(false);
    }
  };

  function handleSubmit(values: z.infer<typeof formSchema>) {
    // If "other" is selected, use the custom department value
    const finalValues = {
      ...values,
      department:
        values.department === "other" && values.customDepartment
          ? values.customDepartment
          : values.department,
    };

    delete finalValues.customDepartment; // Remove customDepartment before submitting
    createParticipantMutation.mutate(finalValues as InsertParticipant);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rollNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>College Roll Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="2221192"
                    {...field}
                    onBlur={(e) => {
                      field.onBlur();
                      checkRollNumber(e.target.value);
                    }}
                  />
                </FormControl>
                {checking && (
                  <p className="text-sm text-muted-foreground">
                    Checking roll number...
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="class"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Year</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1st-year">1st Year</SelectItem>
                    <SelectItem value="2nd-year">2nd Year</SelectItem>
                    <SelectItem value="3rd-year">3rd Year</SelectItem>
                    <SelectItem value="4th-year">4th Year</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    setShowCustomDepartment(value === "other");
                  }}
                  defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Civil-Engineering">
                      Civil Engineering
                    </SelectItem>
                    <SelectItem value="CSE">
                      Computer Science and Engineering
                    </SelectItem>
                    <SelectItem value="EE">Electrical Engineering</SelectItem>
                    <SelectItem value="ECE">
                      Electronics and Communication Engineering
                    </SelectItem>
                    <SelectItem value="IT">Information Technology</SelectItem>
                    <SelectItem value="mechanical-engineering">
                      Mechanical Engineering
                    </SelectItem>
                    <SelectItem value="other">
                      Other (write your own)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {showCustomDepartment && (
            <FormField
              control={form.control}
              name="customDepartment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Department</FormLabel>
                  <FormControl>
                    <Input placeholder="Your department" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={createParticipantMutation.isPending}>
            {createParticipantMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Start Quiz"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
