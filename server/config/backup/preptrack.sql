CREATE DATABASE  IF NOT EXISTS `preptrack` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `preptrack`;
-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: preptrack
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `analytics`
--

DROP TABLE IF EXISTS `analytics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `analytics` (
  `analytics_id` int NOT NULL,
  `student_id` int NOT NULL,
  `test_id` int NOT NULL,
  `total_questions` int NOT NULL,
  `attempted` int NOT NULL,
  `correct_answers` int NOT NULL,
  `wrong_answers` int NOT NULL,
  `score` decimal(5,2) NOT NULL,
  `percentage` decimal(5,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `analytics`
--

LOCK TABLES `analytics` WRITE;
/*!40000 ALTER TABLE `analytics` DISABLE KEYS */;
/*!40000 ALTER TABLE `analytics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `short_name` varchar(50) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `hod_id` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'EC1','ECE',1060);
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feedback`
--

DROP TABLE IF EXISTS `feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedback` (
  `feedback_id` int NOT NULL,
  `student_test_id` int DEFAULT NULL,
  `faculty_id` int DEFAULT NULL,
  `comments` text,
  `given_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedback`
--

LOCK TABLES `feedback` WRITE;
/*!40000 ALTER TABLE `feedback` DISABLE KEYS */;
/*!40000 ALTER TABLE `feedback` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leaderboard`
--

