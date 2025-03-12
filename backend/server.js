require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const NodeCache = require("node-cache");

const app = express();
const port = process.env.PORT || 5000;
const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

app.use(cors());
app.use(express.json());

// GET /api/wallpapers endpoint
app.get("/api/wallpapers", async (req, res) => {
  const query = req.query.query || "random";
  const page = req.query.page || 1;
  const cacheKey = `wallpapers_${query}_${page}`;

  if (cache.has(cacheKey)) {
    return res.json(cache.get(cacheKey));
  }

  try {
    let pexelsPhotos = [];
    let unsplashPhotos = [];
    let nasaPhotos = [];
    // Fetch from Pexels
    try {
      const pexelsRes = await axios.get(
        `https://api.pexels.com/v1/search?query=${query}&per_page=10&page=${page}`,
        { headers: { Authorization: process.env.PEXELS_API_KEY } }
      );
      pexelsPhotos = pexelsRes.data.photos.map(photo => ({
        id: photo.id,
        url: photo.src.medium,
        photographer: photo.photographer,
        source: "Pexels",
      }));
    } catch (error) {
      console.error("Error fetching from Pexels:", error.message);
    }
    console.log(page);
    // Fetch from Unsplash
    try {
      const unsplashRes = await axios.get(
        `https://api.unsplash.com/search/photos?query=${query}&per_page=10&page=${page}&client_id=${process.env.UNSPLASH_ACCESS_KEY}`
        //`https://api.unsplash.com/photos/random?query=${query}&count=10&client_id=${process.env.UNSPLASH_ACCESS_KEY}`
      );
      unsplashPhotos = unsplashRes.data.results.map(photo => ({
        id: photo.id,
        url: photo.urls.small,
        photographer: photo.user.name,
        source: "Unsplash",
      }));
      console.log(unsplashPhotos);
    } catch (error) {
      console.error("Error fetching from Unsplash:", error.message);
    }

    // Fetch random NASA wallpapers
    try {
      const nasaRes = await axios.get(
        `https://api.nasa.gov/planetary/apod?api_key=${process.env.NASA_API_KEY}&count=5`
      );
      nasaPhotos = nasaRes.data.map(photo => ({
        id: photo.date,
        url: photo.url,
        photographer: "NASA",
        source: "NASA",
      }));
    } catch (error) {
      console.error("Error fetching from NASA:", error.message);
    }

    // Combine results
    const wallpapers = [...pexelsPhotos, ...unsplashPhotos, ...nasaPhotos];

    if (wallpapers.length === 0) {
      return res
        .status(404)
        .json({ error: "No wallpapers found from any source" });
    }
    cache.set(cacheKey, wallpapers);
    res.json(wallpapers);
  } catch (error) {
    console.error("Error in wallpapers endpoint:", error);
    res.status(500).json({ error: "Failed to fetch wallpapers" });
  }
});

// POST /api/recommend endpoint for AI suggestions
app.post("/api/recommend", async (req, res) => {
  const { userQuery } = req.body;
  try {
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/OpenAssistant/oasst-sft-1-pythia-12b",
      {
        inputs: `Generate one new wallpaper theme word related to ${userQuery} in just one word different from ${userQuery}.`,
        options: { wait_for_model: true },
      },
      {
        headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` },
      }
    );
    console.log(
      `List one creative wallpaper theme like ${userQuery} in just one word different from ${userQuery}.`
    );
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching recommendation:", error);
    res.status(500).json({ error: "Failed to get recommendation" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
