import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { token, channel, text } = await req.json();

  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ channel, text }),
  });

  const data = await res.json();
  if (!data.ok) {
    console.error('Slack message error:', data.error);
    return NextResponse.json({ error: data.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
