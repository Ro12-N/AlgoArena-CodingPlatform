"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { getLanguageName, pollBatchResults, submitBatch } from "@/lib/judge0";
import { getCurrentUser } from "@/modules/auth/actions";

import { revalidatePath } from "next/cache";

const ACCEPTED_STATUS_ID = 3;
const COMPILATION_ERROR_STATUS_ID = 6;
const RUNTIME_ERROR_STATUS_IDS = new Set([7, 8, 9, 10, 11, 12, 13]);

const determineSubmissionStatus = (results) => {
  if (results.every((result) => result.status.id === ACCEPTED_STATUS_ID)) {
    return "Accepted";
  }

  if (results.some((result) => result.status.id === COMPILATION_ERROR_STATUS_ID)) {
    return "Compilation Error";
  }

  if (results.some((result) => RUNTIME_ERROR_STATUS_IDS.has(result.status.id))) {
    return "Runtime Error";
  }

  if (results.some((result) => result.status.id === 5)) {
    return "Time Limit Exceeded";
  }

  if (results.some((result) => result.status.id === 4)) {
    return "Wrong Answer";
  }

  return results.find((result) => result.status?.description)?.status.description
    || "Execution Failed";
};

const buildMetricPayload = (results, key) => {
  const values = results
    .map((result) => result[key])
    .filter(Boolean);

  return values.length ? JSON.stringify(values) : null;
};

const buildSubmissionPreview = ({
  sourceCode,
  languageId,
  status,
  stdin,
  detailedResults,
}) => ({
  id: `preview-${Date.now()}`,
  language: getLanguageName(languageId),
  sourceCode,
  stdin: stdin.join("\n"),
  status,
  memory: buildMetricPayload(detailedResults, "memory"),
  time: buildMetricPayload(detailedResults, "time"),
  stdout: JSON.stringify(detailedResults.map((result) => result.stdout)),
  stderr: buildMetricPayload(detailedResults, "stderr"),
  compileOutput: buildMetricPayload(detailedResults, "compileOutput"),
  createdAt: new Date().toISOString(),
  testCases: detailedResults.map((result, index) => ({
    id: `preview-case-${index + 1}`,
    ...result,
  })),
});

const evaluateCodeAgainstTestCases = async ({
  sourceCode,
  languageId,
  stdin,
  expectedOutputs,
}) => {
  if (
    !Array.isArray(stdin) ||
    stdin.length === 0 ||
    !Array.isArray(expectedOutputs) ||
    expectedOutputs.length !== stdin.length
  ) {
    throw new Error("Invalid test cases");
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

  const detailedResults = results.map((result, index) => {
    const stdout = result.stdout?.trim() || null;
    const expectedOutput = expectedOutputs[index]?.trim() || null;
    const passed =
      result.status.id === ACCEPTED_STATUS_ID && stdout === expectedOutput;

    return {
      testCase: index + 1,
      passed,
      stdout,
      expected: expectedOutput,
      stderr: result.stderr || null,
      compileOutput: result.compile_output || null,
      status: result.status.description,
      memory: result.memory ? `${result.memory} KB` : null,
      time: result.time ? `${result.time} s` : null,
    };
  });

  const allPassed = detailedResults.every((result) => result.passed);
  const executedWithoutPlatformErrors = results.every(
    (result) => result.status.id === ACCEPTED_STATUS_ID
  );
  const status = allPassed
    ? "Accepted"
    : executedWithoutPlatformErrors
      ? "Wrong Answer"
      : determineSubmissionStatus(results);

  return {
    allPassed,
    status,
    detailedResults,
  };
};

export const getAllProblems = async () => {
  try {
    const authUser = await currentUser();
    const user = authUser ? await getCurrentUser() : null;

    const problems = user
      ? await db.problem.findMany({
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
        })
      : await db.problem.findMany({
          orderBy: {
            createdAt: "desc",
          },
        });

    return {
      success: true,
      data: problems.map((problem) => ({
        ...problem,
        solvedBy: problem.solvedBy || [],
      })),
    };
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

    if (!problem) {
      return { success: false, error: "Problem not found", data: null };
    }

    return { success: true, data: problem };
  } catch (error) {
    console.error("Error fetching problem:", error);
    return { success: false, error: "Failed to fetch problem", data: null };
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
  expectedOutputs
) => {
  try {
    const evaluation = await evaluateCodeAgainstTestCases({
      sourceCode,
      languageId,
      stdin,
      expectedOutputs,
    });

    return {
      success: true,
      status: evaluation.status,
      submission: buildSubmissionPreview({
        sourceCode,
        languageId,
        status: evaluation.status,
        stdin,
        detailedResults: evaluation.detailedResults,
      }),
    };
  } catch (error) {
    console.error("Error executing code:", error);
    return {
      success: false,
      error: error.message || "Failed to execute code",
    };
  }
};

export const submitCode = async (
  sourceCode,
  languageId,
  stdin,
  expectedOutputs,
  problemId
) => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: "Please sign in to submit solutions." };
    }

    const evaluation = await evaluateCodeAgainstTestCases({
      sourceCode,
      languageId,
      stdin,
      expectedOutputs,
    });

    const submission = await db.submission.create({
      data: {
        userId: user.id,
        problemId,
        sourceCode,
        language: getLanguageName(languageId),
        stdin: stdin.join("\n"),
        stdout: JSON.stringify(
          evaluation.detailedResults.map((result) => result.stdout)
        ),
        stderr: buildMetricPayload(evaluation.detailedResults, "stderr"),
        compileOutput: buildMetricPayload(
          evaluation.detailedResults,
          "compileOutput"
        ),
        status: evaluation.status,
        memory: buildMetricPayload(evaluation.detailedResults, "memory"),
        time: buildMetricPayload(evaluation.detailedResults, "time"),
      },
    });

    if (evaluation.allPassed) {
      await db.problemSolved.upsert({
        where: {
          userId_problemId: { userId: user.id, problemId },
        },
        update: {},
        create: { userId: user.id, problemId },
      });
    }

    await db.testCaseResult.createMany({
      data: evaluation.detailedResults.map((result) => ({
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
      })),
    });

    const submissionWithTestCases = await db.submission.findUnique({
      where: { id: submission.id },
      include: { testCases: true },
    });

    revalidatePath(`/problem/${problemId}`);
    revalidatePath("/profile");

    return { success: true, submission: submissionWithTestCases };
  } catch (error) {
    console.error("Error submitting code:", error);
    return {
      success: false,
      error: error.message || "Failed to submit code",
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
