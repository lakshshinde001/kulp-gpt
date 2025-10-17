import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/db/client';
import { users, slack_users } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 });

  const res = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.SLACK_CLIENT!,
      client_secret: process.env.SLACK_SECRET!,
      code,
      redirect_uri: process.env.SLACK_REDIRECT_URI!,
    }),
  });

  const data = await res.json();
  console.log('Slack OAuth Response:', data);
  if (!data.ok) {
    console.error('Slack OAuth Error:', data);
    return NextResponse.json({ error: data.error }, { status: 400 });
  }
  const accessToken = data.access_token;
  const idToken = data.id_token; // OpenID Connect ID token
  const slackUserId = data.authed_user?.id;
  const teamId = data.team?.id;

  if (!accessToken || !slackUserId) {
    console.error('Missing access token or Slack user ID');
    return NextResponse.json({ error: 'Invalid OAuth response' }, { status: 400 });
  }

  try {
    // Fetch user profile from Slack
    const profileRes = await fetch(`https://slack.com/api/users.info?user=${slackUserId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const profileData = await profileRes.json();
    if (!profileData.ok) {
      console.error('Slack Profile Error:', profileData);
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 400 });
    }

    console.log('Slack Profile Data:', profileData);
    const slackProfile = profileData.user;

    // Check if Slack user already exists
    const existingSlackUser = await db
      .select()
      .from(slack_users)
      .where(eq(slack_users.slack_user_id, slackUserId))
      .limit(1);

    let userId: number;
    console.log('Existing Slack User:', existingSlackUser);

    if (existingSlackUser.length > 0) {
      // Update existing Slack user record
      userId = existingSlackUser[0].userid;
      await db
        .update(slack_users)
        .set({
          access_token: accessToken,
          id_token: idToken,
          team_id: teamId,
          user_name: slackProfile.name,
          real_name: slackProfile.real_name,
          email: slackProfile.profile?.email,
          avatar: slackProfile.profile?.image_192,
          updated_at: new Date(),
        })
        .where(eq(slack_users.slack_user_id, slackUserId));
    } else {
      // Create new user
      const userName = slackProfile.real_name || slackProfile.name || `Slack User ${slackUserId}`;
      const userEmail = slackProfile.profile?.email || `${slackUserId}@slack.local`;

      const newUser = await db
        .insert(users)
        .values({
          name: userName,
          email: userEmail,
          password: '', // Slack users don't need passwords
          image: slackProfile.profile?.image_192,
        })
        .returning({ id: users.id });

      userId = newUser[0].id;

      // Create Slack user record
      await db.insert(slack_users).values({
        userid: userId,
        slack_user_id: slackUserId,
        access_token: accessToken,
        id_token: idToken,
        team_id: teamId,
        user_name: slackProfile.name,
        real_name: slackProfile.real_name,
        email: slackProfile.profile?.email,
        avatar: slackProfile.profile?.image_192,
      });
    }

    // Redirect to success page (which will handle authentication)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/slack/success?userId=${userId}`);

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to save user data' }, { status: 500 });
  }
}
