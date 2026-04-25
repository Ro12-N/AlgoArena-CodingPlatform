import axios from "axios";

function getJudge0BaseUrl() {
  if (!process.env.JUDGE0_API_URL) {
    throw new Error(
      "JUDGE0_API_URL is not configured. Add it to enable code execution."
    );
  }

  return process.env.JUDGE0_API_URL;
}

export function getJudge0LanguageId(language) {
    const languageMap = {
        "PYTHON": 71,
        "JAVASCRIPT": 63,
        "JAVA": 62,
        "CPP": 54,
        "GO": 60,
    };
    return languageMap[language.toUpperCase()];
}

export function getLanguageName(languageId) {
    const LANGUAGE_NAMES = {
      74: "TypeScript",
      63: "JavaScript",
      71: "Python",
      62: "Java",
    };
    return LANGUAGE_NAMES[languageId] || "Unknown";
  }


export async function getJudge0Result(token) {
    let result;
    while (true) {
        const response = await axios.get(`${getJudge0BaseUrl()}/submissions/${token}`);
        result = response.data;
        if (result.status.id !== 1 && result.status.id !== 2) break;
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    return result;
}


export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Utility: split into chunks of max 20 for Judge0 batch
export function chunkArray(arr, size = 20) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

// Submit batch of submissions to Judge0
export async function submitBatch(submissions) {
  const { data } = await axios.post(
    `${getJudge0BaseUrl()}/submissions/batch?base64_encoded=false`,
    { submissions }
  );
  return data; 
}

// Poll all tokens until they are done
export async function pollBatchResults(tokens) {
  while (true) {
    const { data } = await axios.get(
      `${getJudge0BaseUrl()}/submissions/batch`,
      {
        params: {
          tokens: tokens.join(","),
          base64_encoded: false,
        },
      }
    );

    const results = data.submissions;

    const isAllDone = results.every(
      (r) => r.status.id !== 1 && r.status.id !== 2
    );
    if (isAllDone) return results;

    await sleep(1000);
  }
}
