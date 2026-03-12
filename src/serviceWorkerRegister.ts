// Archivo: src/serviceWorkerRegister.ts
// Este código registra el Service Worker en tu aplicación React

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js', { scope: '/' })
        .then((registration) => {
          console.log('✅ Service Worker registrado exitosamente:', registration);

          // Verificar actualizaciones cada hora
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);

          // Listener para nuevas versiones disponibles
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Nueva versión disponible, notificar al usuario
                  console.log('📦 Nueva versión disponible. Actualiza para obtener las últimas mejoras.');

                  // Opcional: Mostrar un toast/notificación al usuario
                  window.dispatchEvent(
                    new Event('sw-update-available')
                  );
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('❌ Error al registrar Service Worker:', error);
        });
    });

    // Manejar el evento de actualización
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  } else {
    console.warn('⚠️ Service Workers no soportados en este navegador');
  }
}
