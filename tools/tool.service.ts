

export async function getCurrentTime() {
    const now = new Date();
    // Return time in Indian Standard Time (Asia/Kolkata)
    return now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  }