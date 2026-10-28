const router = require('express').Router();
const { z } = require('zod');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const requireAuth = require('../middleware/requireAuth');
const controller = require('../controllers/doctor.controller');

const doctorSchema = z.object({
  name: z.string().trim().min(1).max(120),
  specialization: z.string().trim().min(1).max(100),
  hospital: z.string().trim().min(1).max(160),
  phone: z.string().trim().min(1).max(30),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
}).strict();

router.use(requireAuth);
router.get('/', asyncHandler(controller.listDoctors));
router.post('/', validate(doctorSchema), asyncHandler(controller.createDoctor));
router.get('/:id/patients', asyncHandler(controller.listDoctorPatients));
router.post('/:id/patients', asyncHandler(controller.addPatientToDoctor));
router.get('/:id', asyncHandler(controller.getDoctor));
module.exports = router;
