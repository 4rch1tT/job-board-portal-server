function buildJobQueryPipeline(query) {
  const {
    location,
    jobType,
    category,
    search,
    sortBy = "createdAt",
    order = "desc",
    page = 1,
    limit = 10,
    minSalary,
    maxSalary,
  } = query;

  const matchStage = {
    isDeleted: false,
    isVerified: true,
  };

  if (location) matchStage.location = location;
  if (jobType) matchStage.jobType = jobType;
  if (category) matchStage.category = category;

  if (search) {
    matchStage.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  if (minSalary) matchStage.salary.min = { $gte: Number(minSalary) };
  if (maxSalary) matchStage.salary.max = { $lte: Number(maxSalary) };

  const sortStage = { [sortBy]: order === "desc" ? -1 : 1 };

  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: "companies",
        localField: "company",
        foreignField: "_id",
        as: "company",
      },
    },
    { $unwind: { path: "$company", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "users",
        localField: "postedBy",
        foreignField: "_id",
        as: "postedBy",
      },
    },
    { $unwind: { path: "$postedBy", preserveNullAndEmptyArrays: true } },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        jobs: [
          { $sort: sortStage },
          { $skip: (parseInt(page) - 1) * parseInt(limit) },
          { $limit: parseInt(limit) },
          {
            $project: {
              title: 1,
              location: 1,
              jobType: 1,
              category: 1,
              salary: 1,
              createdAt: 1,
              company: { name: 1, logoUrl: 1 },
              postedBy: { name: 1, profilePic: 1 },
            },
          },
        ],
      },
    },
  ];
  return pipeline;
}

module.exports = buildJobQueryPipeline;
