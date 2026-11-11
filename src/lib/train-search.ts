import { KNOWN_TRAINS } from '../data/train-directory.ts';
import type { TrainSearchResult } from './railway-api';

function levenshteinDistance(left: string, right: string): number {
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= right.length; column += 1) {
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[right.length];
}

function tokenMatches(queryToken: string, candidateToken: string): boolean {
  if (queryToken === candidateToken || candidateToken.includes(queryToken) || queryToken.includes(candidateToken)) return true;
  if (queryToken.length < 5 || candidateToken.length < 5) return false;
  const maxDistance = queryToken.length >= 9 ? 3 : queryToken.length >= 7 ? 2 : 1;
  return levenshteinDistance(queryToken, candidateToken) <= maxDistance;
}

function trainSearchTokens(train: (typeof KNOWN_TRAINS)[string]): string[] {
  const searchable = [
    train.trainNumber,
    train.trainName,
    train.origin.code,
    train.origin.name,
    train.destination.code,
    train.destination.name,
    ...train.schedule.flatMap((station) => [station.stationCode, station.stationName]),
  ].join(' ').toLowerCase();
  return searchable.split(/[^a-z0-9]+/).filter(Boolean);
}

/** Search the curated fallback by train identity and every station on its known route. */
export function findKnownTrains(query: string): TrainSearchResult[] {
  const cleanQuery = query.toLowerCase().trim();
  const queryTokens = cleanQuery.split(/[^a-z0-9]+/).filter(Boolean);
  if (queryTokens.length === 0) return [];

  return Object.values(KNOWN_TRAINS)
    .filter((train) => {
      const candidates = trainSearchTokens(train);
      return queryTokens.every((queryToken) => candidates.some((candidate) => tokenMatches(queryToken, candidate)));
    })
    .map((train) => ({
      trainNumber: train.trainNumber,
      trainName: train.trainName,
      origin: train.origin,
      destination: train.destination,
      trainType: train.type,
      classes: train.classes,
      daysOfRun: [],
    }));
}

export function mergeTrainSearchResults(
  providerResults: TrainSearchResult[],
  localResults: TrainSearchResult[],
): TrainSearchResult[] {
  const merged = new Map<string, TrainSearchResult>();
  for (const result of providerResults) {
    if (result?.trainNumber) merged.set(String(result.trainNumber), result);
  }
  for (const result of localResults) {
    if (!merged.has(result.trainNumber)) merged.set(result.trainNumber, result);
  }
  return [...merged.values()];
}
