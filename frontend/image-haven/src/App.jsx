import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import Topbar from "./Topbar";

function App() {
  const [wallpapers, setWallpapers] = useState([]);
  const [highlightedWallpapers, setHighlightedWallpapers] = useState([]);
  const [query, setQuery] = useState("random");
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState("");
  const [page, setPage] = useState(1);
  const [searchHistory, setSearchHistory] = useState([]);
  const [activeWallpaper, setActiveWallpaper] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const loader = useRef(null);

  // Function to fetch wallpapers for the main grid
  const fetchWallpapers = useCallback(
    async (searchQuery, pageNumber = 1, append = false) => {
      setLoading(true);
      try {
        const res = await axios.get(
          `http://localhost:5000/api/wallpapers?query=${searchQuery}&page=${pageNumber}`
        );
        setWallpapers(prev => (append ? [...prev, ...res.data] : res.data));
      } catch (error) {
        console.error("Error fetching wallpapers:", error);
      }
      setLoading(false);
    },
    []
  );

  // Function to fetch highlighted wallpapers for the recommended theme
  const fetchHighlightedWallpapers = async theme => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/wallpapers?query=${theme}&page=1`
      );
      setHighlightedWallpapers(res.data);
    } catch (error) {
      console.error("Error fetching highlighted wallpapers:", error);
    }
  };

  // Fetch wallpapers when query or page changes
  useEffect(() => {
    fetchWallpapers(query, page, page > 1);
  }, [query, page, fetchWallpapers]);

  // Infinite scroll setup using Intersection Observer
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "20px",
      threshold: 1.0,
    };
    const observer = new IntersectionObserver(entries => {
      const target = entries[0];
      if (target.isIntersecting && !loading) {
        setPage(prevPage => prevPage + 1);
      }
    }, options);
    if (loader.current) {
      observer.observe(loader.current);
    }
    return () => {
      if (loader.current) observer.unobserve(loader.current);
    };
  }, [loading]);

  // Handle search: update history and fetch wallpapers
  const handleSearch = e => {
    e.preventDefault();
    setSearchHistory(prev => (prev.includes(query) ? prev : [...prev, query]));
    setPage(1);
    fetchWallpapers(query, 1, false);
  };

  // Toggle favorite based on wallpaper URL
  const toggleFavorite = wallpaper => {
    setFavorites(prev =>
      prev.includes(wallpaper.url)
        ? prev.filter(url => url !== wallpaper.url)
        : [...prev, wallpaper.url]
    );
  };

  // Get AI suggestion using combined search history and fetch highlighted images
  const getRecommendation = async () => {
    try {
      const combinedSearchTerms =
        searchHistory.length > 0 ? searchHistory.join(", ") : query;
      const res = await axios.post("http://localhost:5000/api/recommend", {
        userQuery: combinedSearchTerms,
      });
      const newTheme =
        res.data[0]?.generated_text || "No recommendation available.";
      setRecommendation(newTheme);
      if (newTheme && newTheme !== "No recommendation available.") {
        fetchHighlightedWallpapers(newTheme);
      }
    } catch (error) {
      console.error("Error fetching recommendation:", error);
    }
  };

  // When a wallpaper card is clicked, open the modal
  const handleCardClick = wallpaper => {
    setActiveWallpaper(wallpaper);
  };

  const closeModal = () => {
    setActiveWallpaper(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Topbar />
      <div className="p-4">
        <div className="max-w-5xl mx-auto">
          <form
            className="flex flex-col sm:flex-row justify-center items-center gap-4"
            onSubmit={handleSearch}
          >
            <input
              type="text"
              placeholder="Search wallpapers..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="px-4 py-2 w-full sm:w-1/2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none"
            >
              Search
            </button>
            <button
              type="button"
              onClick={getRecommendation}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none"
            >
              Get AI Suggestion
            </button>
          </form>
          {searchHistory.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Previous Searches:</h3>
              <ul>
                {searchHistory.map((term, index) => (
                  <li key={index} className="text-gray-600">
                    {term}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {recommendation && (
            <div className="mt-4 p-4 bg-white rounded shadow-md">
              <h2 className="text-xl font-semibold text-gray-700">
                AI Recommendation
              </h2>
              <p className="mt-2 text-gray-600">{recommendation}</p>
            </div>
          )}
        </div>
        {/* Highlighted Wallpapers Section */}
        {highlightedWallpapers.length > 0 && (
          <section className="mt-8 max-w-5xl mx-auto p-4 bg-yellow-50 border-2 border-yellow-400 rounded">
            <h2 className="text-2xl font-bold text-yellow-800 mb-4">
              Highlighted Wallpapers from Recommended Theme
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {highlightedWallpapers.map((wallpaper, index) => (
                <div
                  key={index}
                  className="relative group rounded-lg shadow-lg overflow-hidden cursor-pointer transform transition duration-300 hover:scale-105"
                  onClick={() => handleCardClick(wallpaper)}
                >
                  <img
                    src={wallpaper.url}
                    alt="Highlighted Wallpaper"
                    className="w-full h-48 object-cover"
                  />
                  {/* Overlay: text at the bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-60 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white text-sm">
                      <strong>{wallpaper.source}</strong>
                    </p>
                    <p className="text-white text-xs">
                      {wallpaper.photographer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        {/* Normal Wallpapers Section */}
        <main className="mt-8 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {wallpapers.map((wallpaper, index) => (
              <div
                key={index}
                className="relative group rounded-lg shadow-lg overflow-hidden cursor-pointer transform transition duration-300 hover:scale-105"
                onClick={() => handleCardClick(wallpaper)}
              >
                <img
                  src={wallpaper.url}
                  alt="Wallpaper"
                  className="w-full h-48 object-cover"
                />
                {/* Overlay: text at the bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-60 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-white text-sm">
                    <strong>{wallpaper.source}</strong>
                  </p>
                  <p className="text-white text-xs">{wallpaper.photographer}</p>
                </div>
              </div>
            ))}
          </div>
          {loading && (
            <p className="text-center text-gray-600 mt-4">
              Loading more wallpapers...
            </p>
          )}
          <div ref={loader} />
        </main>
      </div>
      {/* Modal: Opens on clicking a wallpaper card */}
      {activeWallpaper && (
        <WallpaperModal
          wallpaper={activeWallpaper}
          onClose={closeModal}
          isFavorite={favorites.includes(activeWallpaper.url)}
          toggleFavorite={toggleFavorite}
        />
      )}
    </div>
  );
}

// Modal Component with transparent background and black gradient border
const WallpaperModal = ({ wallpaper, onClose, isFavorite, toggleFavorite }) => {
  const fullImageUrl = wallpaper.url.includes("?")
    ? wallpaper.url.split("?")[0]
    : wallpaper.url;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 transition-opacity duration-500 ease-in-out">
      <div
        className="relative max-w-4xl w-full p-2 rounded-lg overflow-hidden transform transition-all duration-500 ease-in-out"
        style={{
          border: "2px solid transparent",
          borderImage: "linear-gradient(135deg, #000, #444) 1",
          backgroundColor: "transparent",
        }}
      >
        <div className="bg-transparent rounded-lg overflow-hidden">
          {/* Improved Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-300 text-3xl font-bold z-10"
          >
            &times;
          </button>
          {/* Image covering most of modal while preserving aspect ratio */}
          <img
            src={fullImageUrl}
            alt="Enlarged Wallpaper"
            className="w-full h-auto max-h-[90vh] object-contain"
          />
          {/* Overlay for details */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
            <div className="flex items-center justify-between">
              <a
                href={wallpaper.source}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-500 text-white rounded-md shadow hover:bg-blue-600 transition duration-300 font-semibold"
              >
                View Source
              </a>
              <button
                className="px-6 py-3 bg-gradient-to-r from-red-400 to-red-600 text-white rounded-full shadow-lg hover:scale-105 transition transform duration-300 font-semibold"
                onClick={() => toggleFavorite(wallpaper)}
              >
                {isFavorite ? "Unfavorite" : "Favorite"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
