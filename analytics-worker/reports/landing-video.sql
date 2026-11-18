-- All observed playback starts, including untagged traffic. Sessions approximate viewers.
SELECT COUNT(*) AS starts, COUNT(DISTINCT session_id) AS playback_sessions
FROM events
WHERE practice_slug = 'frontdoor-health' AND event_type = 'video_start'
  AND RTRIM(page_path, '/') = '/mental-health-website-design';

-- Production page views require campaign attribution. Compare only observed landing sessions.
-- Use client event times so network delivery order cannot reverse a start and a request.
WITH sessions AS (
  SELECT session_id,
    MIN(CASE WHEN event_type = 'video_start' THEN event_timestamp END) AS first_start,
    MIN(CASE WHEN event_type = 'preview_requested' THEN event_timestamp END) AS first_request
  FROM events
  WHERE practice_slug = 'frontdoor-health' AND session_id IS NOT NULL
    AND RTRIM(page_path, '/') = '/mental-health-website-design'
  GROUP BY session_id
  HAVING MAX(event_type = 'page_view' AND utm_campaign IS NOT NULL) = 1
), cohorts AS (
  SELECT first_start IS NOT NULL AND (first_request IS NULL OR first_start <= first_request) AS watched,
    first_request IS NOT NULL AS requested
  FROM sessions
)
SELECT CASE watched WHEN 1 THEN 'Started video' ELSE 'No prior start' END AS cohort,
  COUNT(*) AS sessions, SUM(requested) AS requesting_sessions,
  ROUND(100.0 * AVG(requested), 2) AS request_rate_pct
FROM cohorts GROUP BY watched;
