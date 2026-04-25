const attendanceService = require('../services/attendanceService');

exports.listAttendance = async (req, res, next) => {
  try {
    const attendance = await attendanceService.getAttendanceRecords(req.query);
    res.json(attendance);
  } catch (error) {
    next(error);
  }
};

exports.recordAttendance = async (req, res, next) => {
  try {
    const record = await attendanceService.recordAttendance(req.body);
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
};

exports.getAttendanceSummary = async (req, res, next) => {
  try {
    const summary = await attendanceService.getWeeklySummary(req.query);
    res.json(summary);
  } catch (error) {
    next(error);
  }
};
