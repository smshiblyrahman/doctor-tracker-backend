const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const requireAuth = require('../middleware/requireAuth');
const controller = require('../controllers/patient.controller');

router.use(requireAuth);
router.get('/', asyncHandler(controller.listPatients));
router.patch('/:id', asyncHandler(controller.updatePatient));
router.delete('/:id', asyncHandler(controller.deletePatient));
module.exports = router;
