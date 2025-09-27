-- Function to get distinct actions from audit_logs
CREATE OR REPLACE FUNCTION get_distinct_actions()
RETURNS TABLE(action TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT a.action
  FROM audit_logs a
  ORDER BY a.action;
END;
$$ LANGUAGE plpgsql;

-- Function to get distinct table names from audit_logs
CREATE OR REPLACE FUNCTION get_distinct_table_names()
RETURNS TABLE(table_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT a.table_name
  FROM audit_logs a
  ORDER BY a.table_name;
END;
$$ LANGUAGE plpgsql;

-- Function to get distinct users from audit_logs
CREATE OR REPLACE FUNCTION get_distinct_audit_users()
RETURNS TABLE(username TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT (a.user_details->>'username') AS username
  FROM audit_logs a
  WHERE a.user_details->>'username' IS NOT NULL
  ORDER BY username;
END;
$$ LANGUAGE plpgsql;
