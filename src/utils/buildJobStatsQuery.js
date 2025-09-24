function buildJobStatsQuery() {
  const pipeline = [
    {
      $facet: {
        totalJobs: [{ $count: "count" }],
        verifiedJobs: [{ $match: { isVerified: true } }, { $count: "count" }],
        pendingJobs: [
          { $match: { isVerified: false, status: "pending" } },
          { $count: "count" },
        ],
        rejectedJobs: [{ $match: { status: "rejected" } }, { $count: "count" }],
        deletedJobs: [{ $match: { isDeleted: true } }, { $count: "count" }],
        activeJobs: [
          { $match: { isDeleted: false, isVerified: true } },
          { $count: "count" },
        ],
      },
    },
  ];
  return pipeline
}

module.exports = buildJobStatsQuery