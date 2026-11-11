'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Map, NavigationControl, LngLatBounds, Marker, Popup, AttributionControl, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_CONFIG, type MapStyleOption, type RailwayOverlayOption } from '@/config/map-config';
import type { LiveJourneyAnalysis, TimelineStation } from '@/lib/live-tracking-engine';
import {
  Layers,
  Compass,
  Maximize2,
  Navigation,
  Eye,
  Info,
  Radio,
  Zap,
  Gauge,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface LiveMapTrackerProps {
  journey: LiveJourneyAnalysis;
  selectedStationCode?: string | null;
  onSelectStation?: (stationCode: string) => void;
}

/**
 * Calculate compass bearing between two coordinates (degrees 0-360)
 */
function calculateBearing(
  startLat: number,
  startLng: number,
  destLat: number,
  destLng: number
): number {
  const startLatRad = (startLat * Math.PI) / 180;
  const startLngRad = (startLng * Math.PI) / 180;
  const destLatRad = (destLat * Math.PI) / 180;
  const destLngRad = (destLng * Math.PI) / 180;

  const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
  const x =
    Math.cos(startLatRad) * Math.sin(destLatRad) -
    Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

export default function LiveMapTracker({
  journey,
  selectedStationCode,
  onSelectStation,
}: LiveMapTrackerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const trainMarkerRef = useRef<Marker | null>(null);
  const stationMarkersRef = useRef<Marker[]>([]);

  // Map state controls
  const [currentStyleKey, setCurrentStyleKey] = useState<string>('dark');
  const [showRailwayOverlay, setShowRailwayOverlay] = useState<boolean>(true);
  const [railwayLayerKey, setRailwayLayerKey] = useState<string>('standard');
  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [isTrackingTrain, setIsTrackingTrain] = useState<boolean>(false);
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(false);

  // Auto open legend on desktop
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setIsLegendOpen(true);
    }
  }, []);

  const { timeline, position, trainNumber, trainName, origin, destination } = journey;
  const crossedStationCount = timeline.filter(
    (station, index) => index > 0 && station.state === 'COMPLETED'
  ).length;
  const locationSummary = position.isAtStation && position.currentStationName
    ? `At ${position.currentStationName}`
    : position.confidence === 'NOT_STARTED'
      ? `At origin: ${origin.name}`
      : position.confidence === 'SCHEDULE_BASED'
        ? `Last confirmed: ${position.previousStationName}`
        : position.confidence === 'GPS_REPORTED' || position.confidence === 'ESTIMATED'
          ? `Between ${position.previousStationName} and ${position.nextStationName}`
          : `Last reported: ${position.previousStationName} · next ${position.nextStationName}`;

  // Convert timeline coordinates: [lat, lng] -> [lng, lat] for MapLibre GeoJSON
  const trainLngLat: [number, number] = [position.coordinates[1], position.coordinates[0]];

  // Calculate train direction bearing
  const prevStn = timeline.find((s) => s.stationCode === position.previousStationCode) || timeline[0];
  const nextStn = timeline.find((s) => s.stationCode === position.nextStationCode) || timeline[timeline.length - 1];
  const trainBearing = prevStn && nextStn
    ? calculateBearing(prevStn.coordinates[0], prevStn.coordinates[1], nextStn.coordinates[0], nextStn.coordinates[1])
    : 0;

  // Function to add or update route polylines and overlay layers
  const updateMapLayers = useCallback(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    // 1. Manage OpenRailwayMap Infrastructure Overlay
    const overlayConfig = MAP_CONFIG.railwayOverlays[railwayLayerKey];
    if (map.getLayer('orm-infrastructure-layer')) {
      map.removeLayer('orm-infrastructure-layer');
    }
    if (map.getSource('orm-infrastructure-source')) {
      map.removeSource('orm-infrastructure-source');
    }

    if (showRailwayOverlay && overlayConfig) {
      const tileUrls = overlayConfig.subdomains.map((s) =>
        overlayConfig.tileUrl.replace('{s}', s)
      );

      map.addSource('orm-infrastructure-source', {
        type: 'raster',
        tiles: tileUrls,
        tileSize: 256,
        maxzoom: overlayConfig.maxZoom,
        attribution: MAP_CONFIG.railwayAttribution,
      });

      // Insert raster layer
      map.addLayer(
        {
          id: 'orm-infrastructure-layer',
          type: 'raster',
          source: 'orm-infrastructure-source',
          paint: {
            'raster-opacity': 0.85,
            'raster-contrast': 0.2,
          },
        }
      );
    }

    // 2. Prepare Route GeoJSON coordinates
    const passedCoordinates: [number, number][] = [];
    const upcomingCoordinates: [number, number][] = [];
    let passedLiveTrain = false;

    timeline.forEach((stn) => {
      const pt: [number, number] = [stn.coordinates[1], stn.coordinates[0]];
      if (stn.state === 'COMPLETED') {
        passedCoordinates.push(pt);
      } else {
        if (!passedLiveTrain) {
          // Bridge to current train location
          passedCoordinates.push(trainLngLat);
          upcomingCoordinates.push(trainLngLat);
          passedLiveTrain = true;
        }
        upcomingCoordinates.push(pt);
      }
    });

    if (passedCoordinates.length === 1 && !passedLiveTrain) {
      passedCoordinates.push(trainLngLat);
    }

    // Clean existing route layers
    if (map.getLayer('passed-route-line')) map.removeLayer('passed-route-line');
    if (map.getLayer('upcoming-route-line')) map.removeLayer('upcoming-route-line');
    if (map.getSource('passed-route-source')) map.removeSource('passed-route-source');
    if (map.getSource('upcoming-route-source')) map.removeSource('upcoming-route-source');

    // Add Passed Route (Solid Rose/Crimson)
    if (passedCoordinates.length >= 2) {
      map.addSource('passed-route-source', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: { name: 'Completed Track Corridor' },
          geometry: {
            type: 'LineString',
            coordinates: passedCoordinates,
          },
        },
      });

      map.addLayer({
        id: 'passed-route-line',
        type: 'line',
        source: 'passed-route-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#f43f5e', // Rose 500
          'line-width': ['interpolate', ['linear'], ['zoom'], 4, 3, 10, 6, 16, 9],
          'line-opacity': 0.95,
        },
      });
    }

    // Add Upcoming Route (Dashed High-Visibility Cyan)
    if (upcomingCoordinates.length >= 2) {
      map.addSource('upcoming-route-source', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: { name: 'Upcoming Track Corridor' },
          geometry: {
            type: 'LineString',
            coordinates: upcomingCoordinates,
          },
        },
      });

      map.addLayer({
        id: 'upcoming-route-line',
        type: 'line',
        source: 'upcoming-route-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#38bdf8', // Cyan 400
          'line-width': ['interpolate', ['linear'], ['zoom'], 4, 2.5, 10, 4.5, 16, 7],
          'line-opacity': 0.8,
          'line-dasharray': [2, 2],
        },
      });
    }
  }, [timeline, trainLngLat, showRailwayOverlay, railwayLayerKey]);

  // Function to create / update HTML station markers
  const updateStationMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear previous markers
    stationMarkersRef.current.forEach((m) => m.remove());
    stationMarkersRef.current = [];

    timeline.forEach((stn, idx) => {
      const isOrigin = idx === 0;
      const isDestination = idx === timeline.length - 1;
      const isCurrent = stn.stationCode === position.nextStationCode;
      const isCompleted = stn.state === 'COMPLETED';

      // Create Custom DOM Element for station
      const el = document.createElement('div');
      el.className = 'station-marker-pin group cursor-pointer transition-transform hover:scale-125';

      const isPassingHalt = Boolean(stn.isPassingHalt);

      let markerContent = '';
      if (isOrigin) {
        markerContent = `
          <div class="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-600 border-2 border-white shadow-lg text-[10px] font-black text-white">
            SRC
          </div>
        `;
      } else if (isDestination) {
        markerContent = `
          <div class="flex items-center justify-center w-7 h-7 rounded-full bg-rose-600 border-2 border-white shadow-lg text-[10px] font-black text-white">
            DST
          </div>
        `;
      } else if (isCurrent) {
        markerContent = `
          <div class="relative flex items-center justify-center">
            <span class="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-amber-400 opacity-75"></span>
            <div class="relative w-5 h-5 rounded-full bg-amber-400 border-2 border-slate-900 shadow-md flex items-center justify-center text-[8px] font-bold text-slate-950">
              PF
            </div>
          </div>
        `;
      } else if (isPassingHalt) {
        markerContent = `
          <div class="w-2.5 h-2.5 rounded-full ${
            isCompleted
              ? 'bg-rose-500 border border-slate-900 shadow-sm'
              : 'bg-slate-700 border border-slate-400'
          }" title="Passing Halt: ${stn.stationName}"></div>
        `;
      } else {
        markerContent = `
          <div class="w-3.5 h-3.5 rounded-full ${
            isCompleted
              ? 'bg-rose-500 border-2 border-slate-900 shadow-sm'
              : 'bg-slate-900 border-2 border-slate-400'
          }"></div>
        `;
      }

      el.innerHTML = markerContent;

      // Popup on click
      const popupHtml = `
        <div class="p-2.5 text-slate-900 font-sans text-xs min-w-[200px]">
          <div class="flex items-center justify-between border-b pb-1 mb-1.5 border-slate-200">
            <strong class="text-sm font-bold text-slate-950">${stn.stationName}</strong>
            <span class="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[10px] font-bold text-slate-700">${stn.stationCode}</span>
          </div>
          ${
            isPassingHalt
              ? `<div class="mb-1.5 text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[10px] font-semibold">Intermediate Passing Halt</div>`
              : ''
          }
          <div class="grid grid-cols-2 gap-1 text-[11px] mb-1">
            <div><span class="text-slate-500">Platform:</span> <strong class="text-slate-900">${stn.platform || 'Not reported'}</strong></div>
            <div><span class="text-slate-500">Distance:</span> <strong class="text-slate-900">${stn.distance} km</strong></div>
            <div><span class="text-slate-500">Sched Arr:</span> ${stn.scheduledArrival || '--'}</div>
            <div><span class="text-slate-500">Sched Dep:</span> ${stn.scheduledDeparture || '--'}</div>
          </div>
          ${
            stn.delayArrivalMinutes > 0
              ? `<div class="mt-1 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-medium font-mono">Late: ${stn.delayArrivalMinutes} mins</div>`
              : `<div class="mt-1 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-medium">On Schedule</div>`
          }
        </div>
      `;

      const popup = new Popup({ offset: 12, closeButton: false }).setHTML(popupHtml);

      el.addEventListener('click', () => {
        if (onSelectStation) onSelectStation(stn.stationCode);
      });

      const marker = new Marker({ element: el })
        .setLngLat([stn.coordinates[1], stn.coordinates[0]])
        .setPopup(popup)
        .addTo(map);

      stationMarkersRef.current.push(marker);
    });
  }, [timeline, position.nextStationCode, onSelectStation]);

  // Function to create / update Live Moving Train Marker
  const updateTrainMarker = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    if (trainMarkerRef.current) {
      trainMarkerRef.current.remove();
    }

    // Custom Train Marker with Animated Pulse and Rotating Locomotive SVG
    const el = document.createElement('div');
    el.className = 'live-train-marker-container relative cursor-pointer';

    el.innerHTML = `
      <div class="relative flex items-center justify-center">
        <!-- Outer radar pulsing ring -->
        <span class="${position.confidence === 'ESTIMATED' ? '' : 'animate-ping'} absolute inline-flex h-12 w-12 rounded-full bg-emerald-400 opacity-60"></span>
        <span class="${position.confidence === 'ESTIMATED' ? '' : 'animate-pulse'} absolute inline-flex h-8 w-8 rounded-full bg-emerald-500 opacity-40"></span>
        
        <!-- Rotating Locomotive Body -->
        <div class="relative w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 border-2 border-white shadow-2xl flex items-center justify-center"
             style="transform: rotate(${trainBearing}deg); transition: transform 0.5s ease-out;">
          <svg viewBox="0 0 24 24" class="w-4 h-4 text-white fill-current" style="transform: rotate(-90deg);">
            <path d="M12 2C8 2 4 2.5 4 6v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-4-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V7h12v4z"/>
          </svg>
        </div>

        <!-- Speech bubble indicator -->
        <div class="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-emerald-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md border border-emerald-400">
          ${position.distanceToNextKm} km to ${position.nextStationName}
        </div>
      </div>
    `;

    // Rich Live Status Popup with Large Speedometer
    const popupHtml = `
      <div class="box-border w-[310px] max-w-full p-3 text-slate-900 font-sans text-xs overflow-hidden">
        <div class="flex items-start justify-between gap-2 border-b pb-2 mb-2.5 border-slate-200">
          <div>
            <h4 class="font-black text-sm text-slate-950">${trainNumber}</h4>
            <p class="text-[11px] text-slate-600 font-medium">${trainName}</p>
          </div>
          <span class="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
            position.confidence === 'NOT_STARTED' ? 'bg-slate-100 text-slate-700 border border-slate-300' : position.isDelayed ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
          }">
            ${position.confidence === 'ESTIMATED' ? 'Timetable estimate' : position.confidence === 'NOT_STARTED' ? 'Not started' : position.delayText}
          </span>
        </div>

        <!-- Prominent Large Speedometer Widget -->
        <div class="my-2.5 p-3 rounded-xl bg-gradient-to-r from-slate-950 to-slate-900 text-white border border-slate-800 shadow-md">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full ${position.isMoving ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}"></span>
              <span class="text-[10px] uppercase font-bold tracking-wider text-slate-300">
                ${position.confidence === 'ESTIMATED' ? 'Estimated movement' : position.isMoving ? 'Moving' : position.confidence === 'NOT_STARTED' ? 'Not started' : position.confidence === 'CANCELLED' ? 'Cancelled' : position.isAtStation ? 'At station' : 'Position unavailable'}
              </span>
            </div>
            <span class="text-[9px] uppercase px-2 py-0.5 rounded font-black tracking-wider ${
              position.isMoving ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }">
              ${position.confidence === 'ESTIMATED' ? 'Schedule estimate' : position.isMoving ? 'In transit' : position.confidence === 'NOT_STARTED' ? 'At origin' : position.confidence === 'CANCELLED' ? 'Cancelled' : position.isAtStation ? 'At station' : 'Unconfirmed'}
            </span>
          </div>

          <div class="flex items-baseline justify-between mt-2 pt-2 border-t border-slate-800/80">
            <span class="text-[11px] text-slate-400 font-medium">${position.confidence === 'ESTIMATED' ? 'Estimated speed' : 'Reported speed'}</span>
            <div class="flex items-baseline gap-1">
              <span class="text-3xl font-black text-amber-400 font-mono tracking-tight leading-none">${position.speedKmph ?? '--'}</span>
              <span class="text-xs uppercase font-bold text-slate-400">km/h</span>
            </div>
          </div>
        </div>

        <div class="space-y-1.5 text-[11px] pt-1">
          <div class="flex justify-between">
            <span class="text-slate-500">Next Station:</span>
            <strong class="text-slate-950">${position.nextStationName} (${position.distanceToNextKm} km)</strong>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">ETA to Stop:</span>
            <strong class="text-emerald-700 font-mono font-bold">${position.nextStationEta}</strong>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Position Basis:</span>
            <span class="font-mono font-bold text-indigo-700">${position.confidence}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Data Freshness:</span>
            <span class="text-slate-600">${position.lastUpdatedSecondsAgo === null ? 'Update time unavailable' : `Updated ${position.lastUpdatedSecondsAgo}s ago`}</span>
          </div>
        </div>

        <div class="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
          <span>Basis: ${position.confidence.replaceAll('_', ' ')}</span>
          <span>${position.lastUpdatedSecondsAgo === null ? 'No timestamp' : `Updated ${position.lastUpdatedSecondsAgo}s ago`}</span>
        </div>
      </div>
    `;

    const popup = new Popup({ offset: 18, maxWidth: '340px' }).setHTML(popupHtml);

    const marker = new Marker({ element: el })
      .setLngLat(trainLngLat)
      .setPopup(popup)
      .addTo(map);

    trainMarkerRef.current = marker;

    if (isTrackingTrain) {
      map.easeTo({
        center: trainLngLat,
        zoom: Math.max(map.getZoom(), 9),
        duration: 1000,
      });
    }
  }, [trainLngLat, trainBearing, position, trainNumber, trainName, isTrackingTrain]);

  // Initialize MapLibre GL instance
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    try {
      setWorkerUrl(`${window.location.origin}/maplibre-gl-worker.js`);
    } catch (err) {
      console.warn('MapLibre worker setup error:', err);
    }

    const styleUrl = MAP_CONFIG.baseStyles[currentStyleKey]?.styleUrl || MAP_CONFIG.baseStyles.dark.styleUrl;

    const map = new Map({
      container: mapContainerRef.current,
      style: styleUrl,
      center: trainLngLat,
      zoom: 7,
      pitch: is3DMode ? 35 : 0,
      maxZoom: 19,
      minZoom: 3,
      attributionControl: false,
    });

    map.on('error', (e) => {
      // Suppress benign tile loading cancel errors
      const err = e?.error as any;
      if (err?.status !== 404 && err?.message !== 'canceled') {
        console.warn('MapLibre runtime message:', e);
      }
    });

    // Custom attribution control (OpenFreeMap + OpenStreetMap + OpenRailwayMap)
    map.addControl(
      new AttributionControl({
        compact: true,
        customAttribution:
          '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OSM</a> · <a href="https://www.openrailwaymap.org" target="_blank" rel="noopener">OpenRailwayMap</a>',
      }),
      'bottom-right'
    );

    // Navigation Controls (Compass, Zoom In/Out, Pitch)
    map.addControl(new NavigationControl({ visualizePitch: true }), 'top-right');

    map.on('load', () => {
      setIsMapLoaded(true);
      updateMapLayers();
      updateStationMarkers();
      updateTrainMarker();

      // Fit bounds to entire route comfortably
      if (timeline.length > 1) {
        const bounds = new LngLatBounds();
        timeline.forEach((s) => bounds.extend([s.coordinates[1], s.coordinates[0]]));
        bounds.extend(trainLngLat);
        map.fitBounds(bounds, { padding: 60, maxZoom: 11 });
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      setIsMapLoaded(false);
    };
  }, []); // Run once on mount

  // Handle style change
  const handleStyleChange = (styleKey: string) => {
    setCurrentStyleKey(styleKey);
    const map = mapRef.current;
    if (!map) return;

    const newStyle = MAP_CONFIG.baseStyles[styleKey]?.styleUrl;
    if (newStyle) {
      map.setStyle(newStyle);
      map.once('style.load', () => {
        updateMapLayers();
        updateStationMarkers();
        updateTrainMarker();
      });
    }
  };

  // Re-run layers and markers update when journey or toggles change
  useEffect(() => {
    if (isMapLoaded) {
      updateMapLayers();
      updateStationMarkers();
      updateTrainMarker();
    }
  }, [isMapLoaded, updateMapLayers, updateStationMarkers, updateTrainMarker]);

  // Fit all stations in route view
  const fitRouteBounds = () => {
    const map = mapRef.current;
    if (!map || !timeline.length) return;
    const bounds = new LngLatBounds();
    timeline.forEach((s) => bounds.extend([s.coordinates[1], s.coordinates[0]]));
    bounds.extend(trainLngLat);
    map.fitBounds(bounds, { padding: 60, maxZoom: 11, duration: 1200 });
  };

  // Center on moving train
  const centerTrain = () => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({
      center: trainLngLat,
      zoom: 11,
      pitch: 45,
      bearing: trainBearing,
      duration: 1500,
    });
  };

  // Toggle 3D pitch
  const toggle3DMode = () => {
    const map = mapRef.current;
    if (!map) return;
    const nextMode = !is3DMode;
    setIs3DMode(nextMode);
    map.easeTo({
      pitch: nextMode ? 45 : 0,
      duration: 800,
    });
  };

  return (
    <div className="relative w-full h-[620px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 flex flex-col">
      {/* Top Map Toolbar - scrollable on mobile */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pointer-events-none">
        {/* Style Selector */}
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-0.5 sm:p-1 shadow-lg flex items-center gap-0.5 sm:gap-1 text-xs shrink-0">
          <Layers className="w-3.5 h-3.5 text-slate-400 ml-1.5 hidden xs:inline" />
          <button
            onClick={() => handleStyleChange('dark')}
            className={`px-2 sm:px-2.5 py-1 rounded-lg font-semibold transition text-xs ${
              currentStyleKey === 'dark'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
            title="OpenFreeMap Dark Vector Map (No API Key)"
          >
            Dark
          </button>
          <button
            onClick={() => handleStyleChange('liberty')}
            className={`px-2 sm:px-2.5 py-1 rounded-lg font-semibold transition text-xs ${
              currentStyleKey === 'liberty'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
            title="OpenFreeMap Liberty Detailed Map"
          >
            Liberty
          </button>
          <button
            onClick={() => handleStyleChange('bright')}
            className={`px-2 sm:px-2.5 py-1 rounded-lg font-semibold transition text-xs ${
              currentStyleKey === 'bright'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
            title="OpenFreeMap Bright Sunlight Map"
          >
            Bright
          </button>
          <button
            onClick={() => handleStyleChange('positron')}
            className={`px-2 sm:px-2.5 py-1 rounded-lg font-semibold transition text-xs ${
              currentStyleKey === 'positron'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
            title="OpenFreeMap Positron Minimal Light Map"
          >
            Positron
          </button>
        </div>

        {/* OpenRailwayMap Infrastructure Overlay Toggle */}
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-0.5 sm:p-1 shadow-lg flex items-center gap-1 text-xs shrink-0">
          <button
            onClick={() => setShowRailwayOverlay(!showRailwayOverlay)}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg font-semibold transition text-xs ${
              showRailwayOverlay
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle OpenRailwayMap physical tracks, junctions & signals"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Tracks</span>
          </button>

          {showRailwayOverlay && (
            <select
              value={railwayLayerKey}
              onChange={(e) => setRailwayLayerKey(e.target.value)}
              className="bg-slate-800 text-slate-200 rounded-lg px-1.5 py-1 text-xs font-medium border border-slate-700 focus:outline-none"
            >
              <option value="standard">Junctions</option>
              <option value="electrified">Electrified</option>
              <option value="maxspeed">Speed Limits</option>
            </select>
          )}
        </div>

        {/* Quick Map Action Buttons */}
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-0.5 sm:p-1 shadow-lg flex items-center gap-1 text-xs shrink-0">
          <button
            onClick={centerTrain}
            className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg transition text-xs active:scale-95"
            title="Fly camera to live train location"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Center</span>
          </button>

          <button
            onClick={fitRouteBounds}
            className="px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition font-medium text-xs"
            title="Zoom out to show entire route"
          >
            Fit
          </button>

          <button
            onClick={toggle3DMode}
            className={`px-2 py-1 rounded-lg font-bold transition text-xs ${
              is3DMode ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Toggle 3D perspective tilt"
          >
            {is3DMode ? '3D' : '2D'}
          </button>
        </div>
      </div>

      {/* Main MapLibre Canvas Container */}
      <div ref={mapContainerRef} className="w-full flex-1" />

      {/* Bottom Floating Route Legend & Accuracy Banner */}
      <div className="absolute bottom-2.5 left-2.5 z-10">
        {!isLegendOpen ? (
          <button
            onClick={() => setIsLegendOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl backdrop-blur-md border border-slate-700/80 shadow-xl transition active:scale-95"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Route Legend</span>
          </button>
        ) : (
          <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-2.5 shadow-2xl text-xs w-72 sm:max-w-sm animate-fadeIn">
            <div className="flex items-center justify-between mb-1.5 border-b border-slate-800 pb-1">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Indian Railway Map</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  {position.confidence}
                </span>
                <button
                  onClick={() => setIsLegendOpen(false)}
                  className="w-5 h-5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center text-xs font-bold"
                  title="Close Legend"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-2.5 gap-y-1 text-[10px] sm:text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-rose-500 rounded-full inline-block"></span>
                <span className="text-slate-300">Passed Track</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-cyan-400 border border-cyan-300 border-dashed rounded-full inline-block"></span>
                <span className="text-slate-300">Upcoming Route</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block border border-white"></span>
                <span className="text-slate-300">Next Stop</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block border border-white"></span>
                <span className="text-slate-300">Live Train Marker</span>
              </div>
            </div>

            <div className="mt-2 pt-1.5 border-t border-slate-800/80 space-y-1 text-[10px] sm:text-[11px]">
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">Train location</span>
                <span className="text-right text-white font-semibold truncate max-w-[150px]">{locationSummary}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">Stations passed</span>
                <span className="text-white font-semibold">{crossedStationCount} / {Math.max(0, timeline.length - 1)}</span>
              </div>
              <div className="text-[10px] text-slate-400">
                {position.confidence === 'ESTIMATED' ? 'Location estimated from timetable' : position.confidence === 'GPS_REPORTED' ? 'Location reported by GPS' : `Basis: ${position.confidence.replaceAll('_', ' ').toLowerCase()}`}
              </div>
            </div>

            <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-400">
              <span>OpenRailwayMap + OpenFreeMap</span>
              <span>MapLibre GL</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
