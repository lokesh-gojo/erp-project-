-- ==============================================================================
-- PREP-TRACK : Complete Supabase PostgreSQL Schema & Seed Migration
-- Target: Supabase SQL Editor
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. MYSQL COMPATIBILITY FUNCTIONS (Allows seamless execution of existing queries)
-- Function: TIMESTAMPDIFF in seconds
CREATE OR REPLACE FUNCTION TIMESTAMPDIFF(unit text, t1 timestamptz, t2 timestamptz)
RETURNS integer AS $$
BEGIN
  RETURN COALESCE(EXTRACT(EPOCH FROM (t2 - t1))::integer, 0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: RAND() / RAND(seed)
CREATE OR REPLACE FUNCTION RAND(seed double precision DEFAULT 0)
RETURNS double precision AS $$
BEGIN
  RETURN random();
END;
$$ LANGUAGE plpgsql;

-- 3. ENUMS & TYPES
DO $$ BEGIN
    CREATE TYPE topic_type AS ENUM ('regular', 'placement');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 4. ROLES TABLE
CREATE TABLE IF NOT EXISTS roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO roles (role_id, role_name) VALUES 
(1, 'student'),
(2, 'faculty'),
(3, 'hod'),
(4, 'vice_principal'),
(5, 'super-admin')
ON CONFLICT (role_id) DO NOTHING;

-- 5. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    short_name VARCHAR(50) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    hod_id INT DEFAULT NULL
);

INSERT INTO departments (id, short_name, full_name, hod_id) VALUES 
(1, 'EC1', 'ECE', 1060)
ON CONFLICT (id) DO NOTHING;

-- 6. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    roll_no VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    password TEXT,
    department_id INT REFERENCES departments(id) ON DELETE SET NULL,
    role_id INT REFERENCES roles(role_id) ON DELETE RESTRICT,
    year INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TOPICS TABLE
