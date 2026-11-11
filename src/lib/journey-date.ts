function shiftIsoDate(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function formatJourneyDisplayDate(dateStr?: string | null, now = new Date()): string {
  const cleaned = dateStr?.trim() || '';
  const indiaToday = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
  const resolvedDate = !cleaned || /^today$/i.test(cleaned)
    ? indiaToday
    : /^yesterday$/i.test(cleaned)
    ? shiftIsoDate(indiaToday, -1)
    : /^tomorrow$/i.test(cleaned)
    ? shiftIsoDate(indiaToday, 1)
    : /^\d{4}-\d{2}-\d{2}$/.test(cleaned)
    ? cleaned
    : (() => {
        const parsed = new Date(cleaned.replace(/\s+/g, '-'));
        return Number.isNaN(parsed.getTime()) ? null : new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
        }).format(parsed);
      })();
  if (!resolvedDate) return cleaned;

  const toUtcDay = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
  };
  const dayOffset = Math.round((toUtcDay(resolvedDate) - toUtcDay(indiaToday)) / 86_400_000);
  const date = new Date(`${resolvedDate}T00:00:00Z`);
  const formatted = date.toLocaleDateString('en-IN', {
    timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
  const relativeLabel = dayOffset === 0 ? 'Today' : dayOffset === -1 ? 'Yesterday' : dayOffset === 1 ? 'Tomorrow' : '';
  return relativeLabel ? `${formatted} (${relativeLabel})` : formatted;
}
