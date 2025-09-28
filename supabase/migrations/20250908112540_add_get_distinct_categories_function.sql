CREATE OR REPLACE FUNCTION get_distinct_categories()
RETURNS TABLE(category TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.category
  FROM public.publications p
  WHERE p.category IS NOT NULL
  ORDER BY p.category;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
