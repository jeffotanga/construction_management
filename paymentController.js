const paymentService = require('../services/paymentService');

exports.listPayments = async (req, res, next) => {
  try {
    const payments = await paymentService.getPayments(req.query);
    res.json(payments);
  } catch (error) {
    next(error);
  }
};

exports.createPayment = async (req, res, next) => {
  try {
    const payment = await paymentService.createPayment(req.body);
    res.status(201).json(payment);
  } catch (error) {
    next(error);
  }
};

exports.updatePayment = async (req, res, next) => {
  try {
    const payment = await paymentService.updatePayment(req.params.id, req.body);
    res.json(payment);
  } catch (error) {
    next(error);
  }
};
