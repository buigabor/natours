const catchAsyncErrors = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

const filterObj = (objOriginal, allowedFields) => {
  const filteredObj = Object.keys(objOriginal)
    .filter((key) => allowedFields.includes(key))
    .reduce((objNew, key) => {
      objNew[key] = objOriginal[key];
      return objNew;
    }, {});
  return filteredObj;
};

const createOne = (Model) =>
  catchAsyncErrors(async (req, res, next) => {
    const modelName = Model.modelName.toLowerCase();

    const newDoc = await Model.create(req.body);
    res.status(201).json({ status: 'success', data: { [modelName]: newDoc } });
  });

const deleteOne = (Model) =>
  catchAsyncErrors(async (req, res, next) => {
    const deletetedDoc = await Model.findByIdAndDelete(req.params.id);
    if (!deletetedDoc) {
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

const updateOne = (Model, filterFields) =>
  catchAsyncErrors(async (req, res, next) => {
    const modelName = Model.modelName.toLowerCase();

    let filteredBody;
    if (filterFields) {
      filteredBody = filterObj(req.body, filterFields);
    } else {
      filteredBody = req.body;
    }

    const updatedDoc = await Model.findByIdAndUpdate(
      req.params.id,
      filteredBody,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedDoc) {
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: { [modelName]: updatedDoc },
    });
  });

const getOne = (Model, populateOptions) =>
  catchAsyncErrors(async (req, res, next) => {
    const modelName = Model.modelName.toLowerCase();

    let query = Model.findById(req.params.id);
    if (populateOptions) query = query.populate(populateOptions);
    const doc = await query;

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(200).json({ status: 'success', data: { [modelName]: doc } });
  });

const getAll = (Model) =>
  catchAsyncErrors(async (req, res, next) => {
    let filter = {};
    // If we specify a tourId, then we get all the reviews of that tour, if not we get all the reviews
    if (req.params.tourId) {
      filter = { tour: req.params.tourId };
    }
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const docs = await features.query;

    // Send Response
    const modelName = Model.modelName.toLowerCase();
    res.status(200).json({
      status: 'success',
      requestedAt: req.requestTime,
      results: docs.length,
      data: { [modelName]: docs },
    });
  });
module.exports = { deleteOne, updateOne, createOne, getOne, getAll };
