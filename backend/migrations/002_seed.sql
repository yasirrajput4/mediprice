-- MediPrice seed data — Ahmedabad hospitals & services

-- ── Service Categories ────────────────────────────────────────────────────────
INSERT INTO service_categories (name, icon, slug) VALUES
('Diagnostics & Lab',   '🔬', 'diagnostics'),
('Imaging & Radiology', '📷', 'imaging'),
('Cardiology',          '❤️',  'cardiology'),
('Orthopedic',          '🦴', 'orthopedic'),
('Pathology',           '🧪', 'pathology'),
('Neurology',           '🧠', 'neurology'),
('Oncology',            '🎗️',  'oncology'),
('Gastroenterology',    '🫁', 'gastroenterology')
ON CONFLICT DO NOTHING;

-- ── Master Services ───────────────────────────────────────────────────────────
INSERT INTO services (category_id, name, description, preparation, report_time) VALUES
(1, 'Complete Blood Count (CBC)',       'Full blood panel including RBC, WBC, platelets', 'No special preparation', 'Same day'),
(1, 'Liver Function Test (LFT)',        'ALT, AST, ALP, bilirubin panel',                 'Fasting 8 hours required',  '4–6 hours'),
(1, 'Thyroid Profile (T3, T4, TSH)',    'Complete thyroid function assessment',             'Morning sample preferred',  'Same day'),
(1, 'HbA1c (Diabetes Test)',            'Average blood sugar over 3 months',               'No fasting needed',         'Same day'),
(1, 'Lipid Profile',                    'Cholesterol, triglycerides, HDL, LDL',            'Fasting 12 hours required', '4–6 hours'),
(2, 'Chest X-Ray',                      'Standard PA view chest radiograph',               'Remove jewellery & metal',  '1 hour'),
(2, 'MRI Brain (without contrast)',     '1.5T MRI of brain without contrast agent',        'Remove metal implants',     '3–4 hours'),
(2, 'MRI Brain (with contrast)',        '1.5T MRI with gadolinium contrast',               'Blood test may be needed',  '4–6 hours'),
(2, 'CT Scan Head',                     'Non-contrast CT of the head',                     'Remove all metal',          '2 hours'),
(2, 'CT Scan Chest',                    'HRCT or plain CT of chest',                       'Remove all metal',          '2 hours'),
(2, 'Ultrasound Abdomen',               'Sonography of all abdominal organs',              'Full bladder required',     '30 minutes'),
(2, 'Echocardiogram',                   '2D echo with colour Doppler',                     'No special preparation',    '1–2 hours'),
(3, 'ECG (12-lead)',                    'Resting electrocardiogram',                       'No special preparation',    'Immediate'),
(3, 'Stress Test (TMT)',                'Treadmill stress test with ECG monitoring',       'Light meal 4 hrs before',   '2 hours'),
(3, 'Holter Monitor (24 hr)',           '24-hour ambulatory ECG monitoring',               'No special preparation',    '48 hours'),
(4, 'Bone Density Scan (DEXA)',         'DEXA scan for osteoporosis assessment',           'No special preparation',    '1–2 hours'),
(4, 'X-Ray Knee',                       'Weight-bearing knee radiograph',                  'No special preparation',    '1 hour'),
(5, 'Blood Culture',                    'Microbiology culture for bacteria/fungi',         'Collect before antibiotics','48–72 hours'),
(6, 'EEG',                              'Electroencephalogram for brain activity',         'Clean hair, no products',   '24 hours'),
(7, 'PET-CT Scan',                      'Whole-body FDG PET-CT for oncology staging',     'Fasting 6 hours, no sugar', '24 hours')
ON CONFLICT DO NOTHING;

-- ── Hospitals ─────────────────────────────────────────────────────────────────
INSERT INTO hospitals (name, description, address, city, state, pincode, lat, lng, phone, email, accreditations, facilities) VALUES
('Apollo Hospitals Ahmedabad',
 'NABH accredited super-specialty hospital with 24/7 radiology and state-of-the-art diagnostic facilities.',
 'Plot 1A, GIDC, Bhat, Gandhinagar Highway', 'Ahmedabad', 'Gujarat', '382428',
 23.0760, 72.5100, '079-6670-0000', 'ahmedabad@apollohospitals.com',
 ARRAY['NABH','JCI','ISO 9001'], ARRAY['24x7 Radiology','Free Parking','Pharmacy','Cafeteria','Ambulance']),

('Sterling Hospital Ahmedabad',
 'Multi-specialty hospital known for advanced diagnostics, minimally invasive surgery, and patient-first care.',
 'Off Gurukul Road, Memnagar', 'Ahmedabad', 'Gujarat', '380052',
 23.0560, 72.5390, '079-4000-3000', 'info@sterlinghospitals.com',
 ARRAY['NABH','NABL'], ARRAY['Wi-Fi','Parking','Pharmacy','ATM']),

