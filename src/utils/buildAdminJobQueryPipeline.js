function buildAdminJobQueryPipeline(query) {
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
    status,
    includeDeleted = false,
  } = query;

  const matchStage = {};

  if (includeDeleted !== "true") {
    matchStage.isDeleted = false;
  }

  if (location) matchStage.location = location;
  if (jobType) matchStage.jobType = jobType;
  if (category) matchStage.category = category;

  if (status) {
    switch (status) {
      case "pending":
        matchStage.isVerified = false;
        matchStage.status = "pending";
        break;
      case "approved":
        matchStage.isVerified = true;
        matchStage.status = "approved";
        break;
      case "rejected":
        matchStage.status = "rejected";
        break;
    }
  }

  if (search) {
    matchStage.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  if (search) {
    matchStage.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

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
        $lookup: {
          from: "applications",
          localField: "_id",
          foreignField: "job",
          as: "applications",
        },
      },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          jobs: [
            { $sort: sortStage },
            { $skip: (parseInt(page) - 1) * parseInt(limit) },
            { $limit: parseInt(limit) },
            {
              $addFields: {
                applicantCount: { $size: "$applications" },
              },
            },
            {
              $project: {
                title: 1,
                description: 1,
                location: 1,
                jobType: 1,
                category: 1,
                salary: 1,
                skills: 1,
                requirements: 1,
                createdAt: 1,
                updatedAt: 1,
                isVerified: 1,
                isDeleted: 1,
                deletedAt: 1,
                status: 1,
                verifiedBy: 1,
                verifiedAt: 1,
                applicantCount: 1,
                company: { 
                  _id: 1,
                  name: 1, 
                  logoUrl: 1,
                  verified: 1 
                },
                postedBy: { 
                  _id: 1,
                  name: 1, 
                  email: 1,
                  profilePic: 1 
                },
              },
            },
          ],
        },
      },
    ];

    return pipeline
}

module.exports = buildAdminJobQueryPipeline
