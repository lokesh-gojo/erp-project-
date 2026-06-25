# Student Marks and Scoring System Summary

This document summarizes how student marks are stored, calculated, displayed, and managed throughout the application lifecycle.

## 1. Data Storage (How Marks are Stored)

Student marks and test submissions are managed across several database tables:

*   **`student_answers`**: Stores individual question responses.
    *   **Fields**: `student_test_id`, `question_id`, `answer` (the selected option like 'A', 'B', 'C', 'D'), `is_correct` (1 for correct, 0 for incorrect).
    *   **Behavior**: When a student answers a question, it checks the submitted option against the `correct_option` in the `questions` table and immediately saves it as a 0 or 1.
*   **`student_tests`**: Represents a single test session for a student.
    *   **Fields**: `student_test_id`, `student_id`, `test_id`, `start_time`, `end_time`, `score`, `status` ('started', 'in_progress', 'completed').
    *   **Behavior**: The `score` field stores the final percentage (out of 100) achieved in the test.
*   **`leaderboard`**: Stores aggregated statistics per student.
    *   **Fields**: `student_id`, `total_tests`, `total_score`, `average_score`, `highest_score`, `total_time_seconds`, `rank_position`.

## 2. Score Calculation

Scores are calculated strictly upon test submission in `server/controllers/quizFunction.js` (`submitTest` and `calculateAndSaveScore`):

1.  **Count Correct Answers**: The backend queries the `student_answers` table and counts how many distinct questions have `is_correct = 1` for the specific `student_test_id`.
2.  **Calculate Percentage**: 
    ```javascript
    const finalScoreValue = Math.min(100, Number(((correctCount / totalQuestions) * 100).toFixed(2)));
    ```
    The score is calculated as a pure percentage `(Correct Answers / Total Questions) * 100`. The individual `mark` field in the `questions` table is currently bypassed in favor of a uniform weight per question.
3.  **Update Record**: The `student_tests` table is updated with the `end_time`, `score`, and `status = 'completed'`.

## 3. Grading and Percentage Display

Currently, the system predominantly uses the percentage value and a predefined Pass/Fail threshold rather than explicitly assigning A/B/C grades.

*   **Pass Rate Threshold**: A score of **60% or higher** is hardcoded as the passing metric (`CASE WHEN st.score >= 60 THEN 1 END`) in the reporting queries.
*   **Accuracy Display**: Displayed as `ROUND(st.score, 2)`.
*   **Display Logic**: In the UI components (like `ReportsSectionUI`), scores are presented as:
    *   `percentage`: `LEAST(100, ROUND(st.score, 2))`
    *   `rawScore`: Calculated back from percentage: `ROUND((st.score / 100) * t.num_questions)`

> [!TIP]
> **Implementing Grades:** To display letter grades (A, B, C, etc.), you would typically add a frontend helper function or a backend SQL mapping like:
> *   `>= 90`: A
> *   `>= 80`: B
> *   `>= 70`: C
> *   `>= 60`: D
> *   `< 60`: F (Fail)

## 4. CRUD Flow for Test Submissions

### Create / Read (Test Session Initialization)
*   **Endpoint**: `GET /api/quiz/start/:testId`
*   **Action**: Inserts a new row into `student_tests` with `start_time = NOW()` and `status = 'started'`. Returns the `student_test_id`.

### Update (Answering Questions)
*   **Endpoint**: `POST /api/quiz/save-answer`
*   **Action**: Takes `student_test_id`, `question_id`, and `answer`. Evaluates if the answer is correct against the DB. 
*   **Upsert**: Checks if an answer already exists for that question. If yes, it updates `answer`, `is_correct`, and `marked_at`. If no, it inserts a new row into `student_answers`.

### Finalize (Submitting Test)
*   **Endpoint**: `POST /api/quiz/submit`
*   **Action**: 
    1. Validates the test session.
    2. Calculates the final score percentage based on `student_answers`.
    3. Updates `student_tests` with `end_time` and the final `score`.
    4. Triggers `syncLeaderboard()` to update the student's aggregate stats and recalculate the global ranks for all users.

### Read (Reports and Analytics)
*   **Endpoints**: `GET /api/reports/student/:studentId`, `GET /api/reports/test/:testId`, etc.
*   **Action**: Faculty can view aggregated data. Queries join `student_tests`, `tests`, and `users` to provide analytical data like Average Score, Pass Rate (%), Highest/Lowest Score, and Time Utilization.
