import { MediaType } from "@/pages/HomePage";

export async function searchMedia(
  query: string,
  type: MediaType,
  count: number
) {
  const maxResultsPerCall = 10;
  const numberOfCalls = Math.ceil(count / maxResultsPerCall);
  const results = [];

  try {
    for (let i = 0; i < numberOfCalls; i++) {
      const start = i * maxResultsPerCall + 1;

      const response = await fetch(`/api/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          searchType: type,
          count: Math.min(maxResultsPerCall, count - i * maxResultsPerCall),
          start,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch results (page ${i + 1})`);
      }

      const data = await response.json();
      results.push(...(data.items || []));

      if (!data.items || data.items.length === 0 || results.length >= count) {
        break;
      }
    }

    return {
      items: results.slice(0, count),
      searchInformation: {
        totalResults: results.length,
      },
    };
  } catch (error) {
    console.error("Search error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to fetch results");
  }
}
