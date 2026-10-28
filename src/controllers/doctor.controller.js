const mongoose = require('mongoose');
const { z } = require('zod');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const escapeRegex = require('../utils/escapeRegex');
const { parsePagination, buildCreatedAtFilter } = require('../utils/query');

const patientCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  condition: z.string().trim().min(1).max(160),
  dateOfBirth: z.union([z.string().date(), z.literal(''), z.null()]).optional(),
  gender: z.enum(['female', 'male', 'non-binary', 'prefer-not-to-say', 'unspecified']).optional(),
  phone: z.string().trim().max(30).optional().default(''),
  email: z.union([z.string().trim().email().max(254), z.literal('')]).optional().default(''),
}).strict();

function addDateFilter(filter, query) {
  const range = buildCreatedAtFilter(query.from, query.to);
  if (range) filter.createdAt = range;
}

async function listDoctors(req, res) {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};
  const search = String(req.query.search || '').trim();
  if (search) {
    const re = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: re }, { specialization: re }, { hospital: re }, { email: re }];
  }
  if (req.query.specialization) filter.specialization = String(req.query.specialization).slice(0, 100);
  if (req.query.hospital) filter.hospital = new RegExp(escapeRegex(String(req.query.hospital).slice(0, 160)), 'i');
  addDateFilter(filter, req.query);
  const [data, total] = await Promise.all([
    Doctor.find(filter).select('name specialization hospital phone email createdAt').sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
    Doctor.countDocuments(filter),
  ]);
  return res.json({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

async function createDoctor(req, res) {
  const doctor = await Doctor.create(req.validated.body);
  return res.status(201).json({ data: doctor });
}

async function getDoctor(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid doctor ID.', code: 'INVALID_ID' });
  const doctor = await Doctor.findById(req.params.id).lean();
  if (!doctor) return res.status(404).json({ message: 'Doctor not found.', code: 'NOT_FOUND' });
  return res.json({ data: doctor });
}

async function listDoctorPatients(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid doctor ID.', code: 'INVALID_ID' });
  if (!(await Doctor.exists({ _id: req.params.id }))) return res.status(404).json({ message: 'Doctor not found.', code: 'NOT_FOUND' });
  const { page, limit, skip } = parsePagination(req.query);
  const filter = { doctor: req.params.id };
  const search = String(req.query.search || '').trim();
  if (search) {
    const re = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: re }, { condition: re }, { email: re }];
  }
  addDateFilter(filter, req.query);
  const [data, total] = await Promise.all([
    Patient.find(filter).select('name condition phone email doctor createdAt').sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
    Patient.countDocuments(filter),
  ]);
  return res.json({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

async function addPatientToDoctor(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid doctor ID.', code: 'INVALID_ID' });
  if (!(await Doctor.exists({ _id: req.params.id }))) return res.status(404).json({ message: 'Doctor not found.', code: 'NOT_FOUND' });
  const parsed = patientCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Please check the patient fields.', code: 'VALIDATION_ERROR', errors: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) });
  const input = parsed.data;
  const patient = await Patient.create({
    ...input,
    dateOfBirth: input.dateOfBirth || null,
    gender: input.gender || 'unspecified',
    email: (input.email || '').toLowerCase(),
    doctor: req.params.id,
  });
  return res.status(201).json({ data: patient });
}

module.exports = { listDoctors, createDoctor, getDoctor, listDoctorPatients, addPatientToDoctor };
