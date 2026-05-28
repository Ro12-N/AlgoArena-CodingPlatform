import { getJudge0LanguageId, runSubmissions } from "@/lib/judge0";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/modules/auth/actions";
import { NextResponse } from "next/server";

async function validateReferenceSolutions(referenceSolutions, testCases) {
  for (const [language, solutionCode] of Object.entries(referenceSolutions)) {
    const languageId = getJudge0LanguageId(language);

    if (!languageId) {
      throw new Error(`Unsupported language: ${language}`);
    }

    const submissions = testCases.map(({ input, output }) => ({
      source_code: solutionCode,
      language_id: languageId,
      stdin: input,
      expected_output: output,
    }));

    const results = await runSubmissions(submissions);

    for (let index = 0; index < results.length; index += 1) {
      const result = results[index];

      if (result.status.id !== 3) {
        const error = new Error(`Validation failed for ${language}`);
        error.details = {
          testCase: {
            input: submissions[index].stdin,
            expectedOutput: submissions[index].expected_output,
            actualOutput: result.stdout,
            error: result.stderr || result.compile_output,
          },
          result,
        };
        throw error;
      }
    }
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const problem = await db.problem.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!problem) {
      return NextResponse.json(
        { success: false, error: "Problem not found" },
        { status: 404 }
      );
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
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!Array.isArray(testCases) || testCases.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one test case is required" },
        { status: 400 }
      );
    }

    if (!referenceSolutions || typeof referenceSolutions !== "object") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Reference solutions must be provided for all supported languages",
        },
        { status: 400 }
      );
    }

    await validateReferenceSolutions(referenceSolutions, testCases);

    const updatedProblem = await db.problem.update({
      where: { id },
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
      },
    });

    return NextResponse.json({
      success: true,
      message: "Problem updated successfully",
      data: updatedProblem,
    });
  } catch (error) {
    console.error("Error updating problem:", error);

    if (error.details) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          ...error.details,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update problem",
      },
      { status: 500 }
    );
  }
}
