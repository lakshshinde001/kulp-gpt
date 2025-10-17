import { db } from "@/src/db/client";
import { slack_users } from "@/src/db/schema";
import { eq } from "drizzle-orm";


export async function getCurrentTime() {
    const now = new Date();
    // Return time in Indian Standard Time (Asia/Kolkata)
    return now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  }


export async function getSlackUserInfo(userId?: number) {
  try {
    // If no userId provided, get from current user store
    if (!userId) {
      // Import here to avoid circular dependencies
      const { useUserStore } = await import("@/stores/userStore");
      const currentUser = useUserStore.getState().user;
      if (!currentUser?.id) {
        return "No authenticated user found. Please log in first.";
      }
      userId = currentUser.id;
    }

    // Fetch Slack user data from database
    const slackUser = await db
      .select({
        accessToken: slack_users.access_token,
        idToken: slack_users.id_token,
        teamId: slack_users.team_id,
        userName: slack_users.user_name,
        realName: slack_users.real_name,
        email: slack_users.email,
        avatar: slack_users.avatar,
        createdAt: slack_users.created_at,
      })
      .from(slack_users)
      .where(eq(slack_users.userid, userId))
      .limit(1);

    if (slackUser.length === 0) {
      return `No Slack user information found for user ID ${userId}. The user may not have connected their Slack account yet.`;
    }

    const { accessToken, idToken, teamId, userName, realName, email, avatar, createdAt } = slackUser[0];

  

    // Fallback: Use stored user data from database
    if (accessToken) {
      try {
        // Get current user ID from the stored Slack user record
        const slackUserRecord = await db
          .select({ slackUserId: slack_users.slack_user_id })
          .from(slack_users)
          .where(eq(slack_users.userid, userId))
          .limit(1);

        if (slackUserRecord.length > 0) {
          const slackUserId = slackUserRecord[0].slackUserId;

          // Call Slack users.info API to get fresh data
          const userInfoResponse = await fetch(`https://slack.com/api/users.info?user=${slackUserId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          const userData = await userInfoResponse.json();

          if (userInfoResponse.ok && userData.ok) {
            const user = userData.user;
            const profile = user.profile || {};

            const formattedInfo = `
              Slack User Information (from Users API):
              - User ID: ${user.id}
              - Username: ${user.name}
              - Real Name: ${user.real_name || 'Not available'}
              - Display Name: ${profile.display_name || 'Not available'}
              - Email: ${profile.email || 'Not available'}
              - Timezone: ${user.tz_label || user.tz || 'Not available'}
              - Is Admin: ${user.is_admin ? 'Yes' : 'No'}
              - Is Owner: ${user.is_owner ? 'Yes' : 'No'}
              - Team ID: ${teamId || user.team_id || 'Not available'}
              - Avatar: ${profile.image_192 || profile.image_72 || 'Not available'}
              - Account Created: ${new Date(user.created_at ? user.created_at * 1000 : createdAt).toLocaleString()}
              - API Response Time: ${new Date().toLocaleString()}
            `.trim();

            return formattedInfo;
          }
        }
      } catch (error) {
        console.log('Users API failed, using stored data:', error);
      }
    }




  } catch (error) {
    console.error('Error fetching Slack user info:', error);
    return `Error fetching Slack user information: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

export async function getSlackWorkspaceUsers(userId?: number) {
  try {
    // If no userId provided, get from current user store
    if (!userId) {
      // Import here to avoid circular dependencies
      const { useUserStore } = await import("@/stores/userStore");
      const currentUser = useUserStore.getState().user;
      if (!currentUser?.id) {
        return "No authenticated user found. Please log in first.";
      }
      userId = currentUser.id;
    }

    // Fetch Slack user access token from database
    const slackUser = await db
      .select({
        accessToken: slack_users.access_token,
        teamId: slack_users.team_id,
      })
      .from(slack_users)
      .where(eq(slack_users.userid, userId))
      .limit(1);

    if (slackUser.length === 0) {
      return `No Slack user information found for user ID ${userId}. The user may not have connected their Slack account yet.`;
    }

    const { accessToken, teamId } = slackUser[0];

    if (!accessToken) {
      return "No valid access token found. Please reconnect your Slack account.";
    }

    try {
      // Call Slack users.list API to get all workspace users
      const usersResponse = await fetch('https://slack.com/api/users.list', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const usersData = await usersResponse.json();

      if (!usersResponse.ok || !usersData.ok) {
        throw new Error(`Slack API error: ${usersData.error || 'Unknown error'}`);
      }

      const members = usersData.members || [];

      // Filter out bots, deleted users, and format the response
      const activeUsers = members.filter((user: any) =>
        !user.is_bot &&
        !user.deleted &&
        user.id !== 'USLACKBOT' // Exclude Slackbot
      );

      if (activeUsers.length === 0) {
        return "No active users found in the workspace.";
      }

      // Format the user list
      const userList = activeUsers.map((user: any, index: number) => {
        const profile = user.profile || {};
        const status = user.is_admin ? 'Admin' :
                      user.is_owner ? 'Owner' :
                      user.is_primary_owner ? 'Primary Owner' : 'Member';

        return `${index + 1}. ${user.real_name || user.name} (@${user.name})
   - Status: ${status}
   - Email: ${profile.email || 'Not available'}
   - Timezone: ${user.tz_label || user.tz || 'Not available'}
   - Is Admin: ${user.is_admin ? 'Yes' : 'No'}
   - Is Owner: ${user.is_owner ? 'Yes' : 'No'}`;
      }).join('\n\n');

      const summary = `
Slack Workspace Users Summary:
- Total Active Users: ${activeUsers.length}
- Workspace ID: ${teamId || 'Not available'}
- Retrieved at: ${new Date().toLocaleString()}

User Details:
${userList}
      `.trim();

      return summary;

    } catch (slackError) {
      console.error('Slack API error:', slackError);
      return `Error calling Slack API: ${slackError instanceof Error ? slackError.message : 'Unknown Slack API error'}. Your access token may not have the required permissions.`;
    }

  } catch (error) {
    console.error('Error fetching Slack workspace users:', error);
    return `Error fetching Slack workspace users: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

export async function sendSlackMessage(userId: number, recipientUserId: string, message: string) {
  try {
    if (!userId) {
      return "No authenticated user found. Please log in first.";
    }

    if (!recipientUserId || !message) {
      return "Both recipient user ID and message content are required.";
    }

    if (message.trim().length === 0) {
      return "Message cannot be empty.";
    }

    if (message.length > 4000) {
      return "Message is too long. Maximum length is 4000 characters.";
    }

    // Fetch Slack user access token from database
    const slackUser = await db
      .select({
        accessToken: slack_users.access_token,
        userName: slack_users.user_name,
      })
      .from(slack_users)
      .where(eq(slack_users.userid, userId))
      .limit(1);

    if (slackUser.length === 0) {
      return `No Slack user information found for user ID ${userId}. The user may not have connected their Slack account yet.`;
    }

    const { accessToken, userName } = slackUser[0];

    if (!accessToken) {
      return "No valid access token found. Please reconnect your Slack account.";
    }

    try {
      // Call Slack chat.postMessage API to send DM
      const messageResponse = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: recipientUserId, // User ID for DM
          text: message,
          as_user: true, // Send as the authenticated user
        }),
      });

      const messageData = await messageResponse.json();

      if (!messageResponse.ok || !messageData.ok) {
        throw new Error(`Slack API error: ${messageData.error || 'Unknown error'}`);
      }

      const successMessage = `
        ✅ Message sent successfully!

        **Details:**
        - **From:** ${userName || 'You'}
        - **To:** User ${recipientUserId}
        - **Message:** ${message.length > 100 ? message.substring(0, 100) + '...' : message}
        - **Timestamp:** ${new Date(messageData.ts * 1000).toLocaleString()}
        - **Channel:** ${messageData.channel}

        The message has been delivered to the user's direct messages in Slack.
              `.trim();

              return successMessage;

    } catch (slackError) {
      console.error('Slack API error:', slackError);

      let errorMessage = `Error sending message: ${slackError instanceof Error ? slackError.message : 'Unknown Slack API error'}`;

      // Provide helpful error messages for common issues
      if (slackError instanceof Error) {
        if (slackError.message.includes('channel_not_found')) {
          errorMessage += '\n\nPossible causes:\n- Invalid user ID\n- User is not in the same workspace\n- User has restricted DMs';
        } else if (slackError.message.includes('missing_scope')) {
          errorMessage += '\n\nThe Slack app needs the "chat:write" scope. Please reconnect your Slack account.';
        } else if (slackError.message.includes('not_in_channel')) {
          errorMessage += '\n\nCannot send messages to this user. They may have DMs disabled or you may not have permission.';
        }
      }

      return errorMessage;
    }

  } catch (error) {
    console.error('Error sending Slack message:', error);
    return `Error sending Slack message: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

export async function getSlackChannels(userId?: number, includePrivate: boolean = false) {
  try {
    // If no userId provided, get from current user store
    if (!userId) {
      // Import here to avoid circular dependencies
      const { useUserStore } = await import("@/stores/userStore");
      const currentUser = useUserStore.getState().user;
      if (!currentUser?.id) {
        return "No authenticated user found. Please log in first.";
      }
      userId = currentUser.id;
    }

    // Fetch Slack user access token from database
    const slackUser = await db
      .select({
        accessToken: slack_users.access_token,
        teamId: slack_users.team_id,
      })
      .from(slack_users)
      .where(eq(slack_users.userid, userId))
      .limit(1);

    if (slackUser.length === 0) {
      return `No Slack user information found for user ID ${userId}. The user may not have connected their Slack account yet.`;
    }

    const { accessToken, teamId } = slackUser[0];

    if (!accessToken) {
      return "No valid access token found. Please reconnect your Slack account.";
    }

    try {
      // Determine which types of channels to fetch
      const types = includePrivate
        ? 'public_channel,private_channel'
        : 'public_channel';

      // Call Slack conversations.list API to get all channels
      const channelsResponse = await fetch(
        `https://slack.com/api/conversations.list?types=${types}&limit=200`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const channelsData = await channelsResponse.json();

      if (!channelsResponse.ok || !channelsData.ok) {
        throw new Error(`Slack API error: ${channelsData.error || 'Unknown error'}`);
      }

      const channels = channelsData.channels || [];

      if (channels.length === 0) {
        return includePrivate
          ? "No channels found in your workspace."
          : "No public channels found in your workspace. Try including private channels.";
      }

      // Group channels by type and format
      const publicChannels = channels.filter((ch: any) => !ch.is_private);
      const privateChannels = channels.filter((ch: any) => ch.is_private);

      let summary = `
Slack Workspace Channels Summary:
- **Workspace ID:** ${teamId || 'Not available'}
- **Total Channels:** ${channels.length}
- **Public Channels:** ${publicChannels.length}
- **Private Channels:** ${privateChannels.length}
- **Retrieved at:** ${new Date().toLocaleString()}
- **Filter:** ${includePrivate ? 'All channels' : 'Public channels only'}

`;

      // Add public channels section
      if (publicChannels.length > 0) {
        summary += `\n**Public Channels:**\n`;
        publicChannels.slice(0, 20).forEach((channel: any, index: number) => {
          const memberCount = channel.num_members || 0;
          const isArchived = channel.is_archived ? ' (Archived)' : '';
          summary += `${index + 1}. #${channel.name} (${channel.id})${isArchived}\n`;
          summary += `   - Members: ${memberCount}\n`;
          summary += `   - Created: ${channel.created ? new Date(channel.created * 1000).toLocaleDateString() : 'Unknown'}\n`;
          if (channel.topic?.value) {
            summary += `   - Topic: ${channel.topic.value.length > 50 ? channel.topic.value.substring(0, 50) + '...' : channel.topic.value}\n`;
          }
          summary += '\n';
        });

        if (publicChannels.length > 20) {
          summary += `... and ${publicChannels.length - 20} more public channels\n\n`;
        }
      }

      // Add private channels section
      if (includePrivate && privateChannels.length > 0) {
        summary += `\n**Private Channels:**\n`;
        privateChannels.slice(0, 20).forEach((channel: any, index: number) => {
          const memberCount = channel.num_members || 0;
          const isArchived = channel.is_archived ? ' (Archived)' : '';
          summary += `${index + 1}. 🔒 ${channel.name} (${channel.id})${isArchived}\n`;
          summary += `   - Members: ${memberCount}\n`;
          summary += `   - Created: ${channel.created ? new Date(channel.created * 1000).toLocaleDateString() : 'Unknown'}\n`;
          if (channel.topic?.value) {
            summary += `   - Topic: ${channel.topic.value.length > 50 ? channel.topic.value.substring(0, 50) + '...' : channel.topic.value}\n`;
          }
          summary += '\n';
        });

        if (privateChannels.length > 20) {
          summary += `... and ${privateChannels.length - 20} more private channels\n\n`;
        }
      }

      // Add note about limitations
      if (channels.length >= 200) {
        summary += `\n*Note: Only showing first 200 channels. Use pagination for more results.*`;
      }

      if (!includePrivate && privateChannels.length > 0) {
        summary += `\n*Note: ${privateChannels.length} private channels not shown. Use include_private=true to see them.*`;
      }

      return summary.trim();

    } catch (slackError) {
      console.error('Slack API error:', slackError);

      let errorMessage = `Error fetching Slack channels: ${slackError instanceof Error ? slackError.message : 'Unknown Slack API error'}`;

      // Provide helpful error messages for common issues
      if (slackError instanceof Error) {
        if (slackError.message.includes('missing_scope')) {
          errorMessage += '\n\nThe Slack app needs the "channels:read" scope. Please reconnect your Slack account.';
        } else if (slackError.message.includes('invalid_auth')) {
          errorMessage += '\n\nInvalid authentication. Please reconnect your Slack account.';
        }
      }

      return errorMessage;
    }

  } catch (error) {
    console.error('Error fetching Slack channels:', error);
    return `Error fetching Slack channels: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}