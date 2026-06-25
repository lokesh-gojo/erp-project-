# Database Structure & Leaderboard Improvement Plan

This plan addresses your request to track individual test scores accurately for reports, isolate leaderboards per test and department, and identify unused tables in the current project.

## User Review Required

> [!IMPORTANT]
> Please review the proposed database changes below. The most significant change is removing the global aggregation from the `leaderboard` table and instead using `student_tests` for precise, per-test rankings isolated by department. Let me know if you approve this approach!

## 1. Unused Tables in the Existing Project

Based on the database dump and the backend codebase, the following tables are **not used** in the project and can be safely dropped to clean up the database:

1.  **`analytics`**
    *   **Reason:** There are no backend endpoints or SQL queries that read from or write to this table. It was likely created in anticipation of a future global analytics dashboard that hasn't been implemented yet.
2.  **`feedback`**
    *   **Reason:** No endpoints interact with this table. It was likely intended for a student feedback/rating feature after completing a test, but the functionality does not exist in the codebase.
3.  **`password_resets`**
    *   **Reason:** There is no backend logic for handling password resets via email/tokens. The "Forgot password?" button on the frontend login form does not trigger any API calls.

## 2. Proposed Improvements for Database Structure

### The Current Problem
Currently, the system uses a single `leaderboard` table that aggregates **all tests** a student has taken into a single `average_score` and `total_score`. It mixes students from all departments and mixes scores from completely different tests.

Additionally, while individual test scores *are* saved in the `student_tests` table, the reporting and ranking logic relies too heavily on the global `leaderboard` table.

### The Solution

We need to restructure the approach so that leaderboards are generated **per-test** and filtered **per-department**.

#### Action 1: Deprecate the Global `leaderboard` Table
The current `leaderboard` table is actually unnecessary. It causes data duplication and mixes departments. We should drop it or stop syncing to it in `quizFunction.js`.

#### Action 2: Leverage the existing `student_tests` Table for Reporting
The `student_tests` table already contains everything needed to store individual test scores for reporting:
*   `student_test_id`
*   `student_id`
*   `test_id`
*   `score` (The individual test score you want for your reports)
*   `status` (Tracks if they are 'present', 'in_progress', or 'completed')
*   `start_time` & `end_time`

#### Action 3: Create a Dynamic Department-Isolated Leaderboard Query
Instead of storing ranks statically, we can generate the leaderboard dynamically for a specific test, ensuring we don't mix departments.

**Example Query implementation for the new Leaderboard:**
```sql
SELECT 
    u.name, 
    u.roll_no, 
    st.score, 
    TIMESTAMPDIFF(SECOND, st.start_time, st.end_time) as time_taken_seconds,
    RANK() OVER (ORDER BY st.score DESC, TIMESTAMPDIFF(SECOND, st.start_time, st.end_time) ASC) as rank
FROM student_tests st
JOIN users u ON st.student_id = u.id
WHERE st.test_id = ? 
  AND st.status = 'completed'
  AND u.department_id = ? -- Isolates by department!
```

#### Action 4: (Optional) Create a `test_leaderboard_cache` Table
If calculating ranks dynamically becomes slow (only an issue with 10,000+ students taking a test simultaneously), we could create a new table designed specifically for per-test ranking:

```sql
CREATE TABLE test_leaderboards (
    test_id INT,
    department_id INT,
    student_id INT,
    score DECIMAL(5,2),
    time_taken_seconds INT,
    rank_position INT,
    PRIMARY KEY (test_id, department_id, student_id)
);
```
*I recommend starting with **Action 3** (Dynamic Query) as it keeps the database clean and perfectly accurate without redundant data.*

## Open Questions
1. Do you want me to write the SQL script to drop the unused tables (`analytics`, `feedback`, `password_resets`)?
2. Shall I update the backend `leaderboard` routes to return the new **per-test, per-department** leaderboard dynamically instead of the global one?
