USE vehicle_service_db;

INSERT INTO users (name, email, password)
VALUES
  ('Rahul Sharma', 'rahul@example.com', '$2a$10$samplehashedpasswordforviva'),
  ('Priya Patel', 'priya@example.com', '$2a$10$samplehashedpasswordforviva');

INSERT INTO vehicles (user_id, name, model, number, type, purchase_date)
VALUES
  (1, 'Honda City', 'VX 2021', 'MH12AB1234', 'Car', '2021-06-15'),
  (1, 'Activa', '6G', 'MH12CD5678', 'Scooter', '2022-01-20'),
  (2, 'Maruti Swift', 'ZXI 2020', 'GJ01EF9012', 'Car', '2020-09-10');

INSERT INTO services (user_id, vehicle_id, service_type, custom_service_type, cost, date, notes)
VALUES
  (1, 1, 'Oil Change', NULL, 2500.00, '2025-12-10', 'Engine oil and filter changed'),
  (1, 1, 'General Service', NULL, 6500.00, '2026-02-05', 'Brake check and wheel alignment'),
  (1, 2, 'Battery Check', NULL, 700.00, '2026-01-12', 'Battery terminals cleaned'),
  (2, 3, 'Tyre Replacement', NULL, 12000.00, '2026-03-18', 'All four tyres replaced');
