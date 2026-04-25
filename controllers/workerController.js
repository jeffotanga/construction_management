const workerService = require('../services/workerService');

exports.listWorkers = async (req, res, next) => {
  try {
    const workers = await workerService.getWorkers();
    res.json(workers);
  } catch (error) {
    next(error);
  }
};

exports.createWorker = async (req, res, next) => {
  try {
    const worker = await workerService.createWorker(req.body);
    res.status(201).json(worker);
  } catch (error) {
    next(error);
  }
};

exports.assignWorkerToProject = async (req, res, next) => {
  try {
    const assignment = await workerService.assignWorker(req.params.workerId, req.body.project_id, req.body.assigned_role);
    res.status(201).json(assignment);
  } catch (error) {
    next(error);
  }
};

exports.getWorker = async (req, res, next) => {
  try {
    const worker = await workerService.getWorkerById(req.params.workerId);
    res.json(worker);
  } catch (error) {
    next(error);
  }
};
