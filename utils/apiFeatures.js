class APIFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }
  filter() {
    const queryObj = { ...this.queryStr };

    const notFilter = ['page', 'sort', 'fields', 'limit'];
    notFilter.forEach((el) => delete queryObj[el]);

    const queryStr = JSON.stringify(queryObj);
    const objQuery = JSON.parse(
      queryStr.replace(/\b(lt|gt|lte|gte)\b/g, (match) => `$${match}`),
    );

    this.query.find(objQuery);
    return this;
  }

  sort() {
    if (this.queryStr.sort) {
      const sortStr = this.queryStr.sort.split(',').join(' ');
      this.query.sort(sortStr);
    } else {
      this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryStr.fields) {
      const fieldsStr = this.queryStr.fields.split(',').join(' ');
      this.query.select(fieldsStr);
    } else {
      this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const page = Number(this.queryStr.page) || 1;
    const limit = Number(this.queryStr.limit) || 20;
    const skip = (page - 1) * limit;
    this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
