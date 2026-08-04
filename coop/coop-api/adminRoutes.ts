import { Router, type NextFunction, type Request, type Response } from "express"
import rateLimit from "express-rate-limit"
import jwt, { type JwtPayload } from "jsonwebtoken"

import prisma from "../../prisma"
import * as coop from "./service"

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET as string
const ADMIN_API_KEY = process.env.ADMIN_API_KEY?.trim() || ""

declare module "express-serve-static-core" {
  interface Request {
    coopAdminApiKey?: boolean
  }
}

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

async function requireCoopAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const apiKey = req.headers["x-admin-api-key"]
  if (ADMIN_API_KEY && typeof apiKey === "string" && apiKey === ADMIN_API_KEY) {
    req.coopAdminApiKey = true
    return next()
  }

  if (!req.userId) {
    return res.status(401).json({ error: "unauthorized" })
  }

  const admin = await coop.isAdminUser(Number(req.userId))
  if (!admin) {
    return res.status(403).json({ error: "forbidden" })
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

function adminId(req: Request): number {
  return Number(req.userId) || 0
}

function adminOpts(req: Request) {
  return req.coopAdminApiKey ? { bypassAdminCheck: true } : undefined
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

router.use(optionalAuth, requireCoopAdmin)

router.get("/ideas", async (req, res) => {
  const pending = req.query.status === "pending"
  const result = await coop.listAdminIdeas(
    adminId(req),
    { pending },
    adminOpts(req),
  )
  sendResult(res, Array.isArray(result) ? { ideas: result } : result)
})

router.get("/ideas/:id", async (req, res) => {
  const result = await coop.getAdminIdea(
    adminId(req),
    Number(req.params.id),
    adminOpts(req),
  )
  if ("error" in result && typeof result.status === "number") {
    const { status, ...rest } = result
    return res.status(status).json(rest)
  }
  res.json(result)
})

router.post("/ideas/:id/approve", writeLimiter, async (req, res) => {
  sendResult(
    res,
    await coop.approveIdea(adminId(req), Number(req.params.id), adminOpts(req)),
  )
})

router.post("/ideas/:id/deny", writeLimiter, async (req, res) => {
  const note = typeof req.body?.note === "string" ? req.body.note : undefined
  sendResult(
    res,
    await coop.denyIdea(
      adminId(req),
      Number(req.params.id),
      note,
      adminOpts(req),
    ),
  )
})

router.post("/ideas/:id/status", writeLimiter, async (req, res) => {
  sendResult(
    res,
    await coop.updateIdea(
      adminId(req),
      Number(req.params.id),
      req.body,
      adminOpts(req),
    ),
  )
})

router.post("/ideas/:id/send-update", writeLimiter, async (req, res) => {
  sendResult(
    res,
    await coop.sendIdeaUpdateEmail(
      adminId(req),
      Number(req.params.id),
      {
        subject: req.body?.subject,
        message: req.body?.message,
      },
      adminOpts(req),
    ),
  )
})

export default router
