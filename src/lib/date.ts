type TimestampLike = {
  seconds?: number;
  toDate?: () => Date;
};

export function formatTimestamp(timestamp: TimestampLike | string | number | Date | null | undefined): string {
  if (!timestamp) return "Unknown";

  if (timestamp instanceof Date) {
    return Number.isNaN(timestamp.getTime()) ? "Unknown" : timestamp.toLocaleDateString();
  }

  if (typeof timestamp === "string" || typeof timestamp === "number") {
    const parsed = new Date(timestamp);
    return Number.isNaN(parsed.getTime()) ? "Unknown" : parsed.toLocaleDateString();
  }

  if (typeof timestamp.toDate === "function") {
    return timestamp.toDate().toLocaleDateString();
  }

  if (typeof timestamp.seconds === "number") {
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  }

  return "Unknown";
}
