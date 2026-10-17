// Shared error mapping so every controller answers with one contract:
// { error: string } and a status that means something, without leaking
// internals (raw Mongo/Mongoose messages exposed connection and schema
// details, and statuses were split by author: 400 in some controllers,
// 500 in others, for the same failures).
export function sendError(res, err) {
  if (err?.name === "CastError") {
    // Malformed ObjectId in a path/body id.
    return res.status(400).json({ error: "Invalid id" });
  }
  if (err?.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }
  if (err?.code === 11000) {
    return res.status(409).json({ error: "Resource already exists" });
  }
  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
}
