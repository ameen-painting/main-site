-- Ameen Painting LLC booking schema
-- Each row represents one booked hourly estimate slot (8am-6pm Central).
-- The UNIQUE(date, time) constraint prevents two bookings on the exact same
-- slot; the app layer additionally blocks the hour before/after a booking
-- (see isHourBlocked in index.js) as travel/buffer time.

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT,
  project_type TEXT NOT NULL,
  details TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(date, time)
);

-- Help the availability endpoint list booked slots for a month quickly.
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
