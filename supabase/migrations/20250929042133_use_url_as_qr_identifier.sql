-- Drop the old column
ALTER TABLE public.publications DROP COLUMN IF EXISTS "codigoExternoQR";

-- Add the new column for the manufacturer's URL
ALTER TABLE public.publications
ADD COLUMN "urlDoFabricante" TEXT UNIQUE;

-- Optional: Add a comment to describe the column's purpose
COMMENT ON COLUMN public.publications."urlDoFabricante" IS 'Stores the unique URL from the manufacturer QR code.';
