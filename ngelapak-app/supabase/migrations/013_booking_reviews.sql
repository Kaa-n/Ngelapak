-- Migration: 013_booking_reviews.sql
-- Description: Create reviews table for completed bookings, with RLS and public access

CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id TEXT NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    spot_id UUID NOT NULL REFERENCES public.spots(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    nama TEXT NOT NULL,
    fakultas TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    komentar TEXT NOT NULL CHECK (char_length(trim(komentar)) > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_reviews_booking_id UNIQUE (booking_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_spot_id ON public.reviews(spot_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON public.reviews(booking_id);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 1. Anyone (public & authenticated) can read reviews
CREATE POLICY "Public can view reviews"
    ON public.reviews FOR SELECT
    USING (true);

-- 2. Authenticated users can insert review for their own completed booking
CREATE POLICY "Tenant can review own completed booking"
    ON public.reviews FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = owner_id
        AND EXISTS (
            SELECT 1 FROM public.bookings b
            WHERE b.id = booking_id
              AND b.owner_id = auth.uid()
              AND b.status_verifikasi = 'disetujui'
              AND (b.status = 'selesai' OR b.tanggal_selesai < CURRENT_DATE)
        )
    );

-- 3. Authenticated users can update their own review
CREATE POLICY "Tenant can update own review"
    ON public.reviews FOR UPDATE
    TO authenticated
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- Grant privileges
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE ON public.reviews TO authenticated;
