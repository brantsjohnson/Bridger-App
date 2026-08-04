import prisma from "../../prisma"

// Default content for the stewardship portal. Seeded lazily on first read so
// the portal is populated without a manual seed step. All values are editable
// admin assumptions / placeholders.

const DEFAULT_ECONOMICS = {
  label: "Baseline assumptions",
  hosting: 1200,
  ai: 1200,
  storage: 600,
  emailSms: 600,
  legal: 2500,
  accounting: 1200,
  development: 20000,
  moderation: 5000,
  marketing: 10000,
  support: 3000,
  events: 5000,
  communityActivities: 2500,
  active: true,
}

function monthlyFromWeekly(hoursPerWeek: number) {
  return Math.round(hoursPerWeek * 4.33)
}

const DEFAULT_ROLES = [
  {
    title: "Founder / CEO",
    summary:
      "Currently carries the broadest responsibility because Bridger is still early.",
    estimatedMonthlyHours: monthlyFromWeekly(45.5),
    estimatedMinWeeklyHours: 12,
    estimatedMaxWeeklyHours: 45,
    status: "volunteer",
    sortOrder: 0,
    responsibilities: [
      "Product strategy (6 hrs/week)",
      "Roadmap prioritization (4 hrs/week)",
      "Partnership strategy (2 hrs/week)",
      "Event strategy (2 hrs/week)",
      "Business formation (2 hrs/week)",
      "Conflict management (1 hr/week)",
      "Community expectations (1 hr/week)",
      "Budgeting (3 hrs/week)",
      "Funding development (2 hrs/week)",
      "Infrastructure decisions (2 hrs/week)",
      "Vendor management (1 hr/week)",
      "Legal coordination (1 hr/week)",
      "Accounting coordination (1 hr/week)",
      "Marketing (5 hrs/week)",
      "Operations (4 hrs/week)",
      "Social media (1.5 hrs/week)",
      "Hiring decisions (1 hr/week)",
      "Contributor coordination (2 hrs/week)",
      "Release decisions (2 hrs/week)",
      "Long-term mission stewardship (2 hrs/week)",
    ].join("\n"),
    risks: [
      "Financial risk",
      "Reputation risk",
      "Legal risk",
      "Product failure risk",
      "Community accountability",
      "Time burden",
    ].join("\n"),
  },
  {
    title: "Developer",
    summary: "Builds and maintains the product so it stays fast and reliable.",
    estimatedMonthlyHours: monthlyFromWeekly(37),
    estimatedMinWeeklyHours: 8,
    estimatedMaxWeeklyHours: 37,
    status: "volunteer",
    sortOrder: 1,
    responsibilities: [
      "Build product features (12 hrs/week)",
      "Maintain codebase (8 hrs/week)",
      "Manage bugs (6 hrs/week)",
      "Improve performance (4 hrs/week)",
      "Support security (3 hrs/week)",
      "Maintain integrations (2 hrs/week)",
      "Support app releases (2 hrs/week)",
    ].join("\n"),
    risks: null,
  },
  {
    title: "Designer",
    summary: "Shapes how Bridger looks, feels, and stays easy to use.",
    estimatedMonthlyHours: monthlyFromWeekly(14),
    estimatedMinWeeklyHours: 3,
    estimatedMaxWeeklyHours: 14,
    status: "volunteer",
    sortOrder: 2,
    responsibilities: [
      "User experience (4 hrs/week)",
      "User interface (4 hrs/week)",
      "Brand consistency (2 hrs/week)",
      "Accessibility (2 hrs/week)",
      "Visual systems (1 hr/week)",
      "Usability testing (1 hr/week)",
    ].join("\n"),
    risks: null,
  },
  {
    title: "Moderator",
    summary: "Keeps the community healthy, safe, and welcoming.",
    estimatedMonthlyHours: monthlyFromWeekly(18),
    estimatedMinWeeklyHours: 4,
    estimatedMaxWeeklyHours: 18,
    status: "volunteer",
    sortOrder: 3,
    responsibilities: [
      "Community support (5 hrs/week)",
      "Conflict de-escalation (3 hrs/week)",
      "Rule enforcement (3 hrs/week)",
      "Welcoming new members (3 hrs/week)",
      "Reporting concerns (2 hrs/week)",
      "Protecting community health (2 hrs/week)",
    ].join("\n"),
    risks: null,
  },
  {
    title: "Social Media / Marketing",
    summary:
      "Grows Bridger's audience and keeps members engaged between releases.",
    estimatedMonthlyHours: monthlyFromWeekly(14),
    estimatedMinWeeklyHours: 3,
    estimatedMaxWeeklyHours: 15,
    status: "volunteer",
    sortOrder: 4,
    responsibilities: [
      "Social media content (4 hrs/week)",
      "Campaign planning (3 hrs/week)",
      "Community programming (3 hrs/week)",
      "Member onboarding (2 hrs/week)",
      "Storytelling (2 hrs/week)",
    ].join("\n"),
    risks: null,
  },
]

