import { Router, type NextFunction, type Request, type Response } from "express"
import rateLimit from "express-rate-limit"
import jwt, { type JwtPayload } from "jsonwebtoken"

import { requireAuth } from "../../middleware/auth"
import prisma from "../../prisma"
import adminRoutes from "./adminRoutes"
import * as coop from "./service"

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET as string

// Resolves the signed-in user when a valid session is present, but never
// blocks the request. Public reads use this so the UI can show "you support
// this" state without forcing sign-in.
async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const cookieToken = req.cookies?.bsession as string | undefined
  const authHeader = req.headers["authorization"]
  const headerToken =
    typeof authHeader === "string"
      ? authHeader.replace("Bearer ", "")
      : undefined
  const token = cookieToken || headerToken
  if (!token) return next()
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    if (typeof payload === "string" || typeof payload.sub !== "string") {
      return next()
    }
    const session = await prisma.session.findUnique({ where: { token } })
    if (session && session.expiresAt >= new Date()) {
      req.userId = (payload as JwtPayload & { sub: string }).sub
    }
  } catch {
    // ignore — treat as anonymous
  }
  next()
}

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: { error: "rate_limited" },
  standardHeaders: true,
  legacyHeaders: false,
})

function viewerId(req: Request): number | null {
  return req.userId ? Number(req.userId) : null
}

function sendResult(
  res: Response,
  result: { status?: number } & Record<string, unknown>,
) {
  if ("status" in result && typeof result.status === "number") {
    const { status, ...rest } = result
    return res.status(status).json(rest)
  }
  res.json(result)
}

// --- public reads -----------------------------------------------------------

router.get("/overview", optionalAuth, async (_req, res) => {
  res.json(await coop.getOverview())
})

router.get("/me", optionalAuth, async (req, res) => {
  const id = viewerId(req)
  const [isAdmin, onWaitlist, betaAccessVerified] = await Promise.all([
    coop.isAdminUser(id),
    coop.getWaitlistStatus(id),
    coop.getBetaAccessStatus(id),
  ])
  res.json({ isAdmin, onWaitlist, betaAccessVerified })
})

router.get("/ideas", optionalAuth, async (req, res) => {
  const { status, category, sort, pending } = req.query as Record<
    string,
    string
  >
  res.json(
    await coop.listIdeas({ status, category, sort, pending }, viewerId(req)),
  )
})

router.get("/ideas/:id", optionalAuth, async (req, res) => {
  const idea = await coop.getIdea(Number(req.params.id), viewerId(req))
  if (!idea) return res.status(404).json({ error: "not_found" })
  res.json(idea)
})

router.get("/beta", optionalAuth, async (req, res) => {
  res.json(await coop.listBeta(viewerId(req)))
})

router.get("/mission", optionalAuth, async (req, res) => {
  res.json(await coop.listMission(viewerId(req)))
})

router.get("/economics", async (_req, res) => {
  res.json(await coop.getEconomics())
})

router.get("/roles", async (_req, res) => {
  res.json(await coop.listRoles())
})

router.get("/dues", optionalAuth, async (req, res) => {
  res.json(await coop.getDuesSummary(viewerId(req)))
})

router.use("/admin", adminRoutes)

// --- authenticated writes ---------------------------------------------------

router.post("/ideas", requireAuth, writeLimiter, async (req, res) => {
  sendResult(res, await coop.createIdea(Number(req.userId), req.body))
})

router.patch("/ideas/:id", requireAuth, writeLimiter, async (req, res) => {
  sendResult(
    res,
    await coop.updateIdea(Number(req.userId), Number(req.params.id), req.body),
  )
})

router.post(
  "/ideas/:id/support",
  requireAuth,
  writeLimiter,
  async (req, res) => {
    sendResult(
      res,
      await coop.toggleSupport(Number(req.params.id), Number(req.userId)),
    )
  },
)

router.post(
  "/ideas/:id/comments",
  requireAuth,
  writeLimiter,
  async (req, res) => {
    sendResult(
      res,
      await coop.addComment(
        Number(req.params.id),
        Number(req.userId),
        req.body?.body,
      ),
    )
  },
)

router.post(
  "/beta/verify-access",
  requireAuth,
  writeLimiter,
  async (req, res) => {
    sendResult(
      res,
      await coop.verifyBetaAccess(Number(req.userId), req.body?.code),
    )
  },
)

router.post("/beta/:id/vote", requireAuth, writeLimiter, async (req, res) => {
  sendResult(
    res,
    await coop.voteBeta(Number(req.params.id), Number(req.userId), req.body),
  )
})

router.post(
  "/mission/:id/support",
  requireAuth,
  writeLimiter,
  async (req, res) => {
    sendResult(
      res,
      await coop.toggleMissionSupport(
        Number(req.params.id),
        Number(req.userId),
      ),
    )
  },
)

router.post("/join-waitlist", requireAuth, writeLimiter, async (req, res) => {
  sendResult(res, await coop.joinWaitlist(Number(req.userId)))
})

router.post("/interest", requireAuth, writeLimiter, async (req, res) => {
  sendResult(res, await coop.saveInterest(Number(req.userId), req.body))
})

router.post("/dues", requireAuth, writeLimiter, async (req, res) => {
  sendResult(res, await coop.voteDues(Number(req.userId), req.body?.amount))
})

router.get("/me/participation", requireAuth, async (req, res) => {
  res.json(await coop.getParticipation(Number(req.userId)))
})

export default router
