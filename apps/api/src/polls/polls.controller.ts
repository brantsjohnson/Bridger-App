// ============================================
// WHAT THIS FILE DOES (plain English):
// These are the signed-in poll routes. Anyone signed in may read and answer a
// poll they can see. Creating one also passes the co-op membership guard, so
// free accounts get a clear 403 response instead of creating member content.
// ============================================
import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import { SupabaseAuthGuard, type AuthUser } from "../auth/auth.guard";
import { RequireCoopMemberGuard } from "../coop/require-coop-member.guard";
import { PollsService } from "./polls.service";

@Controller("polls")
@UseGuards(SupabaseAuthGuard)
export class PollsController {
  constructor(private readonly polls: PollsService) {}

  @Post()
  @UseGuards(RequireCoopMemberGuard)
  create(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      question?: string;
      prompt?: string;
      options?: string[];
      audience?: string;
    },
  ) {
    return this.polls.create(user.id, body ?? {});
  }

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.polls.list(user.id);
  }

  @Get("mine")
  listMine(@CurrentUser() user: AuthUser) {
    return this.polls.list(user.id, true);
  }

  @Post(":id/votes")
  vote(
    @CurrentUser() user: AuthUser,
    @Param("id") pollId: string,
    @Body() body: { optionId?: string; option_id?: string },
  ) {
    return this.polls.vote(
      user.id,
      pollId,
      body?.optionId ?? body?.option_id ?? "",
    );
  }
}
