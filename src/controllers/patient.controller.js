const mongoose = require('mongoose');
const { z } = require('zod');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const escapeRegex = require('../utils/escapeRegex');
const { parsePagination, buildCreatedAtFilter } = require('../utils/query');

const gender = z.enum(['female', 'male', 'non-binary', 'prefer-not-to-say', 'unspecified']);
const patientUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  condition: z.string().trim().min(1).max(160).optional(),
  dateOfBirth: z.union([z.string().date(), z.literal(''), z.null()]).optional(),
  gender: gender.optional(),
  phone: z.string().trim().max(30).optional(),
  email: z.union([z.string().trim().email().max(254), z.literal('')]).optional(),
  doctor: z.string().refine((value) => mongoose.isValidObjectId(value), 'Invalid doctor ID.').optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one field is required.');

async function listPatients(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};
  const search = String(req.query.search || '').trim();
  if (search) {
    const re = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: re }, { condition: re }, { email: re }];
  }
  if (req.query.condition) filter.condition = new RegExp(escapeRegex(String(req.query.condition).slice(0, 160)), 'i');
  if (req.query.doctorId) {
    if (!mongoose.isValidObjectId(String(req.query.doctorId))) return res.status(400).json({ message: 'Invalid doctor filter.', code: 'INVALID_ID' });
    filter.doctor = String(req.query.doctorId);
  }
  const dateRange = buildCreatedAtFilter(req.query.from, req.query.to);
  if (dateRange) filter.createdAt = dateRange;
  const [data, total] = await Promise.all([
    Patient.find(filter).select('name condition dateOfBirth gender phone email doctor createdAt updatedAt')
      .populate('doctor', 'name specialization hospital').sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
    Patient.countDocuments(filter),
  ]);
  return res.json({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

async function updatePatient(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid patient ID.', code: 'INVALID_ID' });
  const parsed = patientUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Please check the patient fields.', code: 'VALIDATION_ERROR', errors: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) });
  const update = { ...parsed.data };
  if (update.dateOfBirth === '') update.dateOfBirth = null;
  if (update.email !== undefined) update.email = update.email.toLowerCase();
  if (update.doctor) {
    if (!(await Doctor.exists({ _id: update.doctor }))) return res.status(400).json({ message: 'Selected doctor does not exist.', code: 'INVALID_DOCTOR' });
  }
  const patient = await Patient.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
    .populate('doctor', 'name specialization hospital');
  if (!patient) return res.status(404).json({ message: 'Patient not found.', code: 'NOT_FOUND' });
  return res.json({ data: patient });
}

async function deletePatient(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid patient ID.', code: 'INVALID_ID' });
  const patient = await Patient.findByIdAndDelete(req.params.id);
  if (!patient) return res.status(404).json({ message: 'Patient not found.', code: 'NOT_FOUND' });
  return res.json({ message: 'Patient deleted successfully.' });
}

module.exports = { listPatients, updatePatient, deletePatient };