DROP TABLE IF EXISTS `leaderboard`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leaderboard` (
  `leaderboard_id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `total_tests` int DEFAULT '0',
  `total_score` decimal(10,2) DEFAULT '0.00',
  `average_score` decimal(5,2) DEFAULT '0.00',
  `highest_score` decimal(5,2) DEFAULT '0.00',
  `rank_position` int DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `total_time_seconds` int DEFAULT '0',
  PRIMARY KEY (`leaderboard_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leaderboard`
--

LOCK TABLES `leaderboard` WRITE;
/*!40000 ALTER TABLE `leaderboard` DISABLE KEYS */;
/*!40000 ALTER TABLE `leaderboard` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_resets`
--

DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_resets` (
  `reset_id` int NOT NULL,
  `user_id` int NOT NULL,
  `otp` varchar(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `expires_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_resets`
--

LOCK TABLES `password_resets` WRITE;
/*!40000 ALTER TABLE `password_resets` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_resets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `questions`
--

DROP TABLE IF EXISTS `questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `questions` (
  `question_id` int NOT NULL AUTO_INCREMENT,
  `sub_topic_id` int DEFAULT NULL,
  `created_by` int NOT NULL,
  `by_admin` tinyint(1) DEFAULT '0',
  `question_text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `option_a` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `option_b` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `option_c` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `option_d` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `correct_option` enum('A','B','C','D') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `mark` int DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`question_id`),
  KEY `fk_sub_topic` (`sub_topic_id`),
  KEY `fk_created_by` (`created_by`),
  CONSTRAINT `fk_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_sub_topic` FOREIGN KEY (`sub_topic_id`) REFERENCES `sub_topics` (`sub_topic_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5179 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `questions`
--

LOCK TABLES `questions` WRITE;
/*!40000 ALTER TABLE `questions` DISABLE KEYS */;
INSERT INTO `questions` VALUES (5028,223,1063,0,'What does VLSI stand for?','Very Large Scale Integration','Virtual Logic System Integration','Variable Large System Integration','Very Long System Interface','A',1,'2026-07-05 10:17:10'),(5029,223,1063,0,'Which transistor is mainly used in CMOS technology?','BJT','MOSFET','JFET','Diode','B',1,'2026-07-05 10:17:10'),(5030,223,1063,0,'What is the full form of CMOS?','Complementary Metal Oxide Semiconductor','Common Metal Oxide Semiconductor','Complementary MOS System','Computer Metal Oxide System','A',1,'2026-07-05 10:17:10'),(5031,223,1063,0,'Which logic gate gives output 1 only when both inputs are 1?','OR Gate','NOT Gate','AND Gate','XOR Gate','C',1,'2026-07-05 10:17:10'),(5032,223,1063,0,'Which software is commonly used for digital VLSI design and simulation?','Vivado','Photoshop','AutoCAD','Tally','A',1,'2026-07-05 10:17:10'),(5033,223,1063,0,'What is the basic building block of digital VLSI circuits?','Resistor','Capacitor','Logic Gate','Transformer','C',1,'2026-07-05 10:17:10'),(5034,223,1063,0,'Which of the following is a combinational circuit?','Flip-flop','Counter','Adder','Register','C',1,'2026-07-05 10:17:10'),(5035,223,1063,0,'Which of the following is a sequential circuit?','Multiplexer','Decoder','Flip-flop','Half Adder','C',1,'2026-07-05 10:17:10'),(5036,223,1063,0,'What is the main advantage of CMOS technology?','High power consumption','Low noise margin','Low power consumption','Large size','C',1,'2026-07-05 10:17:10'),(5037,223,1063,0,'What does FPGA stand for?','Field Programmable Gate Array','Fixed Programmable Gate Array','Field Programmed General Array','Fast Processing Gate Array','A',1,'2026-07-05 10:17:10'),(5038,223,1063,0,'Which of the following is used to store one bit of data?','Adder','Flip-flop','Decoder','MUX','B',1,'2026-07-05 10:17:10'),(5039,223,1063,0,'How many inputs does a NOT gate have?','1','2','3','4','A',1,'2026-07-05 10:17:10'),(5040,223,1063,0,'Which logic gate inverts the input?','AND Gate','OR Gate','NOT Gate','XOR Gate','C',1,'2026-07-05 10:17:11'),(5041,223,1063,0,'Which of the following is a universal gate?','AND','OR','NAND','XOR','C',1,'2026-07-05 10:17:11'),(5042,223,1063,0,'Which layer in IC fabrication is used for interconnections?','Metal layer','Substrate','Oxide layer','Diffusion layer','A',1,'2026-07-05 10:17:11'),(5043,223,1063,0,'Which material is most commonly used as a semiconductor in VLSI?','Copper','Silicon','Aluminium','Iron','B',1,'2026-07-05 10:17:11'),(5044,223,1063,0,'What is the output of an AND gate when one input is 0?','0','1','Depends on other input','Undefined','A',1,'2026-07-05 10:17:11'),(5045,223,1063,0,'What is the output of an OR gate when both inputs are 0?','1','0','Undefined','Depends on input','B',1,'2026-07-05 10:17:11'),(5046,223,1063,0,'Which gate is called an inverter?','NOR','NOT','NAND','XOR','B',1,'2026-07-05 10:17:11'),(5047,223,1063,0,'Which of the following is used in arithmetic circuits?','Adder','Latch','Decoder','Encoder','A',1,'2026-07-05 10:17:11'),(5048,223,1063,0,'What is the purpose of a multiplexer?','Store data','Select one input from many','Amplify signal','Invert signal','B',1,'2026-07-05 10:17:11'),(5049,223,1063,0,'What is the purpose of a decoder?','Convert binary to active output lines','Store bits','Add numbers','Multiply numbers','A',1,'2026-07-05 10:17:11'),(5050,223,1063,0,'Which circuit adds two binary bits?','Decoder','Half Adder','Latch','MUX','B',1,'2026-07-05 10:17:11'),(5051,223,1063,0,'Which circuit adds three binary bits including carry?','Encoder','Full Adder','Comparator','Register','B',1,'2026-07-05 10:17:11'),(5052,223,1063,0,'What is the binary output of a 2-input XOR gate when inputs are different?','0','1','2','Undefined','A',1,'2026-07-05 10:17:11'),(5053,223,1063,0,'What is the function of a register?','Store multiple bits','Add bits','Decode bits','Compare bits','A',1,'2026-07-05 10:17:11'),(5054,223,1063,0,'Which device triggers on a clock signal in sequential logic?','Resistor','Flip-flop','Capacitor','Diode','B',1,'2026-07-05 10:17:11'),(5055,223,1063,0,'Which of the following is a memory element?','Latch','AND gate','OR gate','XOR gate','A',1,'2026-07-05 10:17:11'),(5056,223,1063,0,'What is the function of a clock in digital circuits?','Increase voltage','Synchronize operations','Reduce power','Store data','B',1,'2026-07-05 10:17:11'),(5057,223,1063,0,'Which logic family is widely used in modern VLSI?','RTL','DTL','CMOS','TTL only','C',1,'2026-07-05 10:17:11'),(5058,223,1063,0,'What does MOSFET stand for?','Metal Oxide Semiconductor Field Effect Transistor','Metal Output Semiconductor Fast Electronic Transistor','Micro Oxide Silicon Field Effect Terminal','Metal Oxide Switching Field Emitter Transistor','A',1,'2026-07-05 10:17:11'),(5059,223,1063,0,'Which terminal of MOSFET controls current flow?','Drain','Source','Gate','Body','C',1,'2026-07-05 10:17:11'),(5060,223,1063,0,'In CMOS, PMOS and NMOS are used in what manner?','Only NMOS used','Only PMOS used','Complementary pair','Series resistor pair','C',1,'2026-07-05 10:17:11'),(5061,223,1063,0,'Which MOSFET type turns ON for positive gate voltage (with respect to source)?','PMOS','NMOS','BJT','Both PMOS and BJT','B',1,'2026-07-05 10:17:11'),(5062,223,1063,0,'Which MOSFET type is generally used to pull output to VDD in CMOS logic?','NMOS','PMOS','BJT','Diode','B',1,'2026-07-05 10:17:11'),(5063,223,1063,0,'What does propagation delay mean in digital circuits?','Power consumed by gate','Time taken for output to change after input changes','Chip area used','Clock frequency','B',1,'2026-07-05 10:17:11'),(5064,223,1063,0,'Which parameter is important for low-power VLSI design?','High leakage current','Low power consumption','Large transistor size','High temperature','B',1,'2026-07-05 10:17:11'),(5065,223,1063,0,'Which of the following is a programmable logic device?','FPGA','Resistor','Diode','Op-amp','A',1,'2026-07-05 10:17:11'),(5066,223,1063,0,'What is the main purpose of HDL in VLSI?','Drawing layouts only','Describing hardware behavior and structure','Measuring voltage','Fabricating wafers','B',1,'2026-07-05 10:17:11'),(5067,223,1063,0,'Which HDL is commonly used in VLSI design?','C language','Python','Verilog','Java','C',1,'2026-07-05 10:17:11'),(5068,223,1063,0,'Which HDL is also popular along with Verilog?','VHDL','HTML','SQL','PHP','A',1,'2026-07-05 10:17:11'),(5069,223,1063,0,'What is simulation in VLSI?','Manufacturing chip','Testing design behavior before hardware implementation','Packaging IC','Soldering components','B',1,'2026-07-05 10:17:11'),(5070,223,1063,0,'What is synthesis in VLSI?','Converting HDL into gate-level hardware representation','Drawing circuit on paper','Testing battery','Removing bugs manually','A',1,'2026-07-05 10:17:11'),(5071,223,1063,0,'Which of the following is a basic storage circuit?','Latch','MUX','Encoder','Comparator','A',1,'2026-07-05 10:17:11'),(5072,223,1063,0,'What is the output of NAND gate for inputs 1 and 1?','1','0','Depends on clock','Undefined','B',1,'2026-07-05 10:17:11'),(5073,223,1063,0,'What is the output of NOR gate for inputs 0 and 0?','0','1','Depends on input','Undefined','A',1,'2026-07-05 10:17:11'),(5074,223,1063,0,'Which testbench is used for?','Fabricating IC','Verifying HDL design through simulation','Powering FPGA board','Drawing PCB','B',1,'2026-07-05 10:17:11'),(5075,223,1063,0,'What is a truth table?','Table of transistor sizes','Table showing output for all input combinations','Chip layout table','Clock timing chart','B',1,'2026-07-05 10:17:11'),(5076,223,1063,0,'Which one is a common VLSI design flow step?','Specification','Cooking','Painting','Welding','A',1,'2026-07-05 10:17:11'),(5077,223,1063,0,'What is the final physical implementation stage in VLSI often called?','Place and Route','Typing','Printing','Etching only','A',1,'2026-07-05 10:17:11'),(5078,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5079,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5080,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5081,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5082,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5083,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5084,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5085,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5086,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5087,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5088,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5089,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5090,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5091,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5092,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5093,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5094,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5095,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5096,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5097,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5098,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5099,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5100,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5101,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5102,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5103,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5104,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5105,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5106,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5107,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5108,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5109,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5110,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5111,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5112,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5113,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5114,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5115,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5116,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5117,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5118,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5119,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5120,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5121,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5122,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5123,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5124,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5125,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5126,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5127,NULL,1,0,'','','','','','A',1,'2026-07-05 10:39:28'),(5128,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5129,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5130,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5131,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5132,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5133,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5134,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5135,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5136,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5137,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5138,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5139,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5140,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5141,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5142,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5143,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5144,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5145,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5146,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5147,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5148,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5149,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5150,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5151,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5152,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5153,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5154,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5155,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5156,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5157,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5158,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5159,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5160,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5161,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5162,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5163,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5164,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5165,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5166,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5167,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5168,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5169,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5170,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5171,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5172,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5173,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5174,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5175,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5176,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5177,NULL,1,0,'','','','','','A',1,'2026-07-06 13:12:17'),(5178,NULL,1,1,'Test Question','A','B','C','D','A',1,'2026-07-06 13:38:40');
/*!40000 ALTER TABLE `questions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `role_id` int NOT NULL,
  `role_name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'student'),(2,'faculty'),(3,'hod'),(4,'vice_principal'),(5,'super-admin');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_answers`
--

DROP TABLE IF EXISTS `student_answers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_answers` (
  `student_answers_id` int NOT NULL AUTO_INCREMENT,
  `student_test_id` int NOT NULL,
  `question_id` int NOT NULL,
  `answer` text,
  `is_correct` tinyint(1) DEFAULT NULL,
  `marked_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`student_answers_id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_answers`
--

LOCK TABLES `student_answers` WRITE;
/*!40000 ALTER TABLE `student_answers` DISABLE KEYS */;
INSERT INTO `student_answers` VALUES (1,1,5071,'A',1,'2026-07-05 16:00:56'),(2,1,5042,'C',0,'2026-07-05 16:01:03'),(3,1,5065,'A',1,'2026-07-05 16:01:10'),(4,1,5075,'B',1,'2026-07-05 16:01:45'),(5,1,5046,'B',1,'2026-07-05 16:01:52'),(6,2,5042,'C',0,'2026-07-05 16:03:03'),(7,2,5065,'A',1,'2026-07-05 16:03:06'),(8,2,5075,'B',1,'2026-07-05 16:03:12'),(9,2,5046,'B',1,'2026-07-05 16:03:18'),(10,2,5071,'B',0,'2026-07-05 16:03:31'),(11,3,5073,'C',0,'2026-07-05 19:48:47'),(12,3,5071,'A',1,'2026-07-05 19:49:45'),(13,3,5035,'C',1,'2026-07-05 19:49:17'),(14,3,5044,'A',1,'2026-07-05 19:49:31'),(15,3,5055,'A',1,'2026-07-05 19:49:39'),(16,3,5067,'C',1,'2026-07-05 19:49:57'),(17,3,5031,'C',1,'2026-07-05 19:50:07'),(18,3,5076,'A',1,'2026-07-05 19:50:17'),(19,3,5077,'D',0,'2026-07-05 19:50:35'),(20,3,5040,'C',1,'2026-07-05 19:50:51'),(21,3,5043,'B',1,'2026-07-05 19:50:57'),(22,3,5049,'D',0,'2026-07-05 19:51:11'),(23,3,5068,'A',1,'2026-07-05 19:51:19'),(24,3,5063,'B',1,'2026-07-05 19:51:34'),(25,3,5053,'A',1,'2026-07-05 19:51:43');
/*!40000 ALTER TABLE `student_answers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_tests`
--

DROP TABLE IF EXISTS `student_tests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_tests` (
  `student_test_id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `test_id` int NOT NULL,
  `start_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `end_time` datetime DEFAULT NULL,
  `score` decimal(5,2) DEFAULT '0.00',
  `status` enum('started','completed') DEFAULT 'started',
  PRIMARY KEY (`student_test_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_tests`
--

LOCK TABLES `student_tests` WRITE;
/*!40000 ALTER TABLE `student_tests` DISABLE KEYS */;
INSERT INTO `student_tests` VALUES (1,1094,2,'2026-07-05 16:00:46','2026-07-05 16:01:54',80.00,'completed'),(2,1093,2,'2026-07-05 16:02:53','2026-07-05 16:03:40',60.00,'completed'),(3,1094,4,'2026-07-05 19:48:13','2026-07-05 19:51:45',80.00,'completed');
/*!40000 ALTER TABLE `student_tests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sub_topics`
--

DROP TABLE IF EXISTS `sub_topics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sub_topics` (
  `sub_topic_id` int NOT NULL AUTO_INCREMENT,
  `topic_id` int NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `added_by` int DEFAULT NULL,
  `by_admin` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`sub_topic_id`),
  KEY `fk_subtopic_topic` (`topic_id`),
  KEY `fk_subtopic_added_by` (`added_by`)
) ENGINE=InnoDB AUTO_INCREMENT=224 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sub_topics`
--

LOCK TABLES `sub_topics` WRITE;
/*!40000 ALTER TABLE `sub_topics` DISABLE KEYS */;
INSERT INTO `sub_topics` VALUES (3,3,'C++',NULL,15,0,'2026-01-31 09:49:50','2026-01-31 09:49:50'),(8,6,'Cloud',NULL,58,0,'2026-02-02 13:49:56','2026-02-02 13:49:56'),(9,7,'Python',NULL,58,0,'2026-02-02 13:52:55','2026-02-02 13:52:55'),(11,8,'Basics of C Programming',NULL,52,0,'2026-02-03 05:10:33','2026-02-03 05:10:33'),(12,9,'Semi conductors',NULL,75,0,'2026-02-03 05:59:54','2026-02-03 05:59:54'),(13,10,'sample 1',NULL,75,0,'2026-02-03 06:03:34','2026-02-03 06:03:34'),(15,12,'python Test',NULL,19,0,'2026-02-03 06:37:37','2026-02-03 06:37:37'),(16,13,'Thermal Engineering',NULL,42,0,'2026-02-03 07:32:50','2026-02-03 07:32:50'),(17,14,'grammar',NULL,26,0,'2026-02-03 07:38:29','2026-02-03 07:38:29'),(18,15,'Data Types and Variables',NULL,62,0,'2026-02-03 08:19:50','2026-02-03 08:19:50'),(19,17,'ml',NULL,61,0,'2026-02-03 08:51:59','2026-02-03 08:51:59'),(20,18,'sample1',NULL,64,0,'2026-02-03 09:04:08','2026-02-03 09:04:08'),(21,19,'cloud computing',NULL,56,0,'2026-02-03 09:15:38','2026-02-03 09:15:38'),(22,20,'UNIT-1',NULL,18,0,'2026-02-03 09:31:24','2026-02-03 09:31:24'),(25,23,'FZ',NULL,13,0,'2026-02-04 08:50:54','2026-02-04 08:50:54'),(26,24,'Voltage and current source',NULL,71,0,'2026-02-05 06:01:19','2026-02-05 06:01:19'),(28,25,'sources',NULL,77,0,'2026-02-05 07:35:25','2026-02-05 07:35:25'),(29,26,'Cloud Basics',NULL,13,0,'2026-02-06 04:29:11','2026-02-06 04:29:11'),(33,29,'C',NULL,15,0,'2026-02-07 09:39:10','2026-02-07 09:39:10'),(34,29,'C TEST',NULL,15,0,'2026-02-07 09:59:39','2026-02-07 09:59:39'),(35,30,'FS and FT',NULL,75,0,'2026-02-09 09:22:21','2026-02-09 09:22:21'),(36,31,'python Test',NULL,13,0,'2026-02-09 16:27:47','2026-02-09 16:27:47'),(37,8,'Control Flow Statements',NULL,52,0,'2026-02-10 05:27:51','2026-02-10 05:27:51'),(39,32,'GATE',NULL,13,0,'2026-02-16 10:22:30','2026-02-16 10:22:30'),(40,32,'DSA(important)',NULL,13,0,'2026-02-16 10:23:37','2026-02-16 10:23:37'),(41,33,'BASICS OF ML',NULL,13,0,'2026-02-16 10:46:23','2026-02-16 10:46:23'),(43,8,'Structure and Union',NULL,52,0,'2026-02-17 08:36:19','2026-02-17 08:36:19'),(44,34,'Amplitude modulation',NULL,75,0,'2026-02-17 09:52:36','2026-02-17 09:52:36'),(45,15,'Input, Output and Operators',NULL,62,0,'2026-02-17 12:25:07','2026-02-17 12:25:07'),(47,36,'Machines fundamentals',NULL,77,0,'2026-02-19 06:36:29','2026-02-19 06:36:29'),(51,37,'Constrction Material',NULL,11,0,'2026-02-20 13:45:02','2026-02-20 13:45:02'),(52,38,'PHYSICAL GEOLOGY AND GEOMORPHOLOGY  &  MINERALOGY AND PETROLOGY',NULL,11,0,'2026-02-20 13:49:18','2026-02-20 13:49:18'),(53,39,'BASICS',NULL,13,0,'2026-02-21 13:33:29','2026-02-21 13:33:29'),(54,40,'01',NULL,13,0,'2026-02-21 13:58:47','2026-02-21 13:58:47'),(55,41,'algebra & geomentry',NULL,13,0,'2026-02-23 12:43:43','2026-02-23 12:43:43'),(56,15,'Condition Statement',NULL,62,0,'2026-02-24 13:15:27','2026-02-24 13:15:27'),(58,8,'Conditional Statements',NULL,52,0,'2026-02-24 13:18:16','2026-02-24 13:18:16'),(59,42,'Intro to IC\'s',NULL,75,0,'2026-02-25 07:02:25','2026-02-25 07:02:25'),(60,42,'2.OP AMp',NULL,75,0,'2026-02-25 07:11:07','2026-02-25 07:11:07'),(62,43,'Digital Systems and Boolean Algebra',NULL,77,0,'2026-02-26 12:51:01','2026-02-26 12:51:01'),(63,44,'TEST1',NULL,26,0,'2026-02-27 05:07:59','2026-02-27 05:07:59'),(64,45,'TEST1',NULL,26,0,'2026-02-27 05:25:10','2026-02-27 05:25:10'),(65,46,'TEST1',NULL,26,0,'2026-02-27 05:29:35','2026-02-27 05:29:35'),(66,47,'Highway Engineering','Design of Highway Elements ',11,0,'2026-03-01 10:56:56','2026-03-01 10:56:56'),(67,48,'INFLUENCE LINES FOR INDETERMINATE BEAMS and INFLUENCE LINES FOR DETERMINATE BEAMS',NULL,11,0,'2026-03-01 11:02:36','2026-03-01 11:02:36'),(68,13,'Strength of Materials',NULL,42,0,'2026-03-02 06:14:18','2026-03-02 06:14:18'),(71,13,'Manufacturing Technology',NULL,42,0,'2026-03-02 06:19:30','2026-03-02 06:19:30'),(72,49,'friend fn,constructors',NULL,13,0,'2026-03-03 04:24:33','2026-03-03 04:24:33'),(73,50,'C++','C++',62,0,'2026-03-03 04:34:35','2026-03-03 04:34:35'),(74,3,'C++ TEST',NULL,15,0,'2026-03-03 04:54:13','2026-03-03 04:54:13'),(76,8,'Array and Pointers',NULL,52,0,'2026-03-03 10:31:57','2026-03-03 10:31:57'),(77,15,'Looping Statement',NULL,62,0,'2026-03-03 15:31:26','2026-03-03 15:31:26'),(78,9,'2.Diode',NULL,75,0,'2026-03-04 06:33:20','2026-03-04 06:33:20'),(79,43,'Sequential circuits',NULL,77,0,'2026-03-04 14:09:56','2026-03-04 14:09:56'),(80,52,'algebra',NULL,67,0,'2026-03-06 04:35:44','2026-03-06 04:35:44'),(81,53,'inverter',NULL,68,0,'2026-03-06 07:14:28','2026-03-06 07:14:28'),(82,54,'aabc',NULL,69,0,'2026-03-06 07:25:12','2026-03-06 07:25:12'),(83,14,'TEST2',NULL,26,0,'2026-03-06 07:48:35','2026-03-06 07:48:35'),(84,55,'frd fn',NULL,14,0,'2026-03-07 11:07:15','2026-03-07 11:07:15'),(85,56,'Test1',NULL,16,0,'2026-03-08 04:53:46','2026-03-08 04:53:46'),(86,57,'CLOUD SERVICE MODELS',NULL,13,0,'2026-03-09 05:20:42','2026-03-09 05:20:42'),(87,58,'Simplification',NULL,933,0,'2026-03-09 11:27:21','2026-03-09 11:27:21'),(88,56,'Placement Test -1',NULL,16,0,'2026-03-09 13:08:28','2026-03-09 13:08:28'),(89,56,'Placement Test -2nd Year',NULL,16,0,'2026-03-09 13:21:40','2026-03-09 13:21:40'),(90,56,'Placement Test -3nd Year',NULL,16,0,'2026-03-09 13:22:57','2026-03-09 13:22:57'),(91,59,'operators',NULL,55,0,'2026-03-10 05:07:39','2026-03-10 05:07:39'),(92,60,'Blood relation',NULL,77,0,'2026-03-10 09:29:51','2026-03-10 09:29:51'),(93,61,'Seating arrangement',NULL,77,0,'2026-03-10 09:32:28','2026-03-10 09:32:28'),(96,63,'ONLINE TEST',NULL,11,0,'2026-03-10 12:56:06','2026-03-10 12:56:06'),(97,64,'10.03',NULL,13,0,'2026-03-10 13:13:42','2026-03-10 13:13:42'),(98,65,'10.03',NULL,13,0,'2026-03-10 13:13:54','2026-03-10 13:13:54'),(99,66,'10.03',NULL,13,0,'2026-03-10 13:14:05','2026-03-10 13:14:05'),(101,67,'maths',NULL,26,0,'2026-03-10 13:26:57','2026-03-10 13:26:57'),(102,68,'Day 2 Aptitude',NULL,62,0,'2026-03-10 13:43:37','2026-03-10 13:43:37'),(105,69,'Seating Arrangement',NULL,52,0,'2026-03-10 13:46:32','2026-03-10 13:46:32'),(106,68,'Day 2 Aptitude III Year',NULL,62,0,'2026-03-10 13:46:54','2026-03-10 13:46:54'),(107,69,'Blood Relations',NULL,52,0,'2026-03-10 13:49:24','2026-03-10 13:49:24'),(108,69,'Clocks',NULL,52,0,'2026-03-10 13:51:22','2026-03-10 13:51:22'),(109,70,'simpli',NULL,16,0,'2026-03-11 04:26:07','2026-03-11 04:26:07'),(110,71,'Aptitude',NULL,967,0,'2026-03-11 06:41:58','2026-03-11 06:41:58'),(111,72,'Aptitude',NULL,967,0,'2026-03-11 06:42:35','2026-03-11 06:42:35'),(112,73,'Aptitude',NULL,967,0,'2026-03-11 06:43:01','2026-03-11 06:43:01'),(113,30,'sampling',NULL,75,0,'2026-03-11 10:09:59','2026-03-11 10:09:59'),(114,74,'Verbal Ability',NULL,967,0,'2026-03-12 07:38:02','2026-03-12 07:38:02'),(115,75,'Verbal Ability',NULL,967,0,'2026-03-12 07:39:10','2026-03-12 07:39:10'),(116,76,'Verbal Ability',NULL,967,0,'2026-03-12 07:39:38','2026-03-12 07:39:38'),(117,77,'Fundamental of Electronic devices',NULL,77,0,'2026-03-12 10:42:18','2026-03-12 10:42:18'),(119,79,'Logical Reasoning',NULL,967,0,'2026-03-13 08:23:34','2026-03-13 08:23:34'),(120,80,'Logical Reasoning',NULL,967,0,'2026-03-13 08:24:26','2026-03-13 08:24:26'),(121,81,'Logical Reasoning',NULL,967,0,'2026-03-13 08:25:13','2026-03-13 08:25:13'),(122,82,'TEST',NULL,26,0,'2026-03-14 04:52:59','2026-03-14 04:52:59'),(123,83,'python',NULL,26,0,'2026-03-14 05:45:35','2026-03-14 05:45:35'),(124,84,'Aptitude',NULL,967,0,'2026-03-14 07:04:24','2026-03-14 07:04:24'),(125,85,'Aptitude',NULL,967,0,'2026-03-14 07:05:53','2026-03-14 07:05:53'),(126,86,'Aptitude',NULL,967,0,'2026-03-14 07:07:19','2026-03-14 07:07:19'),(127,87,'Verbal Ability',NULL,967,0,'2026-03-16 07:21:51','2026-03-16 07:21:51'),(128,88,'Verbal Ability',NULL,967,0,'2026-03-16 07:23:02','2026-03-16 07:23:02'),(129,89,'Verbal Ability',NULL,967,0,'2026-03-16 07:23:51','2026-03-16 07:23:51'),(130,15,'ex',NULL,62,0,'2026-03-17 04:37:30','2026-03-17 04:37:30'),(131,90,'Logical Reasoning',NULL,967,0,'2026-03-17 07:41:26','2026-03-17 07:41:26'),(132,91,'Logical Reasoning',NULL,967,0,'2026-03-17 07:42:26','2026-03-17 07:42:26'),(133,92,'Logical Reasoning',NULL,967,0,'2026-03-17 07:42:57','2026-03-17 07:42:57'),(134,93,'Assignment 3-Measuring and maximizing email  campaign effectiveness',NULL,62,0,'2026-03-17 13:42:44','2026-03-17 13:42:44'),(135,94,'Assignment 3-Disk Scheduling and management',NULL,62,0,'2026-03-17 13:49:39','2026-03-17 13:49:39'),(138,96,'pointer',NULL,55,0,'2026-03-18 08:42:29','2026-03-18 08:42:29'),(139,97,'ISPIN TEST',NULL,63,0,'2026-03-18 09:24:52','2026-03-18 09:24:52'),(140,98,'Aptitude',NULL,967,0,'2026-03-18 10:43:14','2026-03-18 10:43:14'),(142,100,'Aptitude',NULL,967,0,'2026-03-18 10:45:11','2026-03-18 10:45:11'),(143,99,'Aptitude',NULL,967,0,'2026-03-18 15:16:45','2026-03-18 15:16:45'),(144,101,'Verbal Ability',NULL,967,0,'2026-03-19 10:53:26','2026-03-19 10:53:26'),(145,102,'Verbal Ability',NULL,967,0,'2026-03-19 10:56:10','2026-03-19 10:56:10'),(146,103,'Verbal Ability',NULL,967,0,'2026-03-19 10:57:07','2026-03-19 10:57:07'),(147,104,'Reasoning Ability',NULL,967,0,'2026-03-20 10:00:36','2026-03-20 10:00:36'),(148,105,'Reasoning Ability',NULL,967,0,'2026-03-20 10:01:44','2026-03-20 10:01:44'),(149,106,'Reasoning Ability',NULL,967,0,'2026-03-20 10:12:48','2026-03-20 10:12:48'),(150,107,'Aptitude',NULL,967,0,'2026-03-21 09:12:09','2026-03-21 09:12:09'),(151,108,'Aptitude',NULL,967,0,'2026-03-21 09:13:33','2026-03-21 09:13:33'),(153,109,'Aptitude',NULL,967,0,'2026-03-21 09:14:51','2026-03-21 09:14:51'),(154,110,'Verbal Ability',NULL,967,0,'2026-03-23 08:24:02','2026-03-23 08:24:02'),(155,111,'Verbal Ability',NULL,967,0,'2026-03-23 08:25:01','2026-03-23 08:25:01'),(156,112,'Verbal Ability',NULL,967,0,'2026-03-23 08:25:58','2026-03-23 08:25:58'),(157,113,'Reasoning Ability',NULL,967,0,'2026-03-24 10:33:05','2026-03-24 10:33:05'),(158,114,'Reasoning Ability',NULL,967,0,'2026-03-24 10:35:18','2026-03-24 10:35:18'),(159,115,'Reasoning Ability',NULL,967,0,'2026-03-24 10:36:36','2026-03-24 10:36:36'),(160,116,'Aptitude',NULL,967,0,'2026-03-25 06:04:57','2026-03-25 06:04:57'),(161,117,'Aptitude',NULL,967,0,'2026-03-25 06:05:42','2026-03-25 06:05:42'),(162,118,'Aptitude',NULL,967,0,'2026-03-25 06:06:29','2026-03-25 06:06:29'),(163,119,'union in c language',NULL,55,0,'2026-03-26 07:25:22','2026-03-26 07:25:22'),(164,120,'Verbal Ability',NULL,967,0,'2026-03-26 07:45:18','2026-03-26 07:45:18'),(165,121,'Verbal Ability',NULL,967,0,'2026-03-26 07:46:19','2026-03-26 07:46:19'),(166,122,'Verbal Ability',NULL,967,0,'2026-03-26 07:48:02','2026-03-26 07:48:02'),(167,124,'Reasoning',NULL,967,0,'2026-03-27 11:50:16','2026-03-27 11:50:16'),(168,125,'Reasoning',NULL,967,0,'2026-03-27 11:52:08','2026-03-27 11:52:08'),(169,126,'Reasoning',NULL,967,0,'2026-03-27 11:53:08','2026-03-27 11:53:08'),(170,13,'Hydraulics and Pneumatics',NULL,42,0,'2026-03-28 04:36:07','2026-03-28 04:36:07'),(171,128,'Aptitude',NULL,967,0,'2026-03-28 07:08:06','2026-03-28 07:08:06'),(172,129,'Aptitude',NULL,967,0,'2026-03-28 07:10:25','2026-03-28 07:10:25'),(174,130,'Aptitude',NULL,967,0,'2026-03-28 07:11:17','2026-03-28 07:11:17'),(175,131,'Verbal Ability',NULL,967,0,'2026-03-30 06:00:06','2026-03-30 06:00:06'),(176,132,'Verbal Ability',NULL,967,0,'2026-03-30 06:01:23','2026-03-30 06:01:23'),(177,133,'Verbal Ability',NULL,967,0,'2026-03-30 06:02:12','2026-03-30 06:02:12'),(178,134,'Reasoning Ability',NULL,967,0,'2026-03-31 08:36:00','2026-03-31 08:36:00'),(180,136,'Reasoning Ability',NULL,967,0,'2026-03-31 08:36:59','2026-03-31 08:36:59'),(181,135,'Reasoning Ability',NULL,967,0,'2026-03-31 08:43:06','2026-03-31 08:43:06'),(182,137,'Aptitude',NULL,967,0,'2026-04-01 08:51:11','2026-04-01 08:51:11'),(183,138,'Aptitude',NULL,967,0,'2026-04-01 08:59:03','2026-04-01 08:59:03'),(184,139,'Aptitude',NULL,967,0,'2026-04-01 08:59:45','2026-04-01 08:59:45'),(185,140,'Verbal Ability',NULL,967,0,'2026-04-02 07:14:58','2026-04-02 07:14:58'),(186,141,'Verbal Ability',NULL,967,0,'2026-04-02 07:15:54','2026-04-02 07:15:54'),(187,142,'Verbal Ability',NULL,967,0,'2026-04-02 07:20:03','2026-04-02 07:20:03'),(188,143,'Verbal Ability',NULL,967,0,'2026-04-06 09:39:11','2026-04-06 09:39:11'),(189,144,'Verbal Ability',NULL,967,0,'2026-04-06 09:45:37','2026-04-06 09:45:37'),(190,145,'Verbal Ability',NULL,967,0,'2026-04-06 09:46:30','2026-04-06 09:46:30'),(191,146,'Verbal Ability',NULL,967,0,'2026-04-07 06:50:37','2026-04-07 06:50:37'),(192,147,'Verbal Ability',NULL,967,0,'2026-04-07 06:51:46','2026-04-07 06:51:46'),(193,148,'Verbal Ability',NULL,967,0,'2026-04-07 06:52:32','2026-04-07 06:52:32'),(194,149,'DYANAMIC MEMORY ALLOCATION',NULL,55,0,'2026-04-07 08:06:47','2026-04-07 08:06:47'),(195,150,'FUNCTION',NULL,55,0,'2026-04-07 08:08:39','2026-04-07 08:08:39'),(196,151,'looping',NULL,55,0,'2026-04-07 08:17:21','2026-04-07 08:17:21'),(197,152,'general topic in c lang',NULL,55,0,'2026-04-07 08:21:40','2026-04-07 08:21:40'),(198,153,'decision making and control statements',NULL,55,0,'2026-04-07 08:26:27','2026-04-07 08:26:27'),(199,154,'memory management',NULL,55,0,'2026-04-07 08:31:56','2026-04-07 08:31:56'),(200,155,'Verbal Ability',NULL,967,0,'2026-04-08 10:24:08','2026-04-08 10:24:08'),(201,156,'Verbal Ability',NULL,967,0,'2026-04-08 10:25:46','2026-04-08 10:25:46'),(202,157,'Verbal Ability',NULL,967,0,'2026-04-08 10:26:45','2026-04-08 10:26:45'),(203,158,'Verbal Ability',NULL,967,0,'2026-04-09 07:08:54','2026-04-09 07:08:54'),(204,159,'Verbal Ability',NULL,967,0,'2026-04-09 07:09:49','2026-04-09 07:09:49'),(205,160,'Verbal Ability',NULL,967,0,'2026-04-09 07:10:34','2026-04-09 07:10:34'),(206,161,'Verbal Ability',NULL,967,0,'2026-04-10 10:17:25','2026-04-10 10:17:25'),(207,162,'Verbal Ability',NULL,967,0,'2026-04-10 10:18:14','2026-04-10 10:18:14'),(208,163,'Verbal Ability',NULL,967,0,'2026-04-10 10:19:10','2026-04-10 10:19:10'),(209,164,'Verbal Ability',NULL,967,0,'2026-04-11 10:35:07','2026-04-11 10:35:07'),(210,165,'Verbal Ability',NULL,967,0,'2026-04-11 10:36:08','2026-04-11 10:36:08'),(211,166,'Verbal Ability',NULL,967,0,'2026-04-11 10:36:47','2026-04-11 10:36:47'),(212,32,'QUIZ',NULL,13,0,'2026-04-11 14:29:37','2026-04-11 14:29:37'),(213,167,'Aptitude',NULL,967,0,'2026-04-16 09:57:02','2026-04-16 09:57:02'),(214,168,'Aptitude',NULL,967,0,'2026-04-16 09:58:17','2026-04-16 09:58:17'),(215,169,'Aptitude',NULL,967,0,'2026-04-16 09:59:02','2026-04-16 09:59:02'),(216,170,'Aptitude',NULL,967,0,'2026-04-17 06:54:00','2026-04-17 06:54:00'),(217,171,'Aptitude',NULL,967,0,'2026-04-17 06:54:51','2026-04-17 06:54:51'),(218,172,'Aptitude',NULL,967,0,'2026-04-17 06:55:57','2026-04-17 06:55:57'),(219,93,'Assignment 4-loyalty drivers',NULL,62,0,'2026-04-18 15:17:59','2026-04-18 15:17:59'),(220,94,'Assignment 4-mobile_os_',NULL,62,0,'2026-04-27 10:48:25','2026-04-27 10:48:25'),(222,174,'unit-1',NULL,62,0,'2026-07-01 13:29:15','2026-07-01 13:29:15'),(223,1,'indtroduction',NULL,1063,0,'2026-07-05 10:14:58','2026-07-05 10:14:58');
/*!40000 ALTER TABLE `sub_topics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `test_questions`
--

DROP TABLE IF EXISTS `test_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `test_questions` (
  `test_question_id` int NOT NULL AUTO_INCREMENT,
  `test_id` int NOT NULL,
  `question_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`test_question_id`),
  KEY `fk_test` (`test_id`),
  KEY `fk_question` (`question_id`)
) ENGINE=InnoDB AUTO_INCREMENT=161 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `test_questions`
--

LOCK TABLES `test_questions` WRITE;
/*!40000 ALTER TABLE `test_questions` DISABLE KEYS */;
INSERT INTO `test_questions` VALUES (1,1,5074,'2026-07-05 10:18:55'),(2,1,5070,'2026-07-05 10:18:55'),(3,1,5034,'2026-07-05 10:18:55'),(4,1,5051,'2026-07-05 10:18:55'),(5,1,5066,'2026-07-05 10:18:55'),(11,3,5078,'2026-07-05 10:39:28'),(12,3,5079,'2026-07-05 10:39:28'),(13,3,5080,'2026-07-05 10:39:28'),(14,3,5081,'2026-07-05 10:39:28'),(15,3,5082,'2026-07-05 10:39:28'),(16,3,5083,'2026-07-05 10:39:28'),(17,3,5084,'2026-07-05 10:39:28'),(18,3,5085,'2026-07-05 10:39:28'),(19,3,5086,'2026-07-05 10:39:28'),(20,3,5087,'2026-07-05 10:39:28'),(21,3,5088,'2026-07-05 10:39:28'),(22,3,5089,'2026-07-05 10:39:28'),(23,3,5090,'2026-07-05 10:39:28'),(24,3,5091,'2026-07-05 10:39:28'),(25,3,5092,'2026-07-05 10:39:28'),(26,3,5093,'2026-07-05 10:39:28'),(27,3,5094,'2026-07-05 10:39:28'),(28,3,5095,'2026-07-05 10:39:28'),(29,3,5096,'2026-07-05 10:39:28'),(30,3,5097,'2026-07-05 10:39:28'),(31,3,5098,'2026-07-05 10:39:28'),(32,3,5099,'2026-07-05 10:39:28'),(33,3,5100,'2026-07-05 10:39:28'),(34,3,5101,'2026-07-05 10:39:28'),(35,3,5102,'2026-07-05 10:39:28'),(36,3,5103,'2026-07-05 10:39:28'),(37,3,5104,'2026-07-05 10:39:28'),(38,3,5105,'2026-07-05 10:39:28'),(39,3,5106,'2026-07-05 10:39:28'),(40,3,5107,'2026-07-05 10:39:28'),(41,3,5108,'2026-07-05 10:39:28'),(42,3,5109,'2026-07-05 10:39:28'),(43,3,5110,'2026-07-05 10:39:28'),(44,3,5111,'2026-07-05 10:39:28'),(45,3,5112,'2026-07-05 10:39:28'),(46,3,5113,'2026-07-05 10:39:28'),(47,3,5114,'2026-07-05 10:39:28'),(48,3,5115,'2026-07-05 10:39:28'),(49,3,5116,'2026-07-05 10:39:28'),(50,3,5117,'2026-07-05 10:39:28'),(51,3,5118,'2026-07-05 10:39:28'),(52,3,5119,'2026-07-05 10:39:28'),(53,3,5120,'2026-07-05 10:39:28'),(54,3,5121,'2026-07-05 10:39:28'),(55,3,5122,'2026-07-05 10:39:28'),(56,3,5123,'2026-07-05 10:39:28'),(57,3,5124,'2026-07-05 10:39:28'),(58,3,5125,'2026-07-05 10:39:28'),(59,3,5126,'2026-07-05 10:39:28'),(60,3,5127,'2026-07-05 10:39:28'),(66,2,5042,'2026-07-05 14:15:04'),(67,2,5056,'2026-07-05 14:15:04'),(68,2,5055,'2026-07-05 14:15:04'),(69,2,5044,'2026-07-05 14:15:04'),(70,2,5054,'2026-07-05 14:15:04'),(71,2,5033,'2026-07-05 14:15:04'),(72,2,5072,'2026-07-05 14:15:04'),(73,2,5074,'2026-07-05 14:15:04'),(74,2,5061,'2026-07-05 14:15:04'),(75,2,5076,'2026-07-05 14:15:04'),(76,2,5052,'2026-07-05 14:15:04'),(77,2,5051,'2026-07-05 14:15:04'),(78,2,5048,'2026-07-05 14:15:04'),(79,2,5041,'2026-07-05 14:15:04'),(80,2,5053,'2026-07-05 14:15:04'),(81,2,5066,'2026-07-05 14:15:04'),(82,2,5034,'2026-07-05 14:15:04'),(83,2,5058,'2026-07-05 14:15:04'),(84,2,5037,'2026-07-05 14:15:04'),(85,2,5062,'2026-07-05 14:15:04'),(86,2,5031,'2026-07-05 14:15:04'),(87,2,5077,'2026-07-05 14:15:04'),(88,2,5039,'2026-07-05 14:15:04'),(89,2,5075,'2026-07-05 14:15:04'),(90,2,5073,'2026-07-05 14:15:04'),(91,2,5030,'2026-07-05 14:15:04'),(92,2,5065,'2026-07-05 14:15:04'),(93,2,5046,'2026-07-05 14:15:04'),(94,2,5069,'2026-07-05 14:15:04'),(95,2,5035,'2026-07-05 14:15:04'),(96,4,5068,'2026-07-05 14:17:42'),(97,4,5053,'2026-07-05 14:17:42'),(98,4,5073,'2026-07-05 14:17:42'),(99,4,5077,'2026-07-05 14:17:42'),(100,4,5067,'2026-07-05 14:17:42'),(101,4,5055,'2026-07-05 14:17:42'),(102,4,5043,'2026-07-05 14:17:42'),(103,4,5049,'2026-07-05 14:17:42'),(104,4,5040,'2026-07-05 14:17:42'),(105,4,5035,'2026-07-05 14:17:42'),(106,4,5044,'2026-07-05 14:17:42'),(107,4,5063,'2026-07-05 14:17:42'),(108,4,5031,'2026-07-05 14:17:42'),(109,4,5076,'2026-07-05 14:17:42'),(110,4,5071,'2026-07-05 14:17:42'),(111,5,5128,'2026-07-06 13:12:17'),(112,5,5129,'2026-07-06 13:12:17'),(113,5,5130,'2026-07-06 13:12:17'),(114,5,5131,'2026-07-06 13:12:17'),(115,5,5132,'2026-07-06 13:12:17'),(116,5,5133,'2026-07-06 13:12:17'),(117,5,5134,'2026-07-06 13:12:17'),(118,5,5135,'2026-07-06 13:12:17'),(119,5,5136,'2026-07-06 13:12:17'),(120,5,5137,'2026-07-06 13:12:17'),(121,5,5138,'2026-07-06 13:12:17'),(122,5,5139,'2026-07-06 13:12:17'),(123,5,5140,'2026-07-06 13:12:17'),(124,5,5141,'2026-07-06 13:12:17'),(125,5,5142,'2026-07-06 13:12:17'),(126,5,5143,'2026-07-06 13:12:17'),(127,5,5144,'2026-07-06 13:12:17'),(128,5,5145,'2026-07-06 13:12:17'),(129,5,5146,'2026-07-06 13:12:17'),(130,5,5147,'2026-07-06 13:12:17'),(131,5,5148,'2026-07-06 13:12:17'),(132,5,5149,'2026-07-06 13:12:17'),(133,5,5150,'2026-07-06 13:12:17'),(134,5,5151,'2026-07-06 13:12:17'),(135,5,5152,'2026-07-06 13:12:17'),(136,5,5153,'2026-07-06 13:12:17'),(137,5,5154,'2026-07-06 13:12:17'),(138,5,5155,'2026-07-06 13:12:17'),(139,5,5156,'2026-07-06 13:12:17'),(140,5,5157,'2026-07-06 13:12:17'),(141,5,5158,'2026-07-06 13:12:17'),(142,5,5159,'2026-07-06 13:12:17'),(143,5,5160,'2026-07-06 13:12:17'),(144,5,5161,'2026-07-06 13:12:17'),(145,5,5162,'2026-07-06 13:12:17'),(146,5,5163,'2026-07-06 13:12:17'),(147,5,5164,'2026-07-06 13:12:17'),(148,5,5165,'2026-07-06 13:12:17'),(149,5,5166,'2026-07-06 13:12:17'),(150,5,5167,'2026-07-06 13:12:17'),(151,5,5168,'2026-07-06 13:12:17'),(152,5,5169,'2026-07-06 13:12:17'),(153,5,5170,'2026-07-06 13:12:17'),(154,5,5171,'2026-07-06 13:12:17'),(155,5,5172,'2026-07-06 13:12:17'),(156,5,5173,'2026-07-06 13:12:17'),(157,5,5174,'2026-07-06 13:12:17'),(158,5,5175,'2026-07-06 13:12:17'),(159,5,5176,'2026-07-06 13:12:17'),(160,5,5177,'2026-07-06 13:12:17');
/*!40000 ALTER TABLE `test_questions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tests`
--

DROP TABLE IF EXISTS `tests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tests` (
  `test_id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `subject` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `added_by` int NOT NULL,
  `topic_id` int NOT NULL,
  `sub_topic_id` int DEFAULT NULL,
  `num_questions` int DEFAULT '0',
  `department_id` int DEFAULT NULL,
  `year` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `date` date DEFAULT NULL,
  `time_slot` time DEFAULT NULL,
  `total_marks` int NOT NULL,
  `duration_minutes` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '1',
  `type` enum('regular','placement') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'regular',
  PRIMARY KEY (`test_id`),
  KEY `fk_tests_added_by` (`added_by`),
  KEY `fk_tests_topic` (`topic_id`),
  KEY `fk_tests_sub_topic` (`sub_topic_id`),
  KEY `fk_tests_department` (`department_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tests`
--

LOCK TABLES `tests` WRITE;
/*!40000 ALTER TABLE `tests` DISABLE KEYS */;
INSERT INTO `tests` VALUES (2,'Activity -VLSI','','VLSI',1063,1,223,30,1,'4','2026-07-05',NULL,30,10,'2026-07-05 10:30:18',1,'regular'),(3,'Basic Applitude','','Applitude',1,2,NULL,50,NULL,NULL,NULL,NULL,50,NULL,'2026-07-05 10:39:28',1,'placement'),(4,'vlsi ad-','','VLSI',1063,1,223,15,1,'4','2026-07-05',NULL,15,7,'2026-07-05 14:17:42',1,'regular'),(5,'BASIC APP','','BASIC APP',1,2,NULL,50,NULL,NULL,NULL,NULL,50,NULL,'2026-07-06 13:12:17',1,'placement');
/*!40000 ALTER TABLE `tests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `topics`
--

DROP TABLE IF EXISTS `topics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `topics` (
  `topic_id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `added_by` int DEFAULT NULL,
  `by_admin` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `type` enum('regular','placement') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'regular',
  PRIMARY KEY (`topic_id`),
  KEY `fk_topic_added_by` (`added_by`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `topics`
--

LOCK TABLES `topics` WRITE;
/*!40000 ALTER TABLE `topics` DISABLE KEYS */;
INSERT INTO `topics` VALUES (1,'vlsi',NULL,1063,0,'2026-07-05 10:14:33','2026-07-05 10:14:33','regular'),(2,'Applitude',NULL,1,0,'2026-07-05 10:37:44','2026-07-05 10:37:44','placement');
/*!40000 ALTER TABLE `topics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `roll_no` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `year` int NOT NULL DEFAULT '0',
  `role_id` int NOT NULL,
  `department_id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_role` (`role_id`),
  KEY `fk_department` (`department_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1096 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'ECE001','super-admin',NULL,'$2b$10$bFjFlFSmeBKUS8oKUWVWzuok.fkvU1hhpgEmLDl7P7qaIAHXovyWe',5,5,1,'2026-07-05 10:10:17','2026-07-05 10:11:06'),(982,'E720524EC001','Aakash G','720524EC001@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(983,'E720524EC002','Akash K','720524EC002@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(984,'E720524EC003','Archana A','720524EC003@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(985,'E720524EC004','Arivarasu C','720524EC004@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(986,'E720524EC005','Azhaguraja S','720524EC005@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(987,'E720524EC006','Bala manikandan R','720524EC006@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(988,'E720524EC007','Baranidharan G','720524EC007@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(989,'E720524EC008','Bavya K','720524EC008@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(990,'E720524EC009','Bhavadharani D S','720524EC009@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(991,'E720524EC010','Deepak S','720524EC010@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(992,'E720524EC013','Jeeva E','720524EC013@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(993,'E720524EC014','Jeyson A','720524EC014@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(994,'E720524EC015','Jothisri S','720524EC015@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(995,'E720524EC017','Kamalnath V','720524EC017@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(996,'E720524EC018','Karthikeyan K','720524EC018@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(997,'E720524EC019','Karuppaiya A','720524EC019@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(998,'E720524EC020','kathirvelan R M','720524EC020@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(999,'E720524EC021','Keerthi manikandan B','720524EC021@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(1000,'E720524EC022','Keerthipriya G','720524EC022@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(1001,'E720524EC023','Madhumitha C P','720524EC023@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(1002,'E720524EC024','Mathivathana M','720524EC024@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(1003,'E720524EC025','Meganathan p','720524EC025@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(1004,'E720524EC026','Murugadass B','720524EC026@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(1005,'E720524EC027','Muthukrishnan K','720524EC027@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(1006,'E720524EC028','Nafeel ashraf M','720524EC028@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(1007,'E720524EC029','Naren P','720524EC029@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(1008,'E720524EC030','Perarasu K','720524EC030@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(1009,'E720524EC031','Prakash V','720524EC031@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(1010,'E720524EC032','Prasanth A','720524EC032@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(1011,'E720524EC033','Ragavan M','720524EC033@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(1012,'E720524EC034','Raj kumar G','720524EC034@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(1013,'E720524EC035','Ranijth kumar B','720524EC035@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(1014,'E720524EC036','Rekha S','720524EC036@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(1015,'E720524EC037','Rishal V','720524EC037@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(1016,'E720524EC038','Sanjai R','720524EC038@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(1017,'E720524EC039','Sanjay kumar','720524EC039@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(1018,'E720524EC040','Saran kumar M','720524EC040@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(1019,'E720524EC041','Shalinidevi M','720524EC041@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(1020,'E720524EC042','Siva ruban B','720524EC042@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(1021,'E720524EC043','Sree madhan V','720524EC043@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(1022,'E720524EC044','Sreeram S K','720524EC044@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(1023,'E720524EC045','Sri ram S','720524EC045@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(1024,'E720524EC046','Thavasheela K','720524EC046@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(1025,'E720524EC047','Varshan R','720524EC047@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(1026,'E720524EC048','Varshini R','720524EC048@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(1027,'E720524EC049','Vishnuvihaas S P','720524EC049@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(1028,'E720524EC050','Yogarajan C','720524EC050@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(1029,'E720524EC051','yuvaasri M','720524EC051@ecetonline.com',NULL,3,1,1,'2026-07-05 09:52:50','2026-07-05 09:52:50'),(1060,'EC1','Dr. Kaleeswari N','kaleeswari@ecetonline.com',NULL,0,2,1,'2026-07-05 09:57:40','2026-07-05 10:00:29'),(1061,'EC2','Mrs. Angeline Felicia J','angelinefeliciaj@ecetonline.com',NULL,0,2,1,'2026-07-05 09:59:49','2026-07-05 09:59:49'),(1062,'EC3','Dr. Shanthin S','shanthins@ecetonline.com',NULL,0,2,1,'2026-07-05 10:00:06','2026-07-05 10:00:06'),(1063,'EC4','Mrs. Blesslin sheni J S','blesslinshenijs@ecetonline.com','$2b$10$zABGDwE6629RzVOSTNLpCeXoCFXLRnjtnvYBYuEC2vU3./d0uJHr.',0,2,1,'2026-07-05 10:00:52','2026-07-05 10:13:22'),(1064,'EC5','Mrs. Sangeetha Gopinath','sangeethagopinath@ecetonline.com',NULL,0,2,1,'2026-07-05 10:01:22','2026-07-05 10:01:22'),(1065,'EC6','Mrs. Nisha M T','nishamt@ecetonline.com',NULL,0,2,1,'2026-07-05 10:01:44','2026-07-05 10:01:44'),(1066,'720523106001','ABISHEK L','720523106001@ecetonline.com',NULL,4,1,1,'2026-07-05 10:11:40','2026-07-05 10:11:40'),(1067,'720523106002','AROCKIA RAJA PANDI K','720523106002@ecetonline.com',NULL,4,1,1,'2026-07-05 10:11:40','2026-07-05 10:11:40'),(1068,'720523106003','ARUN KUMAR M','720523106003@ecetonline.com',NULL,4,1,1,'2026-07-05 10:11:40','2026-07-05 10:11:40'),(1069,'720523106004','DHANALAKSHMI G','720523106004@ecetonline.com',NULL,4,1,1,'2026-07-05 10:11:40','2026-07-05 10:11:40'),(1070,'720523106005','DHANUSH M. V','720523106005@ecetonline.com',NULL,4,1,1,'2026-07-05 10:11:40','2026-07-05 10:11:40'),(1071,'720523106006','ELUMALAI K','720523106006@ecetonline.com',NULL,4,1,1,'2026-07-05 10:11:40','2026-07-05 10:11:40'),(1072,'720523106007','JANANI P','720523106007@ecetonline.com',NULL,4,1,1,'2026-07-05 10:11:40','2026-07-05 10:11:40'),(1073,'720523106008','JEEVAN T','720523106008@ecetonline.com',NULL,4,1,1,'2026-07-05 10:11:40','2026-07-05 10:11:40'),(1074,'720523106010','KUMARAVEL M','720523106010@ecetonline.com',NULL,4,1,1,'2026-07-05 10:11:40','2026-07-05 10:11:40'),(1075,'720523106012','MUTHUKUMAR S','720523106012@ecetonline.com',NULL,4,1,1,'2026-07-05 10:11:40','2026-07-05 10:11:40'),(1076,'720523106013','NANTHA KUMAR J','720523106013@ecetonline.com',NULL,4,1,1,'2026-07-05 10:11:40','2026-07-05 10:11:40'),(1077,'720523106015','NIRANJAN T','720523106015@ecetonline.com',NULL,4,1,1,'2026-07-05 10:11:40','2026-07-05 10:11:40'),(1078,'720523106016','PERIYASAMY S','720523106016@ecetonline.com',NULL,4,1,1,'2026-07-05 10:11:40','2026-07-05 10:11:40'),(1079,'720523106017','PRADEEP S','720523106017@ecetonline.com',NULL,4,1,1,'2026-07-05 10:11:40','2026-07-05 10:11:40'),(1080,'720523106018','PRAKASH S','720523106018@ecetonline.com',NULL,4,1,1,'2026-07-05 10:11:40','2026-07-05 10:11:40'),(1081,'720523106019','RAGUL D','720523106019@ecetonline.com',NULL,4,1,1,'2026-07-05 10:11:40','2026-07-05 10:11:40'),(1082,'720523106020','RANJITH K','720523106020@ecetonline.com',NULL,4,1,1,'2026-07-05 10:11:40','2026-07-05 10:11:40'),(1083,'720523106021','RASAPANDI M','720523106021@ecetonline.com',NULL,4,1,1,'2026-07-05 10:11:40','2026-07-05 10:11:40'),(1084,'720523106022','RATHIKA A','720523106022@ecetonline.com',NULL,4,1,1,'2026-07-05 10:11:40','2026-07-05 10:11:40'),(1085,'720523106023','RESHMA M. V','720523106023@ecetonline.com',NULL,4,1,1,'2026-07-05 10:11:40','2026-07-05 10:11:40'),(1086,'720523106024','SANJAY D','720523106024@ecetonline.com',NULL,4,1,1,'2026-07-05 10:11:40','2026-07-05 10:11:40'),(1087,'720523106025','SANJEEV RAJAN P','720523106025@ecetonline.com',NULL,4,1,1,'2026-07-05 10:11:40','2026-07-05 10:11:40'),(1088,'720523106026','SANTHANA PANDI G','720523106026@ecetonline.com',NULL,4,1,1,'2026-07-05 10:11:40','2026-07-05 10:11:40'),(1089,'720523106027','SATHISH KUMAR K','720523106027@ecetonline.com',NULL,4,1,1,'2026-07-05 10:11:40','2026-07-05 10:11:40'),(1090,'720523106028','SHARMILA A','720523106028@ecetonline.com',NULL,4,1,1,'2026-07-05 10:11:40','2026-07-05 10:11:40'),(1091,'720523106029','SURYA S','720523106029@ecetonline.com',NULL,4,1,1,'2026-07-05 10:11:40','2026-07-05 10:11:40'),(1092,'720523106030','SURYA PRAKASH S','720523106030@ecetonline.com',NULL,4,1,1,'2026-07-05 10:11:40','2026-07-05 10:11:40'),(1093,'720523106031','THANGARAJ P','720523106031@ecetonline.com','$2b$10$FBMcTEieXzGiTfImdVtVjODAduV.YA3D/EUrF7yI.bR.z6Xl/Y.0C',4,1,1,'2026-07-05 10:11:40','2026-07-05 10:32:33'),(1094,'720523106032','THICHANAMOORTHY T','720523106032@ecetonline.com','$2b$10$dTdODdcSKQjGR6HFUSvgbevo2st.HMpgjs713.2IYs4MYPHZ9cDdq',4,1,1,'2026-07-05 10:11:40','2026-07-05 10:12:43'),(1095,'720523106033','VEERATHIRIKUDAPATHY R','720523106033@ecetonline.com',NULL,4,1,1,'2026-07-05 10:11:40','2026-07-05 10:11:40');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-06 19:27:13
