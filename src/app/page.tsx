import Link from "next/link";
import { Button } from "~/components/ui";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
          Kanban <span className="text-[hsl(280,100%,70%)]">Board</span>
        </h1>

        <p className="text-xl text-gray-300">
          Organize your projects with a simple and intuitive Kanban board
        </p>

        <div className="flex gap-4">
          <Link href="/sign-in">
            <Button variant="secondary" size="lg">
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button variant="primary" size="lg">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
