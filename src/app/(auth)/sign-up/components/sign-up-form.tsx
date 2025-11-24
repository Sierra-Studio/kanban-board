"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { peekSessionStatus, signUp } from "~/lib/auth-client";
import { Button, Input, Form } from "~/components/ui";
import { useToast } from "~/components/ui/toast";
import { signUpSchema, type SignUpData } from "~/lib/validations/auth";

export function SignUpForm() {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpData) => {
    setLoading(true);

    try {
      const result = await signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
      });

      if (result.error) {
        addToast(result.error.message ?? "Failed to sign up", "error");
      } else {
        addToast("Account created successfully!", "success");

        // Create demo board in background (non-blocking)
        peekSessionStatus()
          .catch((err) => {
            console.warn("Session peek before onboarding failed", err);
          })
          .finally(() => {
            fetch("/api/user/onboard", { method: "POST" }).catch((err) => {
              console.error("Failed to create demo board:", err);
            });
          });

        // Auto sign in after signup
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Sign up error:", err);
      addToast(
        err instanceof Error ? err.message : "Failed to sign up",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Input
        label="Name"
        type="text"
        placeholder="John Doe"
        disabled={loading}
        error={errors.name?.message}
        {...register("name")}
      />

      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        disabled={loading}
        error={errors.email?.message}
        {...register("email")}
      />

      <Input
        label="Password"
        type="password"
        placeholder="At least 8 characters"
        disabled={loading}
        error={errors.password?.message}
        {...register("password")}
      />

      <Input
        label="Confirm Password"
        type="password"
        placeholder="Re-enter your password"
        disabled={loading}
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      <Button
        type="submit"
        disabled={loading}
        className="w-full"
        variant="primary"
      >
        {loading ? "Creating account..." : "Sign Up"}
      </Button>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-blue-600 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
