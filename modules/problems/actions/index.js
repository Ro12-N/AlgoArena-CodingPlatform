"use server";

import { db } from "@/lib/db";
import { getLanguageName, pollBatchResults, submitBatch } from "@/lib/judge0";
import { getCurrentUser } from "@/modules/auth/actions";

import { revalidatePath } from "next/cache";

export const getAllProblems = async () => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("User not found");
    }

    const problems = await db.problem.findMany({
      include: {
        solvedBy: {
          where: {
            userId: user.id,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: problems };
  } catch (error) {
    console.error("Error fetching problems:", error);
    return { success: false, error: "Failed to fetch problems" };
  }
};

export const getProblemById = async (id) => {
  try {
    const problem = await db.problem.findUnique({
      where: {
        id,
      },
    });

    return { success: true, data: problem };
  } catch (error) {
    console.error("Error fetching problem:", error);
    return { success: false, error: "Failed to fetch problem" };
  }
};

export const getAllProblemSolvedByUser = async () => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("User not found");
    }

    const problems = await db.problem.findMany({
      include: {
        solvedBy: {
          where: {
            userId: user.id,
          },
        },
      },
    });

    return { success: true, data: problems };
  } catch (error) {
    console.error("Error fetching solved problems:", error);
    return { success: false, error: "Failed to fetch solved problems" };
  }
};

export const deleteProblem = async (problemId) => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    if (user.role !== "ADMIN") {
      throw new Error("Unauthorized: Only admins can delete problems.");
    }

    await db.problem.delete({
      where: { id: problemId },
    });

    revalidatePath("/problems");
    return { success: true, message: "Problem deleted successfully" };
  } catch (error) {
    console.error("Error deleting problem:", error);
    return {
      success: false,
      error: error.message || "Failed to delete problem",
    };
  }
};

export const createPlaylist = async (name, description) => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    const playlist = await db.playlist.create({
      data: {
        name,
        description,
        userId: user.id,
      },
    });

    revalidatePath("/problems");
    return { success: true, data: playlist };
  } catch (error) {
    console.error("Error creating playlist:", error);
    return {
      success: false,
      error: error.message || "Failed to create playlist",
    };
  }
};

export const addProblemToPlaylist = async (problemId, playlistId) => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    const playlist = await db.playlist.findFirst({
      where: {
        id: playlistId,
        userId: user.id,
      },
    });

    if (!playlist) {
      throw new Error("Playlist not found or unauthorized");
    }

    await db.problemInPlaylist.create({
      data: {
        playlistId,
        problemId,
      },
    });

    revalidatePath("/problems");
    return { success: true, message: "Problem added to playlist" };
  } catch (error) {
    console.error("Error adding problem to playlist:", error);
    return {
      success: false,
      error: error.message || "Failed to add problem to playlist",
    };
  }
};

export const executeCode = async (
  sourceCode,
  languageId,
  stdin,
  expectedOutputs,
  problemId
) => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!process.env.JUDGE0_API_URL) {
      return {
        success: false,
        error:
          "Code execution is disabled until JUDGE0_API_URL is configured.",
      };
    }

    if (
      !Array.isArray(stdin) ||
      stdin.length === 0 ||
      !Array.isArray(expectedOutputs) ||
      expectedOutputs.length !== stdin.length
    ) {
      return { success: false, error: "Invalid test cases" };
    }

    const submissions = stdin.map((input) => ({
      source_code: sourceCode,
      language_id: languageId,
      stdin: input,
      base64_encoded: false,
      wait: false,
    }));

    const submitResponse = await submitBatch(submissions);
    const tokens = submitResponse.map((result) => result.token);
    const results = await pollBatchResults(tokens);

    let allPassed = true;
    const detailedResults = results.map((result, index) => {
      const stdout = result.stdout?.trim() || null;
      const expectedOutput = expectedOutputs[index]?.trim();
      const passed = stdout === expectedOutput;

      if (!passed) {
        allPassed = false;
      }

      return {
        testCase: index + 1,
        passed,
        stdout,
        expected: expectedOutput,
        stderr: result.stderr || null,
        compileOutput: result.compile_output || null,
        status: result.status.description,
        memory: result.memory ? `${result.memory} KB` : undefined,
        time: result.time ? `${result.time} s` : undefined,
      };
    });

    const submission = await db.submission.create({
      data: {
        userId: user.id,
        problemId,
        sourceCode,
        language: getLanguageName(languageId),
        stdin: stdin.join("\n"),
        stdout: JSON.stringify(detailedResults.map((result) => result.stdout)),
        stderr: detailedResults.some((result) => result.stderr)
          ? JSON.stringify(detailedResults.map((result) => result.stderr))
          : null,
        compileOutput: detailedResults.some((result) => result.compileOutput)
          ? JSON.stringify(
              detailedResults.map((result) => result.compileOutput)
            )
          : null,
        status: allPassed ? "Accepted" : "Wrong Answer",
        memory: detailedResults.some((result) => result.memory)
          ? JSON.stringify(detailedResults.map((result) => result.memory))
          : null,
        time: detailedResults.some((result) => result.time)
          ? JSON.stringify(detailedResults.map((result) => result.time))
          : null,
      },
    });

    if (allPassed) {
      await db.problemSolved.upsert({
        where: {
          userId_problemId: { userId: user.id, problemId },
        },
        update: {},
        create: { userId: user.id, problemId },
      });
    }

    const testCaseResults = detailedResults.map((result) => ({
      submissionId: submission.id,
      testCase: result.testCase,
      passed: result.passed,
      stdout: result.stdout,
      expected: result.expected,
      stderr: result.stderr,
      compileOutput: result.compileOutput,
      status: result.status,
      memory: result.memory,
      time: result.time,
    }));

    await db.testCaseResult.createMany({ data: testCaseResults });

    const submissionWithTestCases = await db.submission.findUnique({
      where: { id: submission.id },
      include: { testCases: true },
    });

    return { success: true, submission: submissionWithTestCases };
  } catch (error) {
    console.error("Error executing code:", error);
    return {
      success: false,
      error: error.message || "Failed to execute code",
    };
  }
};

export const getAllSubmissionByCurrentUserForProblem = async (problemId) => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const submissions = await db.submission.findMany({
      where: {
        problemId,
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: submissions };
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch submissions",
    };
  }
};