async function syncRoles() {
  const existing = await prisma.role.findMany()
  const byTitle = new Map(existing.map((r) => [r.title, r]))
  const defaultTitles = new Set(DEFAULT_ROLES.map((r) => r.title))

  for (const role of DEFAULT_ROLES) {
    const found = byTitle.get(role.title)
    if (found) {
      await prisma.role.update({
        where: { id: found.id },
        data: {
          summary: role.summary,
          estimatedMonthlyHours: role.estimatedMonthlyHours,
          estimatedMinWeeklyHours: role.estimatedMinWeeklyHours,
          estimatedMaxWeeklyHours: role.estimatedMaxWeeklyHours,
          status: role.status,
          sortOrder: role.sortOrder,
          responsibilities: role.responsibilities,
          risks: role.risks,
        },
      })
    } else {
      await prisma.role.create({ data: role })
    }
  }

  for (const role of existing) {
    if (!defaultTitles.has(role.title)) {
      await prisma.role.delete({ where: { id: role.id } })
    }
  }
}

const DEFAULT_PRINCIPLES = [
  {
    title: "People over engagement",
    description:
      "Bridger should help people spend less time scrolling and more time building real-world relationships.",
    sortOrder: 0,
  },
  {
    title: "No attention traps",
    description:
      "Bridger will not rely on addiction, endless feeds, or data extraction to make money.",
    sortOrder: 1,
  },
  {
    title: "One member, one vote",
    description:
      "Every member's voice carries equal weight, no matter when they joined or how much they pay.",
    sortOrder: 2,
  },
  {
    title: "The mission can't be sold",
    description:
      "Bridger's purpose is protected from buyers, investors, or pressure that would gut what it stands for, and it should grow and adapt without losing that purpose.",
    sortOrder: 3,
  },
  {
    title: "Value stays with members",
    description:
      "Bridger exists to serve the people who use it, not outside owners extracting profit from them.",
    sortOrder: 4,
  },
  {
    title: "You control your data",
    description:
      "Members decide what they share, and their information is never sold or treated as the product.",
    sortOrder: 5,
  },
  {
    title: "Transparency by default",
    description:
      "Costs, tradeoffs, and decisions should be visible so members can understand how the platform runs.",
    sortOrder: 6,
  },
]

async function syncMissionPrinciples() {
  const existing = await prisma.missionPrinciple.findMany()
  const byTitle = new Map(existing.map((p) => [p.title, p]))
  const defaultTitles = new Set(DEFAULT_PRINCIPLES.map((p) => p.title))

  for (const principle of DEFAULT_PRINCIPLES) {
    const found = byTitle.get(principle.title)
    if (found) {
      await prisma.missionPrinciple.update({
        where: { id: found.id },
        data: {
          description: principle.description,
          sortOrder: principle.sortOrder,
          active: true,
        },
      })
    } else {
      await prisma.missionPrinciple.create({ data: principle })
    }
  }

  for (const p of existing) {
    if (!defaultTitles.has(p.title)) {
      await prisma.missionPrinciple.delete({ where: { id: p.id } })
    }
  }
}

