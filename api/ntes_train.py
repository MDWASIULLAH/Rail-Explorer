"""Small, rate-limited Vercel adapter for the public NTES train feed."""

from datetime import date, datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
from zoneinfo import ZoneInfo
import json
import re
import threading
import time as clock

from ntes import NTESClient


_cache = {}
_failure_cache = {}
_requests = {}
_lock = threading.Lock()
_CACHE_SECONDS = 30
_FAILURE_CACHE_SECONDS = 15
_RATE_WINDOW_SECONDS = 60
_RATE_LIMIT = 24


def _json(handler, status, body, cache_seconds=0):
    encoded = json.dumps(body, ensure_ascii=True, separators=(",", ":")).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Cache-Control", f"public, s-maxage={cache_seconds}, stale-while-revalidate=15" if cache_seconds else "no-store")
    handler.send_header("Content-Length", str(len(encoded)))
    handler.end_headers()
    handler.wfile.write(encoded)


def _parse_date(value):
    try:
        requested = date.fromisoformat(value)
    except (TypeError, ValueError):
        return None
    today = datetime.now(ZoneInfo("Asia/Kolkata")).date()
    if abs((requested - today).days) > 2:
        return None
    return requested


def _station_date(value, journey_date):
    match = re.search(r"(\d{1,2})-([A-Za-z]{3})", value or "")
    if not match:
        return journey_date
    parsed = datetime.strptime(f"{match.group(1)}-{match.group(2)}-{journey_date.year}", "%d-%b-%Y").date()
    if parsed < journey_date - timedelta(days=2):
        parsed = parsed.replace(year=parsed.year + 1)
    return parsed


def _station_time(value, journey_date):
    match = re.match(r"\s*(\d{1,2}:\d{2})(?:\s+(\d{1,2}-[A-Za-z]{3}))?", value or "")
    if not match:
        return None, None
    parsed_time = datetime.strptime(match.group(1), "%H:%M").time()
    station_day = _station_date(match.group(2), journey_date) if match.group(2) else journey_date
    return parsed_time.strftime("%H:%M"), max(1, (station_day - journey_date).days + 1)


def _station_ref(code, name):
    if not code:
        return None
    return {"code": str(code).strip().upper(), "name": str(name or code).strip()}


