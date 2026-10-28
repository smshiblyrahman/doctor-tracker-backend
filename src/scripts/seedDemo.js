require('dotenv').config();
const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

const demoDoctors = [
  { name: 'Dr. Ayesha Rahman', specialization: 'Cardiology', hospital: 'City Care Hospital', phone: '+880 1711-000101', email: 'ayesha.rahman@example.test' },
  { name: 'Dr. Tanvir Hasan', specialization: 'Neurology', hospital: 'Green Valley Medical', phone: '+880 1711-000102', email: 'tanvir.hasan@example.test' },
  { name: 'Dr. Nusrat Jahan', specialization: 'Pediatrics', hospital: 'Sunrise General Hospital', phone: '+880 1711-000103', email: 'nusrat.jahan@example.test' },
  { name: 'Dr. Imran Chowdhury', specialization: 'Dermatology', hospital: 'City Care Hospital', phone: '+880 1711-000104', email: 'imran.chowdhury@example.test' },
  { name: 'Dr. Farzana Akter', specialization: 'Orthopedics', hospital: 'North Point Clinic', phone: '+880 1711-000105', email: 'farzana.akter@example.test' },
];
const demoPatients = [
  ['Maya Islam', 'Hypertension', 'female', 0], ['Rafi Ahmed', 'Migraine', 'male', 1],
  ['Samiha Karim', 'Seasonal allergy', 'female', 2], ['Arman Hossain', 'Eczema', 'male', 3],
  ['Nabila Sultana', 'Knee pain', 'female', 4], ['Omar Faruk', 'Arrhythmia', 'male', 0],
  ['Tania Sarker', 'Asthma', 'female', 2], ['Sajid Rahman', 'Back pain', 'male', 4],
  ['Lamia Noor', 'Migraine', 'female', 1], ['Fahim Kabir', 'Dermatitis', 'male', 3],
  ['Raisa Ahmed', 'Anemia', 'female', 2], ['Nayeem Hasan', 'High cholesterol', 'male', 0],
  ['Anika Das', 'Joint pain', 'female', 4], ['Mahin Rahman', 'Tension headache', 'male', 1],
];

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI must be set.');
  await mongoose.connect(process.env.MONGODB_URI);
  let doctors = await Doctor.find().sort({ createdAt: 1 });
  if (doctors.length === 0) doctors = await Doctor.insertMany(demoDoctors);
  const existingPatients = await Patient.countDocuments();
  if (existingPatients === 0) {
    const patients = demoPatients.map(([name, condition, gender, index], i) => ({
      name, condition, gender, doctor: doctors[index % doctors.length]._id,
      email: `demo.patient.${i + 1}@example.test`, phone: `+880 1800-000${String(i + 1).padStart(3, '0')}`,
      createdAt: new Date(Date.now() - (i % 7) * 24 * 60 * 60 * 1000),
    }));
    await Patient.insertMany(patients);
  }
  console.log(`Demo seed complete: ${doctors.length} doctors available; patients seeded only when collection was empty.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(async () => {
  if (mongoose.connection.readyState) await mongoose.disconnect();
});
