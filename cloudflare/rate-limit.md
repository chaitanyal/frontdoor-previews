# Analytics API Rate Limit

Rule Name:
Analytics API

Expression:

(http.host eq "analytics.frontdoor.health")
and
(http.request.uri.path eq "/event")
and
(http.request.method eq "POST")

Count by:
IP

Threshold:
30 requests

Period:
10 seconds

Action:
Block

Duration:
10 seconds
