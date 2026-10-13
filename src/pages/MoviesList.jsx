import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getStoredMovies } from "../data/mockData";
import MovieCard from "../components/MovieCard";
import "./MoviesList.css";

const MoviesList = () => {
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const [filter, setFilter] = useState("all"); // all, showing, upcoming
  const [genreFilter, setGenreFilter] = useState("all");
  const [moviesList, setMoviesList] = useState(getStoredMovies);

  useEffect(() => {
    const handleMovies = () => setMoviesList(getStoredMovies());
    window.addEventListener("moviesChange", handleMovies);
    return () => window.removeEventListener("moviesChange", handleMovies);
  }, []);

  const genres = [
    ...new Set(
      moviesList.flatMap((movie) => {
        if (Array.isArray(movie.genre)) return movie.genre;
        return (movie.genre || "").split(", ").filter(Boolean);
      })
    ),
  ].sort();

  const filteredMovies = moviesList.filter((m) => {
    const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || m.status === filter;
    const genreStr = Array.isArray(m.genre) ? m.genre.join(", ") : m.genre || "";
    const matchesGenre = genreFilter === "all" || genreStr.includes(genreFilter);
    return matchesSearch && matchesFilter && matchesGenre;
  });

  return (
    <div className="movies-page container">
      <div className="movies-header">
        <h1 className="page-title">
          {search ? `Kết quả tìm kiếm cho "${search}"` : "Danh Sách Phim"}
        </h1>

        <div className="filters-toolbar">
          <div className="filter-group">
            <button
              className={`filter-btn ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              Tất cả
            </button>
            <button
              className={`filter-btn ${filter === "showing" ? "active" : ""}`}
              onClick={() => setFilter("showing")}
            >
              Đang chiếu
            </button>
            <button
              className={`filter-btn ${filter === "upcoming" ? "active" : ""}`}
              onClick={() => setFilter("upcoming")}
            >
              Sắp chiếu
            </button>
          </div>

          <div className="genre-filter" aria-label="Lọc theo thể loại">
            <span className="genre-filter-label">Thể loại</span>
            <select
              value={genreFilter}
              onChange={(event) => setGenreFilter(event.target.value)}
            >
              <option value="all">Tất cả thể loại</option>
              {genres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredMovies.length > 0 ? (
        <div className="movies-grid">
          {filteredMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>Không tìm thấy phim nào phù hợp.</p>
        </div>
      )}
    </div>
  );
};

export default MoviesList;
