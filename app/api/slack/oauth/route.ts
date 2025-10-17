import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const scope = 'channels:read,chat:write,users:read';
  const clientId = process.env.SLACK_CLIENT!;
  const redirectUri = process.env.SLACK_REDIRECT_URI!;

  const slackOAuthUrl = `https://slack.com/oauth/v2/authorize?${new URLSearchParams({
    client_id: clientId,
    scope,
    redirect_uri: redirectUri,
    response_type: 'code',
  })}`;

  return NextResponse.redirect(slackOAuthUrl);
}
