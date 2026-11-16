-- Migration untuk mengizinkan penambahan zona baru dan custom tags/fasilitas
ALTER TABLE public.spots DROP CONSTRAINT IF EXISTS spots_zona_check;
ALTER TABLE public.spots DROP CONSTRAINT IF EXISTS spots_ukuran_check;
