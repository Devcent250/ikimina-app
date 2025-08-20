function formatTimestampDate(timestamp, outputFormat = "ISO") {
  // Validate input
  if (!timestamp || typeof timestamp !== "string" || timestamp.length !== 14) {
    return "Invalid Date";
  }

  // Parse the timestamp components
  const year = timestamp.substring(0, 4);
  const month = timestamp.substring(4, 6);
  const day = timestamp.substring(6, 8);
  const hour = timestamp.substring(8, 10);
  const minute = timestamp.substring(10, 12);
  const second = timestamp.substring(12, 14);

  // Create a Date object (month is 0-indexed in JavaScript Date)
  // @ts-ignore
  const date = new Date(year, parseInt(month) - 1, day, hour, minute, second);

  // Return formatted output based on requested format
  switch (outputFormat.toLowerCase()) {
    case "iso":
      return date.toISOString();
    case "readable":
      return `${day}-${month}-${year} ${hour}:${minute}:${second}`;
    case "object":
      return date;
    default:
      return date.toISOString();
  }
}

export default formatTimestampDate;
