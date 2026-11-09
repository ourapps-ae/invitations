// Offer the link to the person: the system share sheet where there is one, else the clipboard.
export type ShareEnvironment = {
  share?: (data: { title?: string; text?: string; url: string }) => Promise<void>;
  writeText?: (text: string) => Promise<void>;
};
export type ShareResult = "shared" | "copied" | "cancelled" | "unavailable";

export async function shareInvitation(link: string, text: string, env: ShareEnvironment): Promise<ShareResult> {
  if (env.share) {
    try {
      await env.share({ text, url: link });
      return "shared";
    } catch (error) {
      // The person closed the sheet: not a failure to report.
      if (error instanceof Error && error.name === "AbortError") return "cancelled";
    }
  }
  if (env.writeText) {
    try {
      await env.writeText(link);
      return "copied";
    } catch {
      return "unavailable";
    }
  }
  return "unavailable";
}