CREATE TABLE IF NOT EXISTS topics (
    topic_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    added_by INT REFERENCES users(id) ON DELETE SET NULL,
    by_admin SMALLINT DEFAULT 0,
    type topic_type DEFAULT 'regular',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SUB-TOPICS TABLE
CREATE TABLE IF NOT EXISTS sub_topics (
    sub_topic_id SERIAL PRIMARY KEY,
    topic_id INT NOT NULL REFERENCES topics(topic_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    added_by INT REFERENCES users(id) ON DELETE SET NULL,
    by_admin SMALLINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS questions (
    question_id SERIAL PRIMARY KEY,
    sub_topic_id INT REFERENCES sub_topics(sub_topic_id) ON DELETE CASCADE,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    by_admin SMALLINT DEFAULT 0,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option CHAR(1) CHECK (correct_option IN ('A', 'B', 'C', 'D')),
    mark INT DEFAULT 1,
    image_data TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TESTS TABLE
CREATE TABLE IF NOT EXISTS tests (
    test_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(255),
    added_by INT REFERENCES users(id) ON DELETE SET NULL,
    topic_id INT REFERENCES topics(topic_id) ON DELETE SET NULL,
    sub_topic_id INT REFERENCES sub_topics(sub_topic_id) ON DELETE SET NULL,
    num_questions INT NOT NULL,
    department_id INT REFERENCES departments(id) ON DELETE SET NULL,
    year VARCHAR(20),
    date DATE,
    time_slot VARCHAR(50),
    duration_minutes INT NOT NULL,
    is_active SMALLINT DEFAULT 0,
    total_marks INT DEFAULT 0,
    type topic_type DEFAULT 'regular',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. TEST QUESTIONS (MAPPING)
CREATE TABLE IF NOT EXISTS test_questions (
    id SERIAL PRIMARY KEY,
    test_id INT NOT NULL REFERENCES tests(test_id) ON DELETE CASCADE,
    question_id INT NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,
    UNIQUE(test_id, question_id)
);

-- 12. STUDENT TESTS (SESSIONS)
CREATE TABLE IF NOT EXISTS student_tests (
    student_test_id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_id INT NOT NULL REFERENCES tests(test_id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    score NUMERIC(5,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'started'
);

-- 13. STUDENT ANSWERS
CREATE TABLE IF NOT EXISTS student_answers (
    student_answers_id SERIAL PRIMARY KEY,
    student_test_id INT NOT NULL REFERENCES student_tests(student_test_id) ON DELETE CASCADE,
    question_id INT NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,
    answer VARCHAR(10),
    is_correct SMALLINT DEFAULT 0,
    marked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_test_id, question_id)
);

-- 14. LEADERBOARD TABLE
CREATE TABLE IF NOT EXISTS leaderboard (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    points NUMERIC(8,2) DEFAULT 0,
    quizzes_attended INT DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 15. ANALYTICS & FEEDBACK
CREATE TABLE IF NOT EXISTS analytics (
    analytics_id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_id INT NOT NULL REFERENCES tests(test_id) ON DELETE CASCADE,
    total_questions INT NOT NULL,
    attempted INT NOT NULL,
    correct_answers INT NOT NULL,
    wrong_answers INT NOT NULL,
    score NUMERIC(5,2) NOT NULL,
    percentage NUMERIC(5,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feedback (
    feedback_id SERIAL PRIMARY KEY,
    student_test_id INT REFERENCES student_tests(student_test_id) ON DELETE CASCADE,
    faculty_id INT REFERENCES users(id) ON DELETE SET NULL,
    comments TEXT,
    given_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 16. SUPABASE STORAGE BUCKET CONFIGURATION (for question images)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('question-images', 'question-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Question Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'question-images');

CREATE POLICY "Authenticated Users Upload Question Images"
ON storage.objects FOR INSERT
TO authenticated, anon
WITH CHECK (bucket_id = 'question-images');

-- ==============================================================================
-- 17. SEED DATA (Default Users, Topics, and VLSI Questions)
-- ==============================================================================

-- Super-admin user (Password: 123)
INSERT INTO users (id, roll_no, name, email, password, department_id, role_id, year)
VALUES (1, 'ECE001', 'super-admin', 'admin@ecetonline.com', '$2b$10$bFjFlFSmeBKUS8oKUWVWzuok.fkvU1hhpgEmLDl7P7qaIAHXovyWe', 1, 5, 1)
ON CONFLICT (id) DO NOTHING;

-- Faculty users
INSERT INTO users (id, roll_no, name, email, password, department_id, role_id, year)
VALUES 
(1060, 'EC1', 'Dr. Kaleeswari N', 'kaleeswari@ecetonline.com', '$2b$10$bFjFlFSmeBKUS8oKUWVWzuok.fkvU1hhpgEmLDl7P7qaIAHXovyWe', 1, 2, 0),
(1063, 'EC4', 'Mrs. Blesslin sheni J S', 'blesslinshenijs@ecetonline.com', '$2b$10$zABGDwE6629RzVOSTNLpCeXoCFXLRnjtnvYBYuEC2vU3./d0uJHr.', 1, 2, 0)
ON CONFLICT (id) DO NOTHING;

-- Demo Student users (Password: 123)
INSERT INTO users (id, roll_no, name, email, password, department_id, role_id, year)
VALUES 
(1093, '720523106031', 'THANGARAJ P', '720523106031@ecetonline.com', '$2b$10$FBMcTEieXzGiTfImdVtVjODAduV.YA3D/EUrF7yI.bR.z6Xl/Y.0C', 1, 1, 4),
(1094, '720523106032', 'THICHANAMOORTHY T', '720523106032@ecetonline.com', '$2b$10$dTdODdcSKQjGR6HFUSvgbevo2st.HMpgjs713.2IYs4MYPHZ9cDdq', 1, 1, 4)
ON CONFLICT (id) DO NOTHING;

-- Topics & Subtopics
INSERT INTO topics (topic_id, title, description, added_by, by_admin, type)
VALUES 
(1, 'VLSI', 'Very Large Scale Integration', 1063, 0, 'regular'),
(2, 'Aptitude', 'Placement Quantitative Aptitude & Reasoning', 1, 0, 'placement')
ON CONFLICT (topic_id) DO NOTHING;

INSERT INTO sub_topics (sub_topic_id, topic_id, title, description, added_by, by_admin)
VALUES 
(223, 1, 'Introduction to CMOS and Digital VLSI', 'Basics of gates and IC design', 1063, 0)
ON CONFLICT (sub_topic_id) DO NOTHING;

-- Sample Tests
INSERT INTO tests (test_id, title, description, subject, added_by, topic_id, sub_topic_id, num_questions, department_id, year, date, duration_minutes, is_active, total_marks, type)
VALUES 
(2, 'Activity - VLSI', 'Test on VLSI fundamentals', 'VLSI', 1063, 1, 223, 30, 1, '4', '2026-11-05', 30, 1, 30, 'regular'),
(3, 'Placement Aptitude 1', 'General aptitude & logical reasoning practice test', 'Aptitude', 1, 2, NULL, 25, 1, '4', '2026-11-05', 30, 1, 25, 'placement')
ON CONFLICT (test_id) DO NOTHING;

-- Questions Bank (50 Questions for VLSI)
INSERT INTO questions (question_id, sub_topic_id, created_by, by_admin, question_text, option_a, option_b, option_c, option_d, correct_option, mark)
VALUES 
(5028,223,1063,0,'What does VLSI stand for?','Very Large Scale Integration','Virtual Logic System Integration','Variable Large System Integration','Very Long System Interface','A',1),
(5029,223,1063,0,'Which transistor is mainly used in CMOS technology?','BJT','MOSFET','JFET','Diode','B',1),
(5030,223,1063,0,'What is the full form of CMOS?','Complementary Metal Oxide Semiconductor','Common Metal Oxide Semiconductor','Complementary MOS System','Computer Metal Oxide System','A',1),
(5031,223,1063,0,'Which logic gate gives output 1 only when both inputs are 1?','OR Gate','NOT Gate','AND Gate','XOR Gate','C',1),
(5032,223,1063,0,'Which software is commonly used for digital VLSI design and simulation?','Vivado','Photoshop','AutoCAD','Tally','A',1),
(5033,223,1063,0,'What is the basic building block of digital VLSI circuits?','Resistor','Capacitor','Logic Gate','Transformer','C',1),
(5034,223,1063,0,'Which of the following is a combinational circuit?','Flip-flop','Counter','Adder','Register','C',1),
(5035,223,1063,0,'Which of the following is a sequential circuit?','Multiplexer','Decoder','Flip-flop','Half Adder','C',1),
(5036,223,1063,0,'What is the main advantage of CMOS technology?','High power consumption','Low noise margin','Low power consumption','Large size','C',1),
(5037,223,1063,0,'What does FPGA stand for?','Field Programmable Gate Array','Fixed Programmable Gate Array','Field Programmed General Array','Fast Processing Gate Array','A',1),
(5038,223,1063,0,'Which of the following is used to store one bit of data?','Adder','Flip-flop','Decoder','MUX','B',1),
(5039,223,1063,0,'How many inputs does a NOT gate have?','1','2','3','4','A',1),
(5040,223,1063,0,'Which logic gate inverts the input?','AND Gate','OR Gate','NOT Gate','XOR Gate','C',1),
(5041,223,1063,0,'Which of the following is a universal gate?','AND','OR','NAND','XOR','C',1),
(5042,223,1063,0,'Which layer in IC fabrication is used for interconnections?','Metal layer','Substrate','Oxide layer','Diffusion layer','A',1),
(5043,223,1063,0,'Which material is most commonly used as a semiconductor in VLSI?','Copper','Silicon','Aluminium','Iron','B',1),
(5044,223,1063,0,'What is the output of an AND gate when one input is 0?','0','1','Depends on other input','Undefined','A',1),
(5045,223,1063,0,'What is the output of an OR gate when both inputs are 0?','1','0','Undefined','Depends on input','B',1),
(5046,223,1063,0,'Which gate is called an inverter?','NOR','NOT','NAND','XOR','B',1),
(5047,223,1063,0,'Which of the following is used in arithmetic circuits?','Adder','Latch','Decoder','Encoder','A',1),
(5048,223,1063,0,'What is the purpose of a multiplexer?','Store data','Select one input from many','Amplify signal','Invert signal','B',1),
(5049,223,1063,0,'What is the purpose of a decoder?','Convert binary to active output lines','Store bits','Add numbers','Multiply numbers','A',1),
(5050,223,1063,0,'Which circuit adds two binary bits?','Decoder','Half Adder','Latch','MUX','B',1),
(5051,223,1063,0,'Which circuit adds three binary bits including carry?','Encoder','Full Adder','Comparator','Register','B',1),
(5052,223,1063,0,'What is the binary output of a 2-input XOR gate when inputs are different?','0','1','2','Undefined','A',1),
(5053,223,1063,0,'What is the function of a register?','Store multiple bits','Add bits','Decode bits','Compare bits','A',1),
(5054,223,1063,0,'Which device triggers on a clock signal in sequential logic?','Resistor','Flip-flop','Capacitor','Diode','B',1),
(5055,223,1063,0,'Which of the following is a memory element?','Latch','AND gate','OR gate','XOR gate','A',1),
(5056,223,1063,0,'What is the function of a clock in digital circuits?','Increase voltage','Synchronize operations','Reduce power','Store data','B',1),
(5057,223,1063,0,'Which logic family is widely used in modern VLSI?','RTL','DTL','CMOS','TTL only','C',1),
(5058,223,1063,0,'What does MOSFET stand for?','Metal Oxide Semiconductor Field Effect Transistor','Metal Output Semiconductor Fast Electronic Transistor','Micro Oxide Silicon Field Effect Terminal','Metal Oxide Switching Field Emitter Transistor','A',1),
(5059,223,1063,0,'Which terminal of MOSFET controls current flow?','Drain','Source','Gate','Body','C',1),
(5060,223,1063,0,'In CMOS, PMOS and NMOS are used in what manner?','Only NMOS used','Only PMOS used','Complementary pair','Series resistor pair','C',1),
(5061,223,1063,0,'Which MOSFET type turns ON for positive gate voltage (with respect to source)?','PMOS','NMOS','BJT','Both PMOS and BJT','B',1),
(5062,223,1063,0,'Which MOSFET type is generally used to pull output to VDD in CMOS logic?','NMOS','PMOS','BJT','Diode','B',1),
(5063,223,1063,0,'What does propagation delay mean in digital circuits?','Power consumed by gate','Time taken for output to change after input changes','Chip area used','Clock frequency','B',1),
(5064,223,1063,0,'Which parameter is important for low-power VLSI design?','High leakage current','Low power consumption','Large transistor size','High temperature','B',1),
(5065,223,1063,0,'Which of the following is a programmable logic device?','FPGA','Resistor','Diode','Op-amp','A',1),
(5066,223,1063,0,'What is the main purpose of HDL in VLSI?','Drawing layouts only','Describing hardware behavior and structure','Measuring voltage','Fabricating wafers','B',1),
(5067,223,1063,0,'Which HDL is commonly used in VLSI design?','C language','Python','Verilog','Java','C',1),
(5068,223,1063,0,'Which HDL is also popular along with Verilog?','VHDL','HTML','SQL','PHP','A',1),
(5069,223,1063,0,'What is simulation in VLSI?','Manufacturing chip','Testing design behavior before hardware implementation','Packaging IC','Soldering components','B',1),
(5070,223,1063,0,'What is synthesis in VLSI?','Converting HDL into gate-level hardware representation','Drawing circuit on paper','Testing battery','Removing bugs manually','A',1),
(5071,223,1063,0,'Which of the following is a basic storage circuit?','Latch','MUX','Encoder','Comparator','A',1),
(5072,223,1063,0,'What is the output of NAND gate for inputs 1 and 1?','1','0','Depends on clock','Undefined','B',1),
(5073,223,1063,0,'What is the output of NOR gate for inputs 0 and 0?','0','1','Depends on input','Undefined','A',1),
(5074,223,1063,0,'Which testbench is used for?','Fabricating IC','Verifying HDL design through simulation','Powering FPGA board','Drawing PCB','B',1),
(5075,223,1063,0,'What is a truth table?','Table of transistor sizes','Table showing output for all input combinations','Chip layout table','Clock timing chart','B',1),
(5076,223,1063,0,'Which one is a common VLSI design flow step?','Specification','Cooking','Painting','Welding','A',1),
(5077,223,1063,0,'What is the final physical implementation stage in VLSI often called?','Place and Route','Typing','Printing','Etching only','A',1)
ON CONFLICT (question_id) DO NOTHING;

-- Map questions 5028..5057 to Test 2
INSERT INTO test_questions (test_id, question_id)
SELECT 2, q.question_id FROM questions q WHERE q.question_id BETWEEN 5028 AND 5057
ON CONFLICT DO NOTHING;

-- Synchronize sequences for autoincrement primary keys
SELECT setval(pg_get_serial_sequence('roles', 'role_id'), COALESCE(MAX(role_id), 1)) FROM roles;
SELECT setval(pg_get_serial_sequence('departments', 'id'), COALESCE(MAX(id), 1)) FROM departments;
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX(id), 1)) FROM users;
SELECT setval(pg_get_serial_sequence('topics', 'topic_id'), COALESCE(MAX(topic_id), 1)) FROM topics;
SELECT setval(pg_get_serial_sequence('sub_topics', 'sub_topic_id'), COALESCE(MAX(sub_topic_id), 1)) FROM sub_topics;
SELECT setval(pg_get_serial_sequence('questions', 'question_id'), COALESCE(MAX(question_id), 1)) FROM questions;
SELECT setval(pg_get_serial_sequence('tests', 'test_id'), COALESCE(MAX(test_id), 1)) FROM tests;
SELECT setval(pg_get_serial_sequence('test_questions', 'id'), COALESCE(MAX(id), 1)) FROM test_questions;
SELECT setval(pg_get_serial_sequence('student_tests', 'student_test_id'), COALESCE(MAX(student_test_id), 1)) FROM student_tests;
SELECT setval(pg_get_serial_sequence('student_answers', 'student_answers_id'), COALESCE(MAX(student_answers_id), 1)) FROM student_answers;
