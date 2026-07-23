-- Ameen Painting LLC booking schema
-- Each row represents one booked 3-hour estimate window.
-- The UNIQUE(date, time) constraint is what prevents double-booking.

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
