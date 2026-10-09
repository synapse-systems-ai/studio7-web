export function campaignIsLive(campaign: {
  is_active: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
}) {
  return campaignLiveBlockReason(campaign) === null;
}

/** Plain-language reason a campaign cannot accept signups (for public pages). */
export function campaignLiveBlockReason(campaign: {
  is_active: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
} | null): string | null {
  if (!campaign) return "We couldn't find this campaign link.";
  if (!campaign.is_active) {
    return "This campaign is turned off. In admin, open the campaign, turn Active on, and save.";
  }
  const now = Date.now();
  if (campaign.starts_at && new Date(campaign.starts_at).getTime() > now) {
    return "This campaign hasn't started yet. Check the start date in admin or clear it.";
  }
  if (campaign.ends_at && new Date(campaign.ends_at).getTime() < now) {
    return "This campaign has ended. Clear or extend the end date in admin, or turn Active back on.";
  }
  return null;
}
