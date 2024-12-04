import dotenv from "dotenv";
import type { Express } from "express";
import fetch from "node-fetch";
import ytdl from "ytdl-core";

dotenv.config();

interface GoogleSearchResponse {
  items?: Array<{
    link: string;
    title: string;
    image?: {
      thumbnailLink?: string;
    };
    pagemap?: {
      videoobject?: Array<{ thumbnailurl?: string }>;
      cse_image?: Array<{ src: string }>;
      cse_thumbnail?: Array<{ src: string }>;
    };
  }>;
  [key: string]: any;
}

interface GoogleApiError {
  error?: {
    message?: string;
  };
}

export function registerRoutes(app: Express) {
  app.post("/api/search", async (req, res) => {
    try {
      const { query, searchType, count, start = 1 } = req.body;

      if (!["images", "videos", "both"].includes(searchType)) {
        return res.status(400).json({ error: "Invalid searchType" });
      }
      
      // Helper function to fetch results with specific params
      const fetchResults = async (params: URLSearchParams) => {
        const response = await fetch(
          `https://www.googleapis.com/customsearch/v1?${params}`
        );

        if (!response.ok) {
          const errorData = (await response.json()) as GoogleApiError;
          throw new Error(errorData.error?.message || "Failed to fetch from Google API");
        }

        const data = (await response.json()) as GoogleSearchResponse;
        return data.items || [];
      };

      const paramsBase = new URLSearchParams({
        key: process.env.GOOGLE_API_KEY!,
        cx: process.env.SEARCH_ENGINE_ID!,
        q: query,
        num: count.toString(),
        start: start.toString(),
      });

      let results: GoogleSearchResponse["items"] = [];

      if (searchType === "images") {
        paramsBase.append("searchType", "image");
        results = await fetchResults(paramsBase);
      } else if (searchType === "videos") {
        paramsBase.append("fileType", "mp4,avi,mov,wmv");
        paramsBase.append("hq", "videos");
        paramsBase.append("type", "video");
        results = await fetchResults(paramsBase);
      } else if (searchType === "both") {
        // Fetch images and videos separately
        const imageParams = new URLSearchParams(paramsBase);
        imageParams.append("searchType", "image");

        const videoParams = new URLSearchParams(paramsBase);
        videoParams.append("fileType", "mp4,avi,mov,wmv");
        videoParams.append("hq", "videos");
        videoParams.append("type", "video");

        const [imageResults, videoResults] = await Promise.all([
          fetchResults(imageParams),
          fetchResults(videoParams),
        ]);

        // Interleave the results
        const mixedResults = [];
        let i = 0;
        while (mixedResults.length < count && (imageResults[i] || videoResults[i])) {
          if (imageResults[i]) mixedResults.push(imageResults[i]);
          if (videoResults[i]) mixedResults.push(videoResults[i]);
          i++;
        }
        results = mixedResults.slice(0, count);
      }

      // Enhance results with thumbnails and metadata
      const enhancedItems = results.map((item) => {
        const videoObject = item.pagemap?.videoobject?.[0];
        const cseImage = item.pagemap?.cse_image?.[0]?.src;
        const cseThumbnail = item.pagemap?.cse_thumbnail?.[0]?.src;
        const imageThumbnail = item.image?.thumbnailLink;

        const youtubeId = item.link.includes("youtube.com")
          ? item.link.split("v=")[1]?.split("&")[0]
          : null;

        const isVideo = Boolean(videoObject);
        const thumbnailUrl = isVideo
          ? videoObject?.thumbnailurl ||
            cseThumbnail ||
            cseImage ||
            (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : null)
          : cseImage || cseThumbnail || imageThumbnail || "/placeholder.png";

        return {
          title: item.title,
          link: item.link, // Original link (source)
          thumbnailUrl,
          sourceLink: item.link, // Link to the source webpage
          downloadLink: isVideo ? item.link : cseImage || cseThumbnail || item.link, // Direct download URL
          isVideo,
        };
      });

      res.json({
        items: enhancedItems,
      });
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to perform search",
      });
    }
  });

  app.get("/api/download", async (req, res) => {
    try {
      const { url } = req.query;
      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "URL is required" });
      }

      const isYouTubeUrl = url.includes("youtube.com") || url.includes("youtu.be");

      if (isYouTubeUrl) {
        const info = await ytdl.getInfo(url);
        const formats = info.formats.filter((f) => f.hasVideo && f.hasAudio);

        if (formats.length === 0) {
          throw new Error("No suitable video format found with both video and audio");
        }

        const format = ytdl.chooseFormat(formats, { quality: "highestvideo" });

        res.setHeader("Content-Type", "video/mp4");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${info.videoDetails.title.replace(/[^a-z0-9]/gi, "_")}.mp4"`
        );

        ytdl(url, { format }).pipe(res);
      } else {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch file");
        }

        const contentType =
          response.headers.get("content-type") || "application/octet-stream";
        res.setHeader("Content-Type", contentType);
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${url.split("/").pop() || "download"}"`
        );

        if (response.body) {
          response.body.pipe(res);
        } else {
          throw new Error("No response body available");
        }
      }
    } catch (error) {
      console.error("Download error details:", {
        url: req.query.url,
        isYouTube: req.query.url?.toString().includes("youtube.com") || req.query.url?.toString().includes("youtu.be"),
        error: error instanceof Error ? error.message : error,
      });
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to download file",
      });
    }
  });
}
