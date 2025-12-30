export const formatSize = (bytes) => {
  if (!bytes || isNaN(bytes)) return "Unknown size";
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Byte";
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + " " + sizes[i];
};

export const formatTimestamp = (date) => {
  if (!date) return "";
  const now = new Date();
  const timestamp = new Date(date);
  if (now.toDateString() === timestamp.toDateString()) {
    return timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (now.getFullYear() === timestamp.getFullYear()) {
    return timestamp.toLocaleDateString([], { month: "short", day: "numeric" });
  }
  return timestamp.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};