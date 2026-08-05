// ============================================
// WHAT THIS FILE DOES (plain English):
// The mobile app's small doorway to poll routes: create a poll, list visible
// polls, and cast one vote. Demo mode keeps a session-only poll list so the
// create sheet can still be previewed without a server or account.
// PRIVACY: prompt and option text go only to the product API, never analytics.
// ============================================
import { apiFetch } from "../lib/api";
import { isDemoMode } from "../lib/demo";

export type PollAudience = "close" | "friend" | "acquaintance";

export type Poll = {
  id: string;
  authorId: string;
  question: string;
  audience: PollAudience;
  closesAt?: string | null;
  createdAt: string;
  myVote?: string;
  options: Array<{ id: string; label: string; votes: number }>;
};

let demoPolls: Poll[] = [];

export async function createPoll(input: {
  question: string;
  options: string[];
  audience?: PollAudience;
}): Promise<Poll> {
  if (isDemoMode()) {
    const id = `demo-poll-${Date.now()}`;
    const poll: Poll = {
      id,
      authorId: "me",
      question: input.question.trim(),
      audience: input.audience ?? "friend",
      createdAt: new Date().toISOString(),
      closesAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      options: input.options.map((label, index) => ({
        id: `${id}-option-${index}`,
        label: label.trim(),
        votes: 0,
      })),
    };
    demoPolls = [poll, ...demoPolls];
    return poll;
  }

  return apiFetch<Poll>("/polls", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function listPolls(mineOnly = false): Promise<Poll[]> {
  if (isDemoMode()) return demoPolls.map((poll) => ({ ...poll }));
  return apiFetch<Poll[]>(mineOnly ? "/polls/mine" : "/polls");
}

export async function voteInPoll(
  pollId: string,
  optionId: string,
): Promise<void> {
  if (isDemoMode()) {
    demoPolls = demoPolls.map((poll) =>
      poll.id === pollId
        ? {
            ...poll,
            myVote: optionId,
            options: poll.options.map((option) => ({
              ...option,
              votes: option.id === optionId ? option.votes + 1 : option.votes,
            })),
          }
        : poll,
    );
    return;
  }

  await apiFetch(`/polls/${encodeURIComponent(pollId)}/votes`, {
    method: "POST",
    body: JSON.stringify({ optionId }),
  });
}
