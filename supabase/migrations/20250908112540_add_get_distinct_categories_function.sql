
CREATE OR REPLACE FUNCTION get_distinct_categories()
RETURNS TABLE(category TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.category
  FROM publications p
  ORDER BY p.category;
END;
$$ LANGUAGE plpgsql;
