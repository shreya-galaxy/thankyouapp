import {apiUrls} from './app-config';

export async function submitSubscriptionSignup(payload) {
  let lastMessage = '';

  for (const url of apiUrls('/api/subscription-click')) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(payload),
        keepalive: true,
      });
      const data = await response.json().catch(() => null);

      if (response.ok && data?.success) return data;
      if (data?.message) lastMessage = data.message;
    } catch (error) {
      lastMessage = error?.message || lastMessage;
      // Try the next configured app URL.
    }
  }

  throw new Error(lastMessage || 'Could not subscribe this email address.');
}
