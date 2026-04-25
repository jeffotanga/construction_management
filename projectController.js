const projectService = require('../services/projectService');

exports.listProjects = async (req, res, next) => {
  try {
    const projects = await projectService.getProjects({ user: req.user });
    res.json(projects);
  } catch (error) {
    next(error);
  }
};

exports.createProject = async (req, res, next) => {
  try {
    const finalOwnerId = req.user?.id || req.body.owner_id || 1;
    
    const project = await projectService.createProject({ ...req.body, owner_id: finalOwnerId });
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

exports.getProject = async (req, res, next) => {
  try {
    const project = await projectService.getProjectById(req.params.id);
    res.json(project);
  } catch (error) {
    next(error);
  }
};

exports.updateProject = async (req, res, next) => {
  try {
    const project = await projectService.updateProject(req.params.id, req.body);
    res.json(project);
  } catch (error) {
    next(error);
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    await projectService.deleteProject(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

exports.assignWorker = async (req, res, next) => {
  try {
    const assignment = await projectService.assignWorkerToProject(req.params.id, req.body);
    res.status(201).json(assignment);
  } catch (error) {
    next(error);
  }
};