def normalize_ntes_response(raw, requested_train, requested_date, checked_at=None):
    if not isinstance(raw, dict) or str(raw.get("TN", "")).strip() != requested_train:
        return None
    try:
        journey_date = datetime.strptime(raw.get("STD", ""), "%d-%b-%Y").date()
    except (TypeError, ValueError):
        journey_date = requested_date

    raw_stations = raw.get("STNS") if isinstance(raw.get("STNS"), list) else []
    stations = []
    for item in raw_stations:
        if not isinstance(item, dict):
            continue
        code = str(item.get("SC", "")).strip().upper()
        name = str(item.get("SN", "")).strip()
        if not re.fullmatch(r"[A-Z0-9]{2,6}", code) or len(name) < 2:
            continue
        arrival, arrival_day = _station_time(item.get("STA"), journey_date)
        departure, departure_day = _station_time(item.get("STD"), journey_date)
        day = arrival_day or departure_day or 1
        halt = 0
        if arrival and departure:
            arrival_dt = datetime.combine(journey_date + timedelta(days=arrival_day - 1), datetime.strptime(arrival, "%H:%M").time())
            departure_dt = datetime.combine(journey_date + timedelta(days=departure_day - 1), datetime.strptime(departure, "%H:%M").time())
            halt = max(0, int((departure_dt - arrival_dt).total_seconds() // 60))
        try:
            distance = max(0, int(float(item.get("DIST", 0))))
        except (TypeError, ValueError):
            distance = 0
        platform = str(item.get("PF", "")).strip() or None
        stations.append({
            "stationCode": code,
            "stationName": name,
            "arrivalTime": arrival,
            "departureTime": departure,
            "haltMinutes": halt,
            "distance": distance,
            "day": day,
            "platform": platform,
            "isPassingHalt": False,
        })
    if len(stations) < 2:
        return None

    station_by_code = {item["stationCode"]: item for item in stations}
    origin = _station_ref(raw.get("SRC"), raw.get("SRCN")) or {"code": stations[0]["stationCode"], "name": stations[0]["stationName"]}
    destination = _station_ref(raw.get("DSTN"), raw.get("DSTNN")) or {"code": stations[-1]["stationCode"], "name": stations[-1]["stationName"]}
    position_text = str(raw.get("CPOS") or raw.get("LUPDFULL") or "").strip()
    normalized_position = position_text.lower()
    last_code = str(raw.get("LSTN") or "").strip().upper()
    next_code = str(raw.get("NSTN") or raw.get("NPSTN") or "").strip().upper()
    last_station = station_by_code.get(last_code)
    next_station = station_by_code.get(next_code)
    checked = checked_at or datetime.now(timezone.utc).isoformat()

    if "yet to start" in normalized_position:
        status = "NOT_STARTED"
        last_station = stations[0]
        next_station = stations[1]
    elif "cancel" in normalized_position:
        status = "CANCELLED"
    elif "arriv" in normalized_position or raw.get("ISPTT") is True:
        status = "AT_STATION"
    elif "depart" in normalized_position or "running" in normalized_position:
        status = "RUNNING"
    elif last_station and next_station:
        status = "RUNNING"
    else:
        status = "UNKNOWN"

    try:
        delay_minutes = max(0, int(str(raw.get("LDEL", "0")).strip() or "0"))
    except ValueError:
        delay_match = re.search(r"(\d+)\s*(?:min|minute)", position_text, re.IGNORECASE)
        delay_minutes = int(delay_match.group(1)) if delay_match else 0

    completed_stops = 0 if status == "NOT_STARTED" else max(0, int(raw.get("LSTNSR", 0) or 0))
    if status == "AT_STATION" and last_station:
        current_station = _station_ref(last_station["stationCode"], last_station["stationName"])
        previous_station = None
    else:
        current_station = None
        previous_station = _station_ref(last_station["stationCode"], last_station["stationName"]) if last_station else None
    if status in ("NOT_STARTED", "CANCELLED"):
        current_station = _station_ref(origin["code"], origin["name"])
        previous_station = None
    if not next_station and completed_stops < len(stations):
        next_station = stations[min(completed_stops, len(stations) - 1)]

    route = {
        "trainNumber": requested_train,
        "trainName": str(raw.get("TNM") or raw.get("TNH") or "").strip(),
        "stations": [{
            "stationCode": item["stationCode"],
            "stationName": item["stationName"],
            "scheduledArrival": item["arrivalTime"],
            "scheduledDeparture": item["departureTime"],
            "actualArrival": None,
            "actualDeparture": None,
            "delay": 0,
            "platform": item["platform"],
            "distance": item["distance"],
            "day": item["day"],
        } for item in stations],
    }
    schedule = {
        "trainNumber": requested_train,
        "trainName": route["trainName"],
        "trainType": "",
        "zone": "",
        "origin": origin,
        "destination": destination,
        "classes": [],
        "daysOfRun": [],
        "distance": stations[-1]["distance"],
        "duration": "",
        "halts": max(0, len(stations) - 2),
        "stations": stations,
    }
    total_stops = len(stations)
    progress_index = next((i for i, item in enumerate(stations) if item["stationCode"] == (previous_station or current_station or {}).get("code")), 0)
    progress_previous = stations[max(0, progress_index)]
    progress_next = stations[min(total_stops - 1, progress_index + 1)]
    numeric_distance = stations[-1]["distance"] or 1
    train_status = {
        "trainNumber": requested_train,
        "trainName": route["trainName"],
        "journeyDate": journey_date.isoformat(),
        "status": status,
        "origin": origin,
        "destination": destination,
        "currentStation": current_station,
        "previousStation": previous_station,
        "nextStation": _station_ref(next_station["stationCode"], next_station["stationName"]) if next_station else None,
        "position": None,
        "speedKmph": None,
        "delayMinutes": delay_minutes,
        "delay": {"minutes": delay_minutes, "source": "NTES", "reference": position_text, "stationCode": (previous_station or current_station or {}).get("code", "")},
        "eta": None,
        "routeProgress": {
            "completedStops": completed_stops,
            "remainingStops": max(0, total_stops - completed_stops),
            "totalStops": total_stops,
            "previousStop": {"code": progress_previous["stationCode"], "name": progress_previous["stationName"]},
            "nextStop": {"code": progress_next["stationCode"], "name": progress_next["stationName"]},
            "percent": min(100, round((progress_previous["distance"] / numeric_distance) * 100)),
            "basis": "NTES reported route stop sequence",
        },
        "exceptions": [],
        "freshness": {
            "observedAt": checked,
            "updatedAt": checked,
            "ageSeconds": 0,
            "state": "SCHEDULE" if status == "NOT_STARTED" else "RECENT",
            "provider": "NTES",
        },
        "source": "NTES",
        "confidence": "PROVIDER_REPORTED",
        "observedAt": checked,
        "providerMessage": position_text,
        "providerLastUpdate": str(raw.get("LUPDT") or ""),
    }
    return {"status": train_status, "schedule": schedule, "route": route, "source": "NTES", "checkedAt": checked}


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path != "/api/ntes_train":
            _json(self, 404, {"success": False, "error": "Not found."})
            return

        values = parse_qs(parsed.query)
        train_number = (values.get("train") or [""])[0].strip()
        date_value = (values.get("date") or [""])[0].strip()
        journey_date = _parse_date(date_value)
        if not re.fullmatch(r"\d{1,5}", train_number) or journey_date is None:
            _json(self, 400, {"success": False, "error": "Enter a valid train number and a date within two days."})
            return

        forwarded = self.headers.get("x-forwarded-for", "").split(",", 1)[0].strip()
        client_key = forwarded or self.client_address[0]
        now = clock.time()
        with _lock:
            recent = [stamp for stamp in _requests.get(client_key, []) if now - stamp < _RATE_WINDOW_SECONDS]
            if len(recent) >= _RATE_LIMIT:
                _requests[client_key] = recent
                _json(self, 429, {"success": False, "error": "NTES request limit reached. Try again in a minute."})
                return
            recent.append(now)
            _requests[client_key] = recent

        cache_key = (train_number, journey_date.isoformat())
        cached = _cache.get(cache_key)
        if cached and now - cached[0] < _CACHE_SECONDS:
            _json(self, 200, {"success": True, "data": cached[1]}, _CACHE_SECONDS)
            return
        if now - _failure_cache.get(cache_key, 0) < _FAILURE_CACHE_SECONDS:
            _json(self, 503, {"success": False, "error": "NTES is temporarily unavailable."})
            return

        try:
            payload = NTESClient(timeout=2.5, retries=0).live_status(train_number, journey_date.strftime("%d-%b-%Y"))
            checked_at = datetime.now(timezone.utc).isoformat()
            normalized = normalize_ntes_response(payload, train_number, journey_date, checked_at)
            if not normalized:
                _json(self, 502, {"success": False, "error": "NTES did not return a verified route for this train."})
                return
            _cache[cache_key] = (clock.time(), normalized)
            _json(self, 200, {"success": True, "data": normalized}, _CACHE_SECONDS)
        except Exception:
            _failure_cache[cache_key] = clock.time()
            _json(self, 503, {"success": False, "error": "NTES is temporarily unavailable."})

    def log_message(self, _format, *args):
        return
