import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

let channelCreated = false;

export async function ensureNotificationChannel(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.createChannel({
        id: 'padrao',
        name: 'Notificações Padrão',
        description: 'Canal padrão de notificações do VoltaLá',
        importance: 5,
        visibility: 1,
        vibration: true,
      });
      channelCreated = true;
    } catch (err) {
      console.warn('LocalNotifications.createChannel falhou:', err);
    }
  }
}

export async function requestNotificationPermission(): Promise<'granted' | 'denied'> {
  try {
    const status = await LocalNotifications.requestPermissions();
    await ensureNotificationChannel();
    return status.display === 'granted' ? 'granted' : 'denied';
  } catch (err) {
    console.warn('LocalNotifications.requestPermissions falhou:', err);
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        return perm === 'granted' ? 'granted' : 'denied';
      } catch (webErr) {
        console.warn('Notification.requestPermission web falhou:', webErr);
      }
    }
    return 'denied';
  }
}

export async function checkNotificationPermissionStatus(): Promise<'granted' | 'denied'> {
  try {
    const status = await LocalNotifications.checkPermissions();
    return status.display === 'granted' ? 'granted' : 'denied';
  } catch (err) {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted' ? 'granted' : 'denied';
    }
    return 'denied';
  }
}

export async function sendAppNotification(
  title: string,
  options?: { body?: string; id?: number; delaySeconds?: number }
) {
  const uniqueId = options?.id || (Math.floor(Date.now() % 100000000) + Math.floor(Math.random() * 1000));
  const bodyText = options?.body || '';
  const delayMs = options?.delaySeconds ? options.delaySeconds * 1000 : 0;

  if (Capacitor.isNativePlatform()) {
    try {
      if (!channelCreated) {
        await ensureNotificationChannel();
      } else {
        await LocalNotifications.createChannel({
          id: 'padrao',
          name: 'Notificações Padrão',
          description: 'Canal padrão de notificações do VoltaLá',
          importance: 5,
          visibility: 1,
          vibration: true,
        });
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            channelId: 'padrao',
            id: uniqueId,
            title,
            body: bodyText,
            smallIcon: 'ic_stat_icon_config_sample',
            ...(delayMs > 0 ? { schedule: { at: new Date(Date.now() + delayMs) } } : {}),
          },
        ],
      });
      return;
    } catch (capErr) {
      console.warn('LocalNotifications.schedule falhou:', capErr);
    }
  } else {
    try {
      await LocalNotifications.createChannel({
        id: 'padrao',
        name: 'Notificações Padrão',
        importance: 5,
        visibility: 1,
        vibration: true,
      }).catch(() => {});

      await LocalNotifications.schedule({
        notifications: [
          {
            channelId: 'padrao',
            id: uniqueId,
            title,
            body: bodyText,
            smallIcon: 'ic_stat_icon_config_sample',
            ...(delayMs > 0 ? { schedule: { at: new Date(Date.now() + delayMs) } } : {}),
          },
        ],
      });
      return;
    } catch (err) {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        if (delayMs > 0) {
          setTimeout(() => {
            try {
              new Notification(title, { body: bodyText });
            } catch (e) {}
          }, delayMs);
        } else {
          try {
            new Notification(title, { body: bodyText });
          } catch (e) {}
        }
      }
    }
  }
}

export async function scheduleTestNotificationIn5Seconds(): Promise<'granted' | 'denied'> {
  const perm = await requestNotificationPermission();
  await sendAppNotification('VoltaLá 📡 Teste de Notificação', {
    body: 'Notificação local agendada para 5 segundos disparada com sucesso!',
    id: Math.floor(Date.now() % 100000000) + Math.floor(Math.random() * 1000),
    delaySeconds: 5,
  });
  return perm;
}
