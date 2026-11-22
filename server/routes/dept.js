const express = require('express');
const router = express.Router();
const deptController = require('../controllers/deptController');
const superadminController = require('../controllers/superadminController');

// ─── Standard Department CRUD ───────────────────────────────────────────────

// Get all departments
router.get('/departments', deptController.getDepartments);

// Add department
router.post('/add-department', deptController.addDepartment);

// Update department
router.put('/update-department/:id', deptController.updateDepartment);

// Delete department
router.delete('/delete-department/:id', deptController.deleteDepartment);

// ─── SuperAdmin-only routes (no auth token required) ───────────────────────

// Aggregate dashboard stats
router.get('/superadmin-stats', superadminController.getDashboardStats);

// All tests (cross-faculty view)
router.get('/superadmin/tests', superadminController.getAllTests);

// Create a test (SuperAdmin)
router.post('/superadmin/tests', superadminController.createTestAdmin);

// Delete a test (SuperAdmin)
router.delete('/superadmin/tests/:test_id', superadminController.deleteTestAdmin);

// Toggle test active status (SuperAdmin)
router.put('/superadmin/tests/:test_id/toggle', superadminController.toggleTestAdmin);

// Assign questions (SuperAdmin)
router.post('/superadmin/tests/:test_id/questions', superadminController.assignQuestionsAdmin);

// Platform-wide reports
router.get('/superadmin/reports', superadminController.getPlatformReports);

module.exports = router;
