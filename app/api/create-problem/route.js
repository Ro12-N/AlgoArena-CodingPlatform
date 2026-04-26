import { getJudge0LanguageId, pollBatchResults, submitBatch } from "@/lib/judge0";
import { getCurrentUser } from "@/modules/auth/actions";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      difficulty,
      tags,
      examples,
      constraints,
      hints,
      editorial,
      testCases,
      codeSnippets,
      referenceSolutions,
    } = body;

    if (
      !title ||
      !description ||
      !difficulty ||
      !testCases ||
      !codeSnippets ||
      !referenceSolutions
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!Array.isArray(testCases) || testCases.length === 0) {
      return NextResponse.json(
        { error: "At least one test case is required" },
        { status: 400 }
      );
    }

    if (!referenceSolutions || typeof referenceSolutions !== "object") {
      return NextResponse.json(
        {
          error:
            "Reference solutions must be provided for all supported languages",
        },
        { status: 400 }
      );
    }

    const shouldValidateSolutions = Boolean(process.env.JUDGE0_API_URL);

    if (shouldValidateSolutions) {
      for (const [language, solutionCode] of Object.entries(referenceSolutions)) {
        const languageId = getJudge0LanguageId(language);

        if (!languageId) {
          return NextResponse.json(
            { error: `Unsupported language: ${language}` },
            { status: 400 }
          );
        }

        const submissions = testCases.map(({ input, output }) => ({
          source_code: solutionCode,
          language_id: languageId,
          stdin: input,
          expected_output: output,
        }));

        const submissionResults = await submitBatch(submissions);
        const tokens = submissionResults.map((result) => result.token);
        const results = await pollBatchResults(tokens);

        for (let index = 0; index < results.length; index += 1) {
          const result = results[index];

          if (result.status.id !== 3) {
            return NextResponse.json(
              {
                error: `Validation failed for ${language}`,
                testCase: {
                  input: submissions[index].stdin,
                  expectedOutput: submissions[index].expected_output,
                  actualOutput: result.stdout,
                  error: result.stderr || result.compile_output,
                },
                details: result,
              },
              { status: 400 }
            );
          }
        }
      }
    }

    const newProblem = await db.problem.create({
      data: {
        title,
        description,
        difficulty,
        tags,
        examples,
        constraints,
        hints: hints || null,
        editorial: editorial || null,
        testCases,
        codeSnippets,
        referenceSolutions,
        userId: user.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: shouldValidateSolutions
          ? "Problem created successfully"
          : "Problem created successfully without Judge0 validation",
        data: newProblem,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating problem:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save problem to database" },
      { status: 500 }
    );
  }
}
