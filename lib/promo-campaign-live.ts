export function campaignIsLive(campaign: {
  is_active: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
}) {
  if (!campaign.is_active) return false;
  const now = Date.now();
  if (campaign.starts_at && new Date(campaign.starts_at).getTime() > now) return false;
  if (campaign.ends_at && new Date(campaign.ends_at).getTime() < now) return false;
  return true;
}
