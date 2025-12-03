/**
 * API Features for pagination, sorting, searching, and filtering
 */
class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  /**
   * Search in specified fields
   * @param {Array} fields - Fields to search in
   */
  search(fields = []) {
    if (this.queryString.search && fields.length > 0) {
      const searchQuery = {
        $or: fields.map((field) => ({
          [field]: { $regex: this.queryString.search, $options: 'i' }
        }))
      };
      this.query = this.query.find(searchQuery);
    }
    return this;
  }

  /**
   * Filter by status, category, or custom filters
   */
  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'rowsPerPage', 'sort', 'sortBy', 'search'];
    excludedFields.forEach((field) => delete queryObj[field]);

    // Apply filters
    Object.keys(queryObj).forEach((key) => {
      if (queryObj[key]) {
        this.query = this.query.find({ [key]: queryObj[key] });
      }
    });

    return this;
  }

  /**
   * Date range filter
   * @param {String} field - Field to filter on (default: createdAt)
   */
  dateRange(field = 'createdAt') {
    const { startDate, endDate } = this.queryString;

    if (startDate || endDate) {
      const dateQuery = {};
      if (startDate) {
        dateQuery.$gte = new Date(startDate);
      }
      if (endDate) {
        dateQuery.$lte = new Date(endDate);
      }
      this.query = this.query.find({ [field]: dateQuery });
    }

    return this;
  }

  /**
   * Sort results
   */
  sort() {
    if (this.queryString.sortBy) {
      const sortOrder = this.queryString.sort === 'asc' ? 1 : -1;
      const sortOptions = { [this.queryString.sortBy]: sortOrder };
      this.query = this.query.sort(sortOptions);
    } else {
      // Default sort by createdAt descending
      this.query = this.query.sort({ createdAt: -1 });
    }
    return this;
  }

  /**
   * Paginate results
   * @returns {Object} pagination info
   */
  paginate() {
    const page = parseInt(this.queryString.page) || 1;
    const rowsPerPage = parseInt(this.queryString.rowsPerPage) || 10;
    const skip = (page - 1) * rowsPerPage;

    this.query = this.query.skip(skip).limit(rowsPerPage);

    return {
      page,
      rowsPerPage
    };
  }

  /**
   * Get pagination metadata
   * @param {Number} total - Total count of documents
   * @returns {Object} pagination metadata
   */
  static getPaginationMeta(page, rowsPerPage, total) {
    return {
      page: parseInt(page),
      rowsPerPage: parseInt(rowsPerPage),
      total,
      totalPages: Math.ceil(total / rowsPerPage)
    };
  }
}

module.exports = ApiFeatures;