('CIMS Hospital',
 'Cardiac Institute of Medical Sciences — Gujarat''s premier cardiac and diagnostic center.',
 'Near Shukan Mall, Science City Road, Sola', 'Ahmedabad', 'Gujarat', '380060',
 23.0650, 72.5270, '079-3010-1010', 'info@cims.org',
 ARRAY['NABH','NABL','ISO 14001'], ARRAY['Cardiac ICU','24x7 Lab','Parking','Canteen']),

('SAL Hospital',
 'Affordable quality care with NABL accredited labs. Trusted by Ahmedabad families for 20+ years.',
 'Drive-In Road, Thaltej', 'Ahmedabad', 'Gujarat', '380054',
 23.0680, 72.5190, '079-2681-1111', 'info@salhospital.in',
 ARRAY['NABL'], ARRAY['Parking','Pharmacy','Diabetic Clinic']),

('HCG Cancer Centre',
 'India''s leading oncology network — specialized cancer imaging, diagnostics, and radiation therapy.',
 'HCG Towers, Mithakhali Six Roads', 'Ahmedabad', 'Gujarat', '380009',
 23.0390, 72.5500, '079-4000-4000', 'ahmedabad@hcgoncology.com',
 ARRAY['NABH','CAP'], ARRAY['Dedicated Cancer Lab','PET-CT','Counselling','Parking'])
ON CONFLICT DO NOTHING;

-- ── Hospital Services & Prices ────────────────────────────────────────────────
-- Apollo
INSERT INTO hospital_services (hospital_id, service_id, price, wait_time_min) VALUES
(1, 1,  28000, 10), (1, 2,  55000, 15), (1, 3,  65000, 15),
(1, 4,  45000, 10), (1, 5,  75000, 15), (1, 6,  45000, 15),
(1, 7, 320000, 25), (1, 8, 450000, 30), (1, 9, 240000, 20),
(1, 10,280000, 20), (1, 11, 80000, 30), (1, 12,180000, 45),
(1, 13, 35000, 10), (1, 14,150000, 60)
ON CONFLICT DO NOTHING;

-- Sterling
INSERT INTO hospital_services (hospital_id, service_id, price, wait_time_min) VALUES
(2, 1,  32000, 15), (2, 2,  60000, 20), (2, 3,  70000, 20),
(2, 4,  50000, 15), (2, 5,  80000, 20), (2, 6,  50000, 20),
(2, 7, 380000, 30), (2, 8, 500000, 35), (2, 9, 280000, 25),
(2, 11, 90000, 35), (2, 12,200000, 50), (2, 13, 40000, 15)
ON CONFLICT DO NOTHING;

-- CIMS
INSERT INTO hospital_services (hospital_id, service_id, price, wait_time_min) VALUES
(3, 1,  30000, 12), (3, 4,  48000, 12), (3, 5,  78000, 20),
(3, 6,  48000, 18), (3, 7, 350000, 28), (3, 8, 480000, 33),
(3, 9, 260000, 22), (3, 12,190000, 48), (3, 13, 38000, 12),
(3, 14,160000, 65), (3, 15,350000, 60)
ON CONFLICT DO NOTHING;

-- SAL
INSERT INTO hospital_services (hospital_id, service_id, price, wait_time_min) VALUES
(4, 1,  22000, 12), (4, 2,  48000, 18), (4, 3,  55000, 18),
(4, 4,  38000, 12), (4, 5,  65000, 18), (4, 6,  38000, 18),
(4, 7, 280000, 25), (4, 9, 200000, 22), (4, 11, 70000, 30),
(4, 13, 28000, 10), (4, 16,250000, 40)
ON CONFLICT DO NOTHING;

-- HCG
INSERT INTO hospital_services (hospital_id, service_id, price, wait_time_min) VALUES
(5, 7, 420000, 45), (5, 8, 550000, 50), (5, 9, 300000, 35),
(5, 16,280000, 45), (5, 20,850000, 60), (5, 19,380000, 90)
ON CONFLICT DO NOTHING;

-- ── Time Slots (next 7 days) ──────────────────────────────────────────────────
INSERT INTO time_slots (hospital_id, service_id, slot_date, slot_time, capacity)
SELECT
  h.id,
  s.id,
  (CURRENT_DATE + day_offset)::DATE,
  slot_time::TIME,
  3
FROM
  hospitals h,
  services s,
  generate_series(0, 6) AS day_offset,
  (VALUES ('09:00'), ('10:30'), ('12:00'), ('14:30'), ('16:00')) AS slots(slot_time)
WHERE EXISTS (
  SELECT 1 FROM hospital_services hs
  WHERE hs.hospital_id = h.id AND hs.service_id = s.id AND hs.is_available = TRUE
)
ON CONFLICT DO NOTHING;

-- ── Sample Admin User ─────────────────────────────────────────────────────────
-- password: Admin@123 (bcrypt hash)
INSERT INTO users (name, email, password_hash, role, is_verified) VALUES
('Apollo Admin', 'admin@mediprice.demo',
 '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'hospital_admin', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO hospital_admins (hospital_id, user_id)
SELECT h.id, u.id FROM hospitals h, users u
WHERE h.name LIKE 'Apollo%' AND u.email = 'admin@mediprice.demo'
ON CONFLICT DO NOTHING;

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW hospital_stats;