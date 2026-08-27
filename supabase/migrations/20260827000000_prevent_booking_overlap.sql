create extension if not exists btree_gist;

alter table public.bookings
  add constraint bookings_no_overlapping_times
  exclude using gist (
    tstzrange(start_time, end_time, '[)') with &&
  );