import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politica de Privacidad - Lavadoras Yapido',
  description: 'Politica de Privacidad y tratamiento de datos en lavadoras.yapido.click',
};

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-foreground">Politica de Privacidad</h1>
        <p className="text-muted-foreground mb-6 text-sm">
          Ultima actualizacion: 1 de septiembre de 2026
        </p>

        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">1. Informacion que recopilamos</h2>
            <p>
              Recopilamos informacion que nos proporcionas directamente cuando creas una cuenta,
              realizas una solicitud de alquiler o te registras como repartidor:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
              <li>Nombre completo</li>
              <li>Correo electronico</li>
              <li>Numero de WhatsApp</li>
              <li>Direccion de entrega</li>
              <li>Historial de pedidos y alquileres</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">2. Como usamos tu informacion</h2>
            <p>Utilizamos tu informacion para:</p>
            <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
              <li>Gestionar tus pedidos y entregas a tiempo</li>
              <li>Comunicaciones sobre el estado de tus servicios</li>
              <li>Mejorar la calidad y funcionalidad de la app</li>
              <li>Garantizar la seguridad de las transacciones</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">3. Almacenamiento y seguridad</h2>
            <p>
              Tus datos se almacenan en servidores de Firebase (Google Cloud).
              No compartimos tu informacion personal con terceros sin tu consentimiento,
              salvo que sea requerido por ley o necesario para prestar el servicio solicitado.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">4. Cookies y tecnologias de seguimiento</h2>
            <p>
              Utilizamos localStorage y Firebase Authentication para mantener tu sesion activa
              y guardar tu historial de forma segura en la nube.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">5. Tus derechos</h2>
            <p>
              Puedes solicitar la eliminacion, modificacion o copia de tus datos personales
              contactandonos a traves de la app o por WhatsApp.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">6. Contacto</h2>
            <p>
              Para consultas sobre privacidad, escribenos desde la opcion de contacto en la app.
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-border text-center">
          <a
            href="/"
            className="text-primary hover:underline text-sm font-medium"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    </main>
  );
}