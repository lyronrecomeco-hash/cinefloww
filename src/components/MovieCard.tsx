import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { TMDBMovie, posterUrl, getDisplayTitle, getYear, getMediaType } from "@/services/tmdb";

interface MovieCardProps {
  movie: TMDBMovie;
}

const MovieCard = ({ movie }: MovieCardProps) => {
  const type = getMediaType(movie);
  const link = type === "movie" ? `/filme/${movie.id}` : `/serie/${movie.id}`;

  return (
    <Link to={link} className="group flex-shrink-0 w-[160px] sm:w-[180px] lg:w-[200px]">
      <div className="relative aspect-[2/3] rounded-2xl overflow-hidden mb-3 card-shine">
        <img
          src={posterUrl(movie.poster_path)}
          alt={getDisplayTitle(movie)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {movie.vote_average > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-background/60 backdrop-blur-md text-xs font-semibold border border-white/10">
            <Star className="w-3 h-3 text-primary fill-primary" />
            {movie.vote_average.toFixed(1)}
          </div>
        )}

        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-primary/20 backdrop-blur-md text-primary text-[10px] font-semibold uppercase tracking-wider border border-primary/30">
          {type === "tv" ? "Série" : "Filme"}
        </div>
      </div>

      <h3 className="font-display font-semibold text-sm leading-tight line-clamp-1 group-hover:text-primary transition-colors">
        {getDisplayTitle(movie)}
      </h3>
      <p className="text-muted-foreground text-xs mt-1">{getYear(movie)}</p>
    </Link>
  );
};

export default MovieCard;
