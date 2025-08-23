function buildUserAdminPipeline(query) {
  const {
    role,
    search,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    order = "desc",
  } = query;

  const matchStage = { isDeleted: false };
  if (role) matchStage.role = role;
  if (search) {
    matchStage.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

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
    { $unwind: "$company", preserveNullAndEmptyArrays: true },
    {
      $facet: {
        metadata: { $count: "total" },
        users: [
          { $sort: { [sortBy]: order === "desc" ? -1 : 1 } },
          { $skip: (parseInt(page) - 1) * parseInt(limit) },
          { $limit: parseInt(limit) },
          {
            $project: {
              name: 1,
              email: 1,
              role: 1,
              createdAt: 1,
              profilePic: 1,
              company: { name: 1, logo: 1 },
            },
          },
        ],
      },
    },
  ];
  return pipeline;
}

module.exports = buildUserAdminPipeline;
