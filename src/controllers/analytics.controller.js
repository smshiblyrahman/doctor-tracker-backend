const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

async function summary(req, res) {
  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const firstDay = new Date(startOfToday);
  firstDay.setUTCDate(firstDay.getUTCDate() - 6);

  const [totalDoctors, totalPatients, patientsPerDoctor, groupedRegistrations] = await Promise.all([
    Doctor.countDocuments(),
    Patient.countDocuments(),
    Doctor.aggregate([
      { $lookup: { from: Patient.collection.name, localField: '_id', foreignField: 'doctor', as: 'patientRecords' } },
      { $project: { _id: 0, doctorId: '$_id', doctorName: '$name', specialization: 1, patientCount: { $size: '$patientRecords' } } },
      { $sort: { patientCount: -1, doctorName: 1 } },
      { $limit: 10 },
    ]),
    Patient.aggregate([
      { $match: { createdAt: { $gte: firstDay, $lt: new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const counts = new Map(groupedRegistrations.map((item) => [item._id, item.count]));
  const registrationsByDay = [];
  for (let i = 0; i < 7; i += 1) {
    const date = new Date(firstDay);
    date.setUTCDate(firstDay.getUTCDate() + i);
    const key = dayKey(date);
    registrationsByDay.push({ date: key, count: counts.get(key) || 0 });
  }

  return res.json({ data: { totalDoctors, totalPatients, patientsPerDoctor, registrationsByDay } });
}

module.exports = { summary };