const BUNDLED_SAMPLE_IDEA_TITLES = [
  "Shared activity planning",
  "Quiet hours",
  "Accessibility pass for color contrast",
] as const

async function removeBundledSampleIdeas() {
  await prisma.idea.deleteMany({
    where: { title: { in: [...BUNDLED_SAMPLE_IDEA_TITLES] } },
  })

  const previewUser = await prisma.user.findUnique({
    where: { username: "cooppreview" },
    select: { id: true, _count: { select: { ideas: true } } },
  })
  if (previewUser?._count.ideas === 0) {
    await prisma.user.delete({ where: { id: previewUser.id } })
  }
}

async function syncBetaVersions() {
  // Remove the old sample versions from earlier seeds so the voting flow
  // starts from a clean, current Beta 0.2.
  await prisma.betaVersion.deleteMany({
    where: {
      versionName: { in: ["Beta 0.9: Foundations", "Beta 1.0: Connection"] },
    },
  })

  const BETA_02_CODE = "BRIDGER-BETA-02"

  const existing = await prisma.betaVersion.findFirst({
    where: { versionName: "Beta 0.2" },
  })
  if (!existing) {
    const now = new Date()
    await prisma.betaVersion.create({
      data: {
        versionName: "Beta 0.2",
        summary:
          "A focused update with profile polish, faster friend discovery, and the first round of community feedback fixes.",
        releaseNotes:
          "• Smoother onboarding and profile editing\n• Faster, clearer friend discovery\n• Daily bulletin reliability fixes\n• Several performance and accessibility improvements",
        // The app login lives at the site root, so testers sign in there.
        testUrl: "/",
        accessCode: BETA_02_CODE,
        status: "in_review",
        releaseDate: now,
        votingClosesAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        votingRound: 1,
        decision: "open",
        feedbackNeeded:
          "Test the new onboarding and friend discovery, then vote on whether this version is ready for the public.",
        knownIssues:
          "Theme previews can flicker when switching presets quickly.",
        unfinished:
          "• Group activities and event planning are not built yet\n• Notifications are limited and may be delayed\n• Some profile theme presets are placeholders\n• Search and discovery filters are still basic",
        isCurrent: true,
        sortOrder: 2,
      },
    })
  } else {
    await prisma.betaVersion.update({
      where: { id: existing.id },
      data: {
        accessCode: existing.accessCode ?? BETA_02_CODE,
        unfinished:
          existing.unfinished ??
          "• Group activities and event planning are not built yet\n• Notifications are limited and may be delayed\n• Some profile theme presets are placeholders\n• Search and discovery filters are still basic",
        // Point sign-in at the app login if it still uses the old placeholder.
        testUrl:
          existing.testUrl == null ||
          existing.testUrl === "https://testflight.apple.com/"
            ? "/"
            : existing.testUrl,
      },
    })
  }

  // Make sure the displayed access code actually works for both registering in
  // the app and verifying beta access for voting.
  await prisma.betaCode.upsert({
    where: { code: BETA_02_CODE },
    update: { maxUses: 100000 },
    create: { code: BETA_02_CODE, maxUses: 100000 },
  })

  // Only Beta 0.2 is the active, current version.
  await prisma.betaVersion.updateMany({
    where: { versionName: { not: "Beta 0.2" } },
    data: { isCurrent: false },
  })
}

let seedPromise: Promise<void> | null = null

async function runSeed(): Promise<void> {
  const economicsCount = await prisma.economicsAssumption.count()
  if (economicsCount === 0) {
    await prisma.economicsAssumption.create({ data: DEFAULT_ECONOMICS })
  }

  await syncRoles()

  await syncMissionPrinciples()

  await syncBetaVersions()

  await removeBundledSampleIdeas()
}

/** Idempotently seed default portal content. Safe to call on every request. */
export async function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = runSeed().catch((err) => {
      // Reset so a later request can retry seeding.
      seedPromise = null
      console.error("Co-op seed failed", err)
    })
  }
  return seedPromise
}
