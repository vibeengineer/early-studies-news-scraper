import pLimit from "p-limit";
import { parseSerperDate } from "../../utils/date/parsers";
import { datesToTbsString, getGeoParams } from "../../utils/date/search-params";
import { fetchAllPagesForUrl } from "./serper/fetchAllPages";

export async function fetchHeadlines(
  { database, serperApiKey }: { database: string; serperApiKey: string },
  {
    startDate,
    endDate,
    region,
    publicationUrls,
    maxQueriesPerPublication,
    flattenResults,
  }: {
    startDate: string;
    endDate: string;
    region: "US" | "UK";
    publicationUrls: string[];
    maxQueriesPerPublication: number;
    flattenResults: boolean;
  }
) {
  // Convert dates to TBS format for Serper API
  const tbs = datesToTbsString(startDate, endDate);
  const geoParams = getGeoParams(region);

  // Create concurrency limiter for parallel fetching
  const fetchLimit = pLimit(10);

  // Fetch headlines from all publication URLs in parallel
  const fetchPromises = publicationUrls.map((url) =>
    fetchLimit(() =>
      fetchAllPagesForUrl(
        url,
        tbs,
        geoParams,
        serperApiKey,
        maxQueriesPerPublication,
        // TODO: Add logger
        console
      )
    )
  );

  const rawResults = await Promise.all(fetchPromises);

  // Transform results into the expected format
  const results = rawResults.map((result) => {
    if (result.error) {
      return {
        status: "rejected" as const,
        url: result.url,
        queriesMade: result.queriesMade,
        creditsConsumed: result.credits,
        results: [],
        reason: result.error.message,
      };
    }

    // Transform and filter results by date range
    const transformedResults = result.results
      .map((item) => {
        const parsedDate = parseSerperDate(item.date);
        return {
          headline: item.title,
          publicationUrl: result.url,
          url: item.link,
          snippet: item.snippet ?? null,
          source: item.source,
          rawDate: item.date ?? null,
          normalizedDate: parsedDate
            ? parsedDate.toLocaleDateString("en-GB")
            : undefined,
        };
      })
      .filter((item) => {
        // Apply date filtering with a 2-day buffer
        if (!item.normalizedDate) return false;

        const parts = item.normalizedDate.split("/");
        if (parts.length !== 3) return false;

        const day = Number.parseInt(parts[0], 10);
        const month = Number.parseInt(parts[1], 10) - 1;
        const year = Number.parseInt(parts[2], 10);
        const itemDate = new Date(year, month, day);

        const startParts = startDate.split("/").map(Number);
        const endParts = endDate.split("/").map(Number);

        const bufferDays = 2;
        const startDateWithBuffer = new Date(
          startParts[2],
          startParts[1] - 1,
          startParts[0] - bufferDays
        );
        const endDateWithBuffer = new Date(
          endParts[2],
          endParts[1] - 1,
          endParts[0] + bufferDays
        );

        return itemDate >= startDateWithBuffer && itemDate <= endDateWithBuffer;
      });

    return {
      status: "fulfilled" as const,
      url: result.url,
      queriesMade: result.queriesMade,
      creditsConsumed: result.credits,
      results: transformedResults,
    };
  });

  // Calculate summary
  const totalResults = results.reduce(
    (acc, curr) =>
      acc + (curr.status === "fulfilled" ? curr.results.length : 0),
    0
  );
  const totalCreditsConsumed = results.reduce(
    (acc, curr) => acc + curr.creditsConsumed,
    0
  );
  const totalQueriesMade = results.reduce(
    (acc, curr) => acc + curr.queriesMade,
    0
  );
  const successCount = results.filter((r) => r.status === "fulfilled").length;
  const failureCount = results.filter((r) => r.status === "rejected").length;

  const summary = {
    totalResults,
    totalCreditsConsumed,
    totalQueriesMade,
    successCount,
    failureCount,
  };

  // Handle flattenResults option
  const finalResults = flattenResults
    ? results.flatMap((r) => (r.status === "fulfilled" ? r.results : []))
    : results;

  return {
    results: finalResults,
    summary,
  };
}
