import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const highlights = [
  "Browse and organize coding problems",
  "Create playlists to group practice sets",
  "Track submissions and solved progress",
  "Use Clerk auth in production or the built-in local dev user",
];

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-5xl py-32 space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">About This Project</h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          This LeetCode-style app is built with Next.js, Prisma, PostgreSQL,
          Clerk, and a local development fallback so it can run even before
          external auth is configured.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {highlights.map((item) => (
          <Card key={item}>
            <CardHeader>
              <CardTitle className="text-xl">{item}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                The project is wired for local development and can be upgraded
                to full production integrations by adding Clerk and Judge0
                credentials.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
