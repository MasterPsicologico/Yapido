'use client';

import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { toast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export function NativeNotificationListener() {
  const { user } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    // Solo actuar si estamos en una plataforma nativa (iOS/Android)
    if (!Capacitor.isNativePlatform()) return;

    const initializePushNotifications = async () => {
      try {
        // 1. Verificar/Solicitar permisos
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
          console.warn('Permisos de notificaciones rechazados por el usuario.');
          return;
        }

        // 2. Registrar el dispositivo en el servicio de notificaciones (FCM)
        await PushNotifications.register();

        // 3. Listener: Registro exitoso (aquí obtenemos el Token del dispositivo)
        await PushNotifications.addListener('registration', async (token) => {
          console.log('Push registration success, token:', token.value);
          
          // GUARDAR TOKEN EN FIRESTORE:
          // Solo si el usuario está autenticado y tenemos acceso a firestore
          if (user?.uid && firestore) {
            try {
              const userRef = doc(firestore, 'users', user.uid);
              await updateDoc(userRef, {
                fcmToken: token.value,
                lastTokenUpdate: new Date().toISOString()
              });
              console.log('Token FCM guardado exitosamente en el perfil del usuario.');
            } catch (err) {
              console.error('Error al guardar el Token FCM en Firestore:', err);
            }
          }
        });

        // 4. Listener: Error en el registro
        await PushNotifications.addListener('registrationError', (error) => {
          console.error('Error on registration: ', JSON.stringify(error));
        });

        // 5. Listener: Recibida mientras la app está abierta (Primer plano)
        await PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push received: ', notification);
          toast({
            title: notification.title || 'Nueva Alerta',
            description: notification.body || '',
          });
        });

        // 6. Listener: El usuario hizo clic en la notificación
        await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('Push action performed: ', notification);
          // Aquí puedes redirigir al usuario a una página específica:
          // window.location.href = '/pedidos/' + notification.notification.data.pedidoId;
        });

      } catch (error) {
        console.error('Error al inicializar Push Notifications:', error);
      }
    };

    initializePushNotifications();

    // Limpieza de listeners al desmontar el componente
    return () => {
      if (Capacitor.isNativePlatform()) {
        PushNotifications.removeAllListeners();
      }
    };
  }, []);

  return null; // Este componente no renderiza nada visualmente
}
