const mongoose = require('mongoose');

const instituteTimeTablesSchema = new mongoose.Schema({
  instituteTimeTableID: { type: Number, required: true, unique: true },
  instituteID: { type: String, required: true, ref: 'InstituteInformation' },
  session: { type: String, required: true },
  year: { type: Number, required: true },
  visibility: { type: Boolean, default: true },
  currentStatus: { type: Boolean, default: false },
  breakStart: { type: String },
  breakEnd: { type: String },
}, { timestamps: true });

instituteTimeTablesSchema.index({ instituteID: 1, year: 1, session: 1 });

module.exports = mongoose.model('InstituteTimeTables', instituteTimeTablesSchema);
