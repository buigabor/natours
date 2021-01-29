const mongoose = require('mongoose');
const Tour = require('./tourModel');

const timezoneOffset = new Date().getTimezoneOffset() * 60 * 1000;
const reviewSchema = new mongoose.Schema(
  {
    review: { type: String, required: [true, 'Review can not be empty'] },
    rating: { type: Number, min: 1, max: 5 },
    createdAt: { type: Date, default: Date.now() - timezoneOffset },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Can't create 2 reviews on one tour with same user
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  this.populate({ path: 'tour', select: 'name' }).populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

reviewSchema.statics.calcAndSetAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        numOfRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].numOfRatings,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// Update tour ratings when reviews are created, updated or deleted
reviewSchema.post('save', function () {
  this.constructor.calcAndSetAverageRatings(this.tour);
});

reviewSchema.post(/^findOneAnd/, async (docs) => {
  await docs.constructor.calcAndSetAverageRatings(docs.tour._id);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
