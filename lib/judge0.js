import axios from "axios";

const DEFAULT_JUDGE0_API_URL = "https://ce.judge0.com";
const DEFAULT_RAPIDAPI_HOST = "judge0-ce.p.rapidapi.com";

function getJudge0BaseUrl() {
  if (process.env.JUDGE0_API_URL?.trim()) {
    return process.env.JUDGE0_API_URL.replace(/\/$/, "");
  }

  if (process.env.RAPIDAPI_KEY) {
    const host = process.env.RAPIDAPI_HOST || DEFAULT_RAPIDAPI_HOST;
    return `https://${host.replace(/^https?:\/\//, "")}`;
  }

  return DEFAULT_JUDGE0_API_URL;
}

function getJudge0Headers() {
  const headers = {
    "Content-Type": "application/json",
  };

  if (process.env.RAPIDAPI_KEY) {
    headers["x-rapidapi-key"] = process.env.RAPIDAPI_KEY;
    headers["x-rapidapi-host"] =
      process.env.RAPIDAPI_HOST || DEFAULT_RAPIDAPI_HOST;
  }

  if (process.env.JUDGE0_AUTH_TOKEN) {
    headers["X-Auth-Token"] = process.env.JUDGE0_AUTH_TOKEN;
  }

  return headers;
}

function isBatchBlockedError(error) {
  const status = error?.response?.status;
  return status === 403 || status === 401 || status === 405;
}

export function formatJudge0Error(error) {
  const status = error?.response?.status;

  if (status === 403 || status === 401) {
    if (process.env.RAPIDAPI_KEY) {
      return "Judge0 API rejected the request (403). Check RAPIDAPI_KEY and RAPIDAPI_HOST on Vercel.";
    }
    return "Judge0 blocked code execution (403). Add a free RAPIDAPI_KEY for Judge0 CE on Vercel — see .env.example.";
  }

  if (status === 429) {
    return "Judge0 rate limit exceeded. Wait a moment or add RAPIDAPI_KEY.";
  }

  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Judge0 request failed"
  );
}

export function getJudge0LanguageId(language) {
  const languageMap = {
    PYTHON: 71,
    JAVASCRIPT: 63,
    JAVA: 62,
    CPP: 54,
    GO: 60,
  };
  return languageMap[language.toUpperCase()];
}

export function getLanguageName(languageId) {
  const LANGUAGE_NAMES = {
    74: "TypeScript",
    63: "JavaScript",
    71: "Python",
    62: "Java",
    54: "C++",
    60: "Go",
  };
  return LANGUAGE_NAMES[languageId] || "Unknown";
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function chunkArray(arr, size = 20) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

async function createSubmission(submission, { wait = false } = {}) {
  const params = new URLSearchParams({ base64_encoded: "false" });
  if (wait) {
    params.set("wait", "true");
  }

  const { data } = await axios.post(
    `${getJudge0BaseUrl()}/submissions?${params.toString()}`,
    submission,
    {
      headers: getJudge0Headers(),
      timeout: wait ? 120000 : 30000,
    }
  );

  return data;
}

async function getSubmissionByToken(token) {
  const { data } = await axios.get(
    `${getJudge0BaseUrl()}/submissions/${token}`,
    {
      headers: getJudge0Headers(),
      params: { base64_encoded: "false" },
      timeout: 30000,
    }
  );
  return data;
}

async function waitForSubmission(token) {
  let result = await getSubmissionByToken(token);

  while (result.status.id === 1 || result.status.id === 2) {
    await sleep(1000);
    result = await getSubmissionByToken(token);
  }

  return result;
}

/** Run submissions one-by-one (works when public batch API returns 403). */
async function runSubmissionsSequential(submissions) {
  const results = [];

  for (const submission of submissions) {
    try {
      const created = await createSubmission(submission, { wait: true });
      results.push(created);
    } catch (error) {
      if (!isBatchBlockedError(error)) {
        throw error;
      }

      const created = await createSubmission(submission, { wait: false });
      const finished = await waitForSubmission(created.token);
      results.push(finished);
    }
  }

  return results;
}

export async function submitBatch(submissions) {
  try {
    const { data } = await axios.post(
      `${getJudge0BaseUrl()}/submissions/batch?base64_encoded=false`,
      { submissions },
      {
        headers: getJudge0Headers(),
        timeout: 60000,
      }
    );
    return data;
  } catch (error) {
    if (!isBatchBlockedError(error)) {
      throw error;
    }

    return submissions.map(() => null);
  }
}

export async function pollBatchResults(tokens) {
  try {
    while (true) {
      const { data } = await axios.get(
        `${getJudge0BaseUrl()}/submissions/batch`,
        {
          params: {
            tokens: tokens.join(","),
            base64_encoded: "false",
          },
          headers: getJudge0Headers(),
          timeout: 30000,
        }
      );

      const results = data.submissions;
      const isAllDone = results.every(
        (r) => r.status.id !== 1 && r.status.id !== 2
      );
      if (isAllDone) {
        return results;
      }

      await sleep(1000);
    }
  } catch (error) {
    if (!isBatchBlockedError(error)) {
      throw error;
    }

    const results = [];
    for (const token of tokens) {
      if (!token) {
        throw error;
      }
      results.push(await waitForSubmission(token));
    }
    return results;
  }
}

/**
 * Execute all submissions and return finished Judge0 results.
 * Uses batch API when allowed; falls back to single /submissions?wait=true.
 */
export async function runSubmissions(submissions) {
  if (!submissions?.length) {
    return [];
  }

  try {
    const batchResponse = await submitBatch(submissions);

    if (batchResponse.every((entry) => entry === null)) {
      return runSubmissionsSequential(submissions);
    }

    const tokens = batchResponse.map((result) => result.token);
    return await pollBatchResults(tokens);
  } catch (error) {
    if (isBatchBlockedError(error)) {
      return runSubmissionsSequential(submissions);
    }
    throw error;
  }
}

export async function getJudge0Result(token) {
  return waitForSubmission(token);
}
