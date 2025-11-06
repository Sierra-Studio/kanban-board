"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button, Input } from "~/components/ui";
import { useToast } from "~/components/ui/toast";
import { createBoard } from "~/lib/api/boards";

const createBoardSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(255, "Title must be shorter than 255 characters"),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be shorter than 2000 characters")
    .optional(),
});

type CreateBoardValues = z.infer<typeof createBoardSchema>;

export function CreateBoardForm() {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateBoardValues>({
    resolver: zodResolver(createBoardSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const onSubmit = async (values: CreateBoardValues) => {
    setLoading(true);
    try {
      const title = values.title.trim();
      const description = values.description?.trim();
      await createBoard({
        title,
        description: description ?? undefined,
      });
      addToast("Board created successfully", "success");
      reset();
      router.refresh();
    } catch (error) {
      console.error("Create board error", error);
      addToast(
        error instanceof Error ? error.message : "Failed to create board",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Board Title"
          placeholder="e.g. Product Launch"
          disabled={loading}
          error={errors.title?.message}
          {...register("title")}
        />
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            className="block h-24 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
            placeholder="Optional notes about this board"
            disabled={loading}
            {...register("description")}
          />
          {errors.description?.message ? (
            <p className="mt-1 text-sm text-red-600">
              {errors.description.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="submit" disabled={loading} variant="primary">
          {loading ? "Creating..." : "Create Board"}
        </Button>
      </div>
    </form>
  );
}
