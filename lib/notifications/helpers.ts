/**
 * Notification Helper Functions
 * Utilities to create notifications for various events
 */

export type NotificationType =
  | 'FINDING_CREATED'
  | 'FINDING_UPDATED'
  | 'TARGET_ADDED'
  | 'PAYLOAD_USED'
  | 'SYSTEM'
  | 'ACHIEVEMENT'
  | 'REMINDER';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string;
  icon?: string;
  metadata?: any;
}

/**
 * Create a notification via API
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: params.type,
        title: params.title,
        message: params.message,
        link_url: params.linkUrl,
        icon: params.icon,
        metadata: params.metadata,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create notification');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

/**
 * Helper: Create notification for new finding
 */
export function notifyFindingCreated(userId: string, findingTitle: string, findingId: string, severity: string) {
  return createNotification({
    userId,
    type: 'FINDING_CREATED',
    title: 'New Finding Created',
    message: `${findingTitle} (${severity})`,
    linkUrl: `/dashboard/findings/${findingId}`,
    icon: '🔍',
    metadata: { finding_id: findingId, severity },
  });
}

/**
 * Helper: Create notification for finding update
 */
export function notifyFindingUpdated(userId: string, findingTitle: string, findingId: string, newStatus: string) {
  return createNotification({
    userId,
    type: 'FINDING_UPDATED',
    title: 'Finding Updated',
    message: `${findingTitle} is now ${newStatus}`,
    linkUrl: `/dashboard/findings/${findingId}`,
    icon: '📝',
    metadata: { finding_id: findingId, status: newStatus },
  });
}

/**
 * Helper: Create notification for new target
 */
export function notifyTargetAdded(userId: string, targetName: string, targetId: string) {
  return createNotification({
    userId,
    type: 'TARGET_ADDED',
    title: 'New Target Added',
    message: `${targetName} has been added to your targets`,
    linkUrl: `/dashboard/targets/${targetId}`,
    icon: '🎯',
    metadata: { target_id: targetId },
  });
}

/**
 * Helper: Create notification for payload usage
 */
export function notifyPayloadUsed(userId: string, payloadTitle: string, payloadId: string) {
  return createNotification({
    userId,
    type: 'PAYLOAD_USED',
    title: 'Payload Copied',
    message: `${payloadTitle} has been copied to clipboard`,
    linkUrl: `/dashboard/payloads`,
    icon: '💉',
    metadata: { payload_id: payloadId },
  });
}

/**
 * Helper: Create achievement notification
 */
export function notifyAchievement(userId: string, achievementTitle: string, achievementMessage: string) {
  return createNotification({
    userId,
    type: 'ACHIEVEMENT',
    title: achievementTitle,
    message: achievementMessage,
    icon: '🏆',
  });
}

/**
 * Helper: Create system notification
 */
export function notifySystem(userId: string, title: string, message: string, linkUrl?: string) {
  return createNotification({
    userId,
    type: 'SYSTEM',
    title,
    message,
    linkUrl,
    icon: '🔔',
  });
}

/**
 * Helper: Create reminder notification
 */
export function notifyReminder(userId: string, title: string, message: string, linkUrl?: string) {
  return createNotification({
    userId,
    type: 'REMINDER',
    title,
    message,
    linkUrl,
    icon: '⏰',
  });
}

/**
 * Check for milestones and create achievement notifications
 */
export async function checkAndNotifyMilestones(userId: string, counts: {
  targets?: number;
  findings?: number;
  payloads?: number;
  notes?: number;
}) {
  const achievements = [];

  // First target
  if (counts.targets === 1) {
    achievements.push(notifyAchievement(
      userId,
      '🎯 First Target!',
      'You added your first target. Keep going!'
    ));
  }

  // 10 targets
  if (counts.targets === 10) {
    achievements.push(notifyAchievement(
      userId,
      '🎯 Target Master!',
      'You have 10 targets! You\'re building quite the portfolio.'
    ));
  }

  // First finding
  if (counts.findings === 1) {
    achievements.push(notifyAchievement(
      userId,
      '🔍 First Finding!',
      'You documented your first vulnerability. Great start!'
    ));
  }

  // 10 findings
  if (counts.findings === 10) {
    achievements.push(notifyAchievement(
      userId,
      '🔍 Bug Hunter!',
      'You have 10 findings! You\'re on a roll.'
    ));
  }

  // 50 findings
  if (counts.findings === 50) {
    achievements.push(notifyAchievement(
      userId,
      '🔍 Master Bug Hunter!',
      '50 findings! You\'re a security research pro.'
    ));
  }

  // First payload
  if (counts.payloads === 1) {
    achievements.push(notifyAchievement(
      userId,
      '💉 First Payload!',
      'You added your first payload to your library.'
    ));
  }

  // First note
  if (counts.notes === 1) {
    achievements.push(notifyAchievement(
      userId,
      '🔒 First Encrypted Note!',
      'You created your first encrypted note. Your secrets are safe!'
    ));
  }

  await Promise.all(achievements);
}

