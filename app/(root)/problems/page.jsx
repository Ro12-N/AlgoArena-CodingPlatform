import { getAllProblems } from '@/modules/problems/actions';
import AuthStatusCard from "@/modules/auth/components/auth-status-card";
import { currentUser, isClerkConfigured } from "@/lib/auth";
import { getCurrentUser } from "@/modules/auth/actions";
import ProblemsTable from '@/modules/problems/components/problem-table';

export const dynamic = "force-dynamic";

const ProblemsPage = async () => {
  const authUser = await currentUser();
  const dbUser = authUser ? await getCurrentUser() : null;

  const problemsResult = await getAllProblems();

  if (!problemsResult.success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-destructive">
          Error loading problems: {problemsResult.error}
        </p>
      </div>
    );
  }

  const problems = problemsResult.data;

  return (
    <div className="container mx-auto py-32 space-y-6">
      {!authUser && (
        <div className="px-6">
          <AuthStatusCard
            title="Browse Problems in Guest Mode"
            description={
              isClerkConfigured()
                ? "Sign in to track solved problems, create playlists, and save your progress."
                : "This deployment can show the problem list, but account features need Clerk environment variables before sign-in can work."
            }
            authConfigured={isClerkConfigured()}
            ctaLabel="Sign In to Save Progress"
          />
        </div>
      )}

      <ProblemsTable
        problems={problems}
        user={dbUser}
        authConfigured={isClerkConfigured()}
      />
    </div>
  );
}

export default ProblemsPage
