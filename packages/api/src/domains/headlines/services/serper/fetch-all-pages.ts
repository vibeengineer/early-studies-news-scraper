import pLimit from "p-limit";
import type { Logger } from "pino";
import type {
  FetchAllPagesResult,
  GeoParams,
  SerperNewsItem,
  SerperNewsResult,
} from "@/schema";
import { fetchSerperPage } from "./client";
import { config } from "./config";

// Create a concurrency limiter for parallel processing of multiple publications
export const publicationLimit = pLimit(config.concurrencyLimit);

type FetchAllPagesOptions = {
  url: string;
  tbs: string;
  geoParams: GeoParams;
  apiKey: string;
  maxQueriesForThisUrl: number;
  logger: Logger;
};

/**
 * Extracts the site query from a URL
 */
function extractSiteQuery(
  url: string
): { siteQuery: string } | { error: Error } {
  try {
    return { siteQuery: `site:${new URL(url).hostname}` };
  } catch {
    return { error: new Error(`Invalid URL format: ${url}`) };
  }
}

/**
 * Processes page results, tracking duplicates and returning new unique items
 */
function processPageResults(
  news: SerperNewsItem[],
  seenUrls: Set<string>
): { newResults: SerperNewsItem[]; duplicateCount: number } {
  const newResults: SerperNewsItem[] = [];
  let duplicateCount = 0;

  for (const item of news) {
    if (seenUrls.has(item.link)) {
      duplicateCount += 1;
    } else {
      seenUrls.add(item.link);
      newResults.push(item);
    }
  }

  return { newResults, duplicateCount };
}

/**
 * Determines if fetching should stop based on duplicate threshold
 */
function shouldStopDueToDuplicates(
  duplicateCount: number,
  totalCount: number,
  threshold = 50
): boolean {
  if (totalCount === 0) {
    return false;
  }
  return (duplicateCount / totalCount) * 100 > threshold;
}

/**
 * Fetches all relevant pages of news results for a single publication URL,
 * respecting query and credit limits.
 */
export async function fetchAllPagesForUrl({
  url,
  tbs,
  geoParams,
  apiKey,
  maxQueriesForThisUrl,
  logger,
}: FetchAllPagesOptions): Promise<FetchAllPagesResult> {
  const urlLogger = logger.child({ publicationUrl: url });

  const siteQueryResult = extractSiteQuery(url);
  if ("error" in siteQueryResult) {
    urlLogger.error(
      { err: siteQueryResult.error },
      "Invalid URL format provided"
    );
    return {
      url,
      queriesMade: 0,
      credits: 0,
      results: [],
      tbsParams: tbs,
      error: siteQueryResult.error,
    };
  }

  const { siteQuery } = siteQueryResult;

  urlLogger.info(
    { maxQueries: maxQueriesForThisUrl },
    "Starting iterative fetch for URL"
  );

  let queriesMade = 0;
  let totalCredits = 0;
  const aggregatedResults: SerperNewsItem[] = [];
  const seenUrls = new Set<string>();
  let currentPage = 1;

  while (
    currentPage <= maxQueriesForThisUrl &&
    queriesMade < maxQueriesForThisUrl
  ) {
    const pageLogger = urlLogger.child({ page: currentPage });

    let pageResult: SerperNewsResult;
    try {
      pageLogger.info("Fetching page (credit reserved)");
      pageResult = await fetchSerperPage({
        siteQuery,
        tbs,
        geoParams,
        apiKey,
        page: currentPage,
        logger: pageLogger,
      });
    } catch (error: unknown) {
      pageLogger.error(
        { err: error },
        "Failed to fetch page after retries. Stopping fetch for this URL."
      );
      return {
        url,
        queriesMade,
        credits: totalCredits,
        results: aggregatedResults,
        tbsParams: tbs,
        error: error as Error,
      };
    }

    queriesMade += 1;
    totalCredits += pageResult.credits;

    const newsCount = pageResult.news?.length ?? 0;
    pageLogger.info(
      {
        resultsFound: newsCount,
        creditsUsed: pageResult.credits,
        page: currentPage,
        totalResultsSoFar: aggregatedResults.length,
      },
      "Page fetch successful."
    );

    if (newsCount === 0) {
      pageLogger.info(
        `STOPPING: Found 0 results on page ${currentPage}. Total: ${aggregatedResults.length}.`
      );
      break;
    }

    const { newResults, duplicateCount } = processPageResults(
      pageResult.news,
      seenUrls
    );

    if (shouldStopDueToDuplicates(duplicateCount, newsCount)) {
      pageLogger.info(
        `STOPPING: High duplicate rate (${duplicateCount}/${newsCount}) on page ${currentPage}.`
      );
      aggregatedResults.push(...newResults);
      break;
    }

    aggregatedResults.push(...newResults);

    if (aggregatedResults.length >= config.maxResultsPerPublication) {
      pageLogger.warn(
        `STOPPING: Reached max results limit (${config.maxResultsPerPublication}).`
      );
      break;
    }

    currentPage += 1;
  }

  urlLogger.info(
    { queriesMade, totalResults: aggregatedResults.length, totalCredits },
    "Finished fetching for URL."
  );
  return {
    url,
    queriesMade,
    credits: totalCredits,
    results: aggregatedResults,
    tbsParams: tbs,
  };
}
