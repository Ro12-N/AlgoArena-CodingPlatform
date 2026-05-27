import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CpuIcon, Code, CheckCircle2, XCircle } from "lucide-react";

export const SubmissionDetails = ({ submission }) => {
  const isSuccess = submission.status === "Accepted";

  const parseMetricValues = (value) => {
    if (!value) return [];

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [value];
    }
  };

  const averageMetric = (value, digits) => {
    const values = parseMetricValues(value)
      .map((item) => parseFloat(String(item)))
      .filter((item) => Number.isFinite(item));

    if (!values.length) {
      return "N/A";
    }

    const average =
      values.reduce((total, item) => total + item, 0) / values.length;

    return average.toFixed(digits);
  };

  const averageMemory = averageMetric(submission.memory, 2);
  const averageTime = averageMetric(submission.time, 3);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Submission Details</CardTitle>
          {isSuccess ? (
            <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Success
            </Badge>
          ) : (
            <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
              <XCircle className="mr-1 h-3 w-3" />
              {submission.status}
            </Badge>
          )}
        </div>
        <CardDescription>
          Submitted at {new Date(submission.createdAt).toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Language</p>
              <p className="text-sm text-muted-foreground">{submission.language}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CpuIcon className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Memory (avg)</p>
              <p className="text-sm text-muted-foreground">
                {averageMemory === "N/A" ? "N/A" : `${averageMemory} KB`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Time (avg)</p>
              <p className="text-sm text-muted-foreground">
                {averageTime === "N/A" ? "N/A" : `${averageTime} s`}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
