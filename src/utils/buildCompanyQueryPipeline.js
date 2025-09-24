function buildCompanyQueryPipeline(query) {
  const {
    page = 1,
    limit = 10,
    search,
    verified,
    sortBy = "createdAt",
    order = "desc",
  } = query;

  const matchStage = { isDeleted: { $ne: true } };
  if (search) {
    matchStage.name = { $regex: search, $options: "i" };
  }
  if (verified !== undefined) {
    matchStage.isVerified = verified === "true";
  }

  const sortStage = { [sortBy]: order === "desc" ? -1 : 1 };

  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: "users",
        localField: "createdBy",
        foreignField: "_id",
        as: "createdBy",
      },
    },
    { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "users",
        localField: "recruiters",
        foreignField: "_id",
        as: "recruiters",
      },
    },
    { $unwind: { path: "$recruiters", preserveNullAndEmptyArrays: true } },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        companies: [
          { $sort: sortStage },
          { $skip: (parseInt(page) - 1) * parseInt(limit) },
          { $limit: parseInt(limit) },
          {
            $project: {
              name: 1,
              logoUrl: 1,
              verified: 1,
              createdAt: 1,
              createdBy: {name: 1, profilePic: 1},
              recruiters: {name: 1, profilePic: 1},
              updatedAt: 1,
            },
          },
        ],
      },
    },
  ];

  return pipeline;
}

module.exports = buildCompanyQueryPipeline;
