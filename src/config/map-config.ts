/**
 * Indian Railway Map System Configuration
 * 
 * Powered by:
 * - Map Renderer: MapLibre GL JS (Vector WebGL rendering)
 * - Primary Base Map: OpenFreeMap (Free vector tiles, NO API keys, NO registration)
 * - Railway Infrastructure Overlay: OpenRailwayMap (Standard tracks, Electrification, Speeds)
 * 
 * Production Scaling Note:
 * OpenFreeMap and OpenRailwayMap public tile endpoints are free for standard community use.
 * For high-volume production deployments:
 * 1. OpenFreeMap can be self-hosted with Docker or Planetiler / Martin:
 *    https://github.com/hyperknot/openfreemap
 * 2. OpenRailwayMap tiles can be self-hosted via standard OSM Carto / Mapnik tile server
 *    with ORM stylesheets: https://github.com/OpenRailwayMap/OpenRailwayMap-CartoCSS
 */

export interface MapStyleOption {
  id: string;
  name: string;
  styleUrl: string;
  theme: 'dark' | 'light';
  attribution: string;
  description: string;
}

export interface RailwayOverlayOption {
  id: string;
  name: string;
  tileUrl: string;
  subdomains: string[];
  maxZoom: number;
  description: string;
}

export const MAP_CONFIG = {
  // Center of India (WGS84 [longitude, latitude] for MapLibre)
  defaultCenter: [78.9629, 20.5937] as [number, number],
  defaultZoom: 7,
  minZoom: 3,
  maxZoom: 19,
  pitch: 30, // Default 3D perspective tilt

  // Base vector map styles from OpenFreeMap (100% Free, No API keys, No registration)
  baseStyles: {
    dark: {
      id: 'openfreemap-dark',
      name: 'OpenFreeMap Dark',
      styleUrl: 'https://tiles.openfreemap.org/styles/dark',
      theme: 'dark',
      attribution:
        '&copy; <a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
      description: 'Optimized high-contrast dark theme for night railway visualization',
    },
    liberty: {
      id: 'openfreemap-liberty',
      name: 'OpenFreeMap Liberty',
      styleUrl: 'https://tiles.openfreemap.org/styles/liberty',
      theme: 'light',
      attribution:
        '&copy; <a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
      description: 'Detailed vector map with terrain, waterways, and infrastructure',
    },
    bright: {
      id: 'openfreemap-bright',
      name: 'OpenFreeMap Bright',
      styleUrl: 'https://tiles.openfreemap.org/styles/bright',
      theme: 'light',
      attribution:
        '&copy; <a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
      description: 'Clean bright daylight cartography',
    },
    positron: {
      id: 'openfreemap-positron',
      name: 'OpenFreeMap Positron',
      styleUrl: 'https://tiles.openfreemap.org/styles/positron',
      theme: 'light',
      attribution:
        '&copy; <a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
      description: 'Minimalist high-legibility light cartography',
    },
  } as Record<string, MapStyleOption>,

  // OpenRailwayMap Infrastructure Overlays
  railwayOverlays: {
    standard: {
      id: 'orm-standard',
      name: 'Tracks & Infrastructure',
      tileUrl: 'https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',
      subdomains: ['a', 'b', 'c'],
      maxZoom: 19,
      description: 'Physical railway tracks, switches, junctions, bridges, and tunnels',
    },
    electrified: {
      id: 'orm-electrified',
      name: 'Overhead Electrification',
      tileUrl: 'https://{s}.tiles.openrailwaymap.org/electrified/{z}/{x}/{y}.png',
      subdomains: ['a', 'b', 'c'],
      maxZoom: 19,
      description: '25kV 50Hz AC overhead traction, DC routes, and non-electrified corridors',
    },
    maxspeed: {
      id: 'orm-maxspeed',
      name: 'Speed Limits (Track Speeds)',
      tileUrl: 'https://{s}.tiles.openrailwaymap.org/maxspeed/{z}/{x}/{y}.png',
      subdomains: ['a', 'b', 'c'],
      maxZoom: 19,
      description: 'Sectional speeds (e.g. 130 km/h, 110 km/h, 160 km/h Mission Raftaar)',
    },
  } as Record<string, RailwayOverlayOption>,

  // Railway attribution
  railwayAttribution:
    '&copy; <a href="https://www.openrailwaymap.org" target="_blank" rel="noopener">OpenRailwayMap</a>',
};

