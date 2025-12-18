import pLimit from "p-limit";
import type { Logger } from "pino";
import type {
  FetchAllPagesResult,
  GeoParams,
  SerperNewsItem,
} from "../../../schema";
import { fetchSerperPage } from "./client";
import { config } from "./config";

// Create a concurrency limiter for parallel processing of multiple publications
export const publicationLimit = pLimit(config.concurrencyLimit);

/**
 * Fetches all relevant pages of news results for a single publication URL,
 * respecting query and credit limits.
 *
 * @param url - The publication URL to search within.
 * @param tbs - The time range parameter string.
 * @param geoParams - Geographical parameters ({ gl, location }).
 * @param apiKey - The Serper API key.
 * @param maxQueriesForThisUrl - Maximum number of pages to fetch for this specific URL.
 * @param logger - Pino logger instance for contextual logging.
 * @returns A Promise resolving to a FetchAllPagesResult object.
 */
export async function fetchAllPagesForUrl(
  url: string,
  tbs: string,
  geoParams: GeoParams,
  apiKey: string,
  maxQueriesForThisUrl: number,
  logger: Logger
): Promise<FetchAllPagesResult> {
  const urlLogger = logger.child({ publicationUrl: url });
  let siteQuery: string;

  try {
    // Extract hostname robustly
    siteQuery = `site:${new URL(url).hostname}`;
  } catch (e: unknown) {
    urlLogger.error({ err: e }, "Invalid URL format provided");
    return {
      url,
      queriesMade: 0,
      credits: 0,
      results: [],
      tbsParams: tbs,
      error: new Error(`Invalid URL format: ${url}`),
    };
  }

  urlLogger.info(
    { maxQueries: maxQueriesForThisUrl },
    "Starting iterative fetch for URL"
  );

  let queriesMade = 0;
  let totalCredits = 0;
  const aggregatedResults: SerperNewsItem[] = [];
  const seenUrls = new Set<string>(); // Track seen URLs to detect duplicates

  // Sequential fetch approach to respect stopping conditions
  let currentPage = 1;

  while (currentPage <= maxQueriesForThisUrl) {
    // 1. Check per-URL query limit
    if (queriesMade >= maxQueriesForThisUrl) {
      urlLogger.info(
        { queriesMade },
        "Reached max queries limit for this URL. Stopping."
      );
      break;
    }

    const pageLogger = urlLogger.child({ page: currentPage });
    try {
      pageLogger.info("Fetching page (credit reserved)");
      const pageResult = await fetchSerperPage(
        siteQuery,
        tbs,
        geoParams,
        apiKey,
        currentPage,
        pageLogger
      );

      queriesMade++;
      totalCredits += pageResult.credits;

      const newsCount = pageResult.news?.length ?? 0;
      pageLogger.info(
        {
          resultsFound: newsCount,
          creditsUsed: pageResult.credits,
          requestedResults: config.resultsPerPage,
          page: currentPage,
          siteQuery,
          totalResultsSoFar: aggregatedResults.length,
        },
        "Page fetch successful."
      );

      // Check stopping condition: no results
      if (newsCount === 0) {
        pageLogger.info(
          `STOPPING FETCHES: Found 0 results on page ${currentPage}. Total results fetched: ${aggregatedResults.length}.`
        );
        break;
      }

      // Process results and check for duplicates
      if (newsCount > 0) {
        let duplicatesOnPage = 0;
        const newResults: SerperNewsItem[] = [];

        for (const item of pageResult.news) {
          const itemUrl = item.link;
          if (seenUrls.has(itemUrl)) {
            duplicatesOnPage++;
          } else {
            seenUrls.add(itemUrl);
            newResults.push(item);
          }
        }

        // Check if >50% of results on this page are duplicates
        const duplicatePercentage = (duplicatesOnPage / newsCount) * 100;
        if (duplicatePercentage > 50) {
          pageLogger.info(
            `STOPPING FETCHES: Found ${duplicatePercentage.toFixed(
              1
            )}% duplicates (${duplicatesOnPage}/${newsCount}) on page ${currentPage}. Total unique results fetched: ${
              aggregatedResults.length + newResults.length
            }.`
          );
          // Still add the new results before stopping
          aggregatedResults.push(...newResults);
          break;
        }

        aggregatedResults.push(...newResults);

        pageLogger.debug(
          {
            duplicatesOnPage,
            newResultsOnPage: newResults.length,
            duplicatePercentage: duplicatePercentage.toFixed(1),
            totalUniqueResults: aggregatedResults.length,
          },
          "Processed page results"
        );

        // Add safety check for maximum results per publication
        if (aggregatedResults.length >= config.maxResultsPerPublication) {
          pageLogger.warn(
            `STOPPING FETCHES: Reached maximum results limit (${aggregatedResults.length}/${config.maxResultsPerPublication}) for this publication.`
          );
          break;
        }
      }

      currentPage++;
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
