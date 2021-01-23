class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // eslint-disable-next-line no-unused-vars
    const { page, sort, limit, fields, ...queryObj } = this.queryString;
    let queryString = JSON.stringify(queryObj);
    queryString = queryString.replace(
      /\b(gte|gt|tle|lt)\b/g,
      (match) => `$${match}`
    );
    this.query = this.query.find(JSON.parse(queryString));

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fieldsLimit = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fieldsLimit);
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  paginate() {
    const pageNum = this.queryString.page * 1 || 1;
    const limitNum = this.queryString.limit * 1 || 100;
    const skip = (pageNum - 1) * limitNum;
    this.query = this.query.skip(skip).limit(limitNum);

    return this;
  }
}

module.exports = APIFeatures;
