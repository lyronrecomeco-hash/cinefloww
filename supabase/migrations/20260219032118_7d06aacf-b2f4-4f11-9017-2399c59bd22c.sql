
ALTER TABLE public.telegram_ingestions 
  ADD COLUMN IF NOT EXISTS tmdb_id integer,
  ADD COLUMN IF NOT EXISTS tmdb_poster text,
  ADD COLUMN IF NOT EXISTS tmdb_backdrop text,
  ADD COLUMN IF NOT EXISTS tmdb_year text,
  ADD COLUMN IF NOT EXISTS tmdb_rating numeric;
