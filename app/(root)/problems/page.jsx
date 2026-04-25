import { getAllProblems } from '@/modules/problems/actions';
import { getCurrentUser } from "@/modules/auth/actions";
import ProblemsTable from '@/modules/problems/components/problem-table';
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const ProblemsPage = async () => {
  const dbUser = await getCurrentUser();
  if (!dbUser) {
    redirect("/sign-in");
  }

  const { data: problems, error } = await getAllProblems();

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-destructive">Error loading problems: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-32">
      <ProblemsTable problems={problems} user={dbUser} />
    </div>
  );
}

export default ProblemsPage
