type LeetCodeQuestionTag = {
  name: string;
  slug: string;
};

export type LeetCodeQuestion = {
  acRate: number;
  difficulty: "Easy" | "Medium" | "Hard";
  frontendQuestionId: string;
  paidOnly: boolean;
  title: string;
  titleSlug: string;
  topicTags: LeetCodeQuestionTag[];
};

type FetchLeetCodeQuestionsInput = {
  query?: string;
  limit?: number;
};

type ProblemsetQuestionListResponse = {
  problemsetQuestionList: {
    total: number;
    questions: LeetCodeQuestion[];
  };
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";
const MAX_QUERY_LIMIT = 100;

const PROBLEMSET_QUERY = `
  query problemsetQuestionList(
    $categorySlug: String
    $limit: Int
    $skip: Int
    $filters: QuestionListFilterInput
  ) {
    problemsetQuestionList: questionList(
      categorySlug: $categorySlug
      limit: $limit
      skip: $skip
      filters: $filters
    ) {
      total: totalNum
      questions: data {
        acRate
        difficulty
        frontendQuestionId: questionFrontendId
        paidOnly: isPaidOnly
        title
        titleSlug
        topicTags {
          name
          slug
        }
      }
    }
  }
`;

function clampLimit(limit: number): number {
  if (!Number.isFinite(limit)) {
    return 25;
  }

  return Math.min(Math.max(Math.floor(limit), 1), MAX_QUERY_LIMIT);
}

async function executeLeetCodeQuery<T>(variables: Record<string, unknown>): Promise<T> {
  const response = await fetch(LEETCODE_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Referer: "https://leetcode.com/problemset/",
    },
    cache: "no-store",
    body: JSON.stringify({
      query: PROBLEMSET_QUERY,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`LeetCode request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as GraphQLResponse<T>;

  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message ?? "LeetCode GraphQL error.");
  }

  if (!payload.data) {
    throw new Error("LeetCode response had no data.");
  }

  return payload.data;
}

function sortByNewestQuestionId(questions: LeetCodeQuestion[]): LeetCodeQuestion[] {
  return [...questions].sort((a, b) => {
    const aId = Number.parseInt(a.frontendQuestionId, 10);
    const bId = Number.parseInt(b.frontendQuestionId, 10);

    if (Number.isNaN(aId) && Number.isNaN(bId)) {
      return a.frontendQuestionId.localeCompare(b.frontendQuestionId);
    }

    if (Number.isNaN(aId)) {
      return 1;
    }

    if (Number.isNaN(bId)) {
      return -1;
    }

    return bId - aId;
  });
}

async function getLatestLeetCodeQuestions(limit: number): Promise<LeetCodeQuestion[]> {
  const totalData = await executeLeetCodeQuery<ProblemsetQuestionListResponse>({
    categorySlug: "",
    limit: 1,
    skip: 0,
    filters: {},
  });

  const total = totalData.problemsetQuestionList.total;
  const skip = Math.max(total - limit, 0);

  const questionsData = await executeLeetCodeQuery<ProblemsetQuestionListResponse>({
    categorySlug: "",
    limit,
    skip,
    filters: {},
  });

  return sortByNewestQuestionId(questionsData.problemsetQuestionList.questions);
}

async function searchLeetCodeQuestions(query: string, limit: number): Promise<LeetCodeQuestion[]> {
  const questionsData = await executeLeetCodeQuery<ProblemsetQuestionListResponse>({
    categorySlug: "",
    limit,
    skip: 0,
    filters: {
      searchKeywords: query,
    },
  });

  return questionsData.problemsetQuestionList.questions;
}

export async function fetchLeetCodeQuestions(
  input: FetchLeetCodeQuestionsInput = {},
): Promise<LeetCodeQuestion[]> {
  const query = input.query?.trim() ?? "";
  const limit = clampLimit(input.limit ?? 25);

  if (query.length > 0) {
    return searchLeetCodeQuestions(query, limit);
  }

  return getLatestLeetCodeQuestions(limit);
}