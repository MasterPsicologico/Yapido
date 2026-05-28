export default function PrivacyPolicyPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold tracking-tight text-primary">Política de Privacidad</h1>
      <p className="mt-4 text-sm text-muted-foreground">Última actualización: 24 de julio de 2024</p>
      
      <p className="mt-6 text-xl leading-8 text-muted-foreground">
        Su privacidad es fundamental para nosotros en Nimbus. Esta Política de Privacidad explica qué información recopilamos, cómo la usamos y protegemos, y sus derechos con respecto a su información.
      </p>

      <h2 className="mt-10 text-2xl font-bold tracking-tight">1. Información que Recopilamos</h2>
      <p className="mt-6">
        Recopilamos varios tipos de información para proporcionar y mejorar nuestra Aplicación:
      </p>
      <ul className="mt-4 space-y-4">
        <li>
          <strong>Información de la Cuenta:</strong> Cuando se registra a través de un proveedor como Google, recibimos su información básica de perfil, como su nombre, dirección de correo electrónico y URL de la foto de perfil, según lo permitido por usted a través de la configuración de privacidad de dicho proveedor.
        </li>
        <li>
          <strong>Contenido de las Conversaciones:</strong> Almacenamos el contenido de sus conversaciones (mensajes de texto y transcripciones de audio) con el asistente de IA para mantener el historial de su chat y utilizarlo como contexto para futuras interacciones. Este contenido está directamente asociado a su cuenta de usuario.
        </li>
        <li>
          <strong>Datos de Uso:</strong> Recopilamos información sobre cómo interactúa con la Aplicación, como las funciones que utiliza (ej. Gimnasio Emocional, Portal de Sueños) y la frecuencia de uso.
        </li>
        <li>
          <strong>Perfiles Psicológicos Generados:</strong> Almacenamos los perfiles psicológicos y otros análisis generados por la IA basados en sus conversaciones. Estos están vinculados a su cuenta para proporcionar un análisis evolutivo y personalizar su experiencia.
        </li>
      </ul>

      <h2 className="mt-10 text-2xl font-bold tracking-tight">2. Cómo Usamos Su Información</h2>
      <p className="mt-6">
        Utilizamos la información que recopilamos para los siguientes propósitos:
      </p>
      <ul className="mt-4 space-y-2">
        <li>Para operar y mantener la Aplicación.</li>
        <li>Para personalizar su experiencia, permitiendo que la IA recuerde conversaciones pasadas y se adapte a su perfil.</li>
        <li>Para generar análisis y visualizaciones como el Perfil Psicológico y el Constelador Emocional.</li>
        <li>Para mejorar y desarrollar nuevos productos, servicios y funciones.</li>
        <li>Para comunicarnos con usted, por ejemplo, para enviarle notificaciones de servicio.</li>
      </ul>
      <p className="mt-4">
        **Importante:** No utilizamos el contenido de sus conversaciones personales para entrenar nuestros modelos de IA de forma generalizada sin su consentimiento explícito. Sus chats se utilizan como contexto para las respuestas de la IA dentro de su propia cuenta, pero no se incorporan a los modelos base.
      </p>

      <h2 className="mt-10 text-2xl font-bold tracking-tight">3. Cómo Protegemos Su Información</h2>
      <p className="mt-6">
        Nos tomamos muy en serio la seguridad de sus datos. Utilizamos la infraestructura segura de Firebase de Google para almacenar y proteger su información. Esto incluye:
      </p>
      <ul className="mt-4 space-y-2">
        <li>Cifrado de datos en tránsito y en reposo.</li>
        <li>Reglas de seguridad de base de datos que restringen el acceso a los datos para que solo usted pueda acceder a su propia información.</li>
        <li>Autenticación segura a través de proveedores de confianza.</li>
      </ul>
      <p className="mt-4">
        A pesar de nuestras medidas de seguridad, ningún sistema es impenetrable. No podemos garantizar la seguridad absoluta de su información.
      </p>

      <h2 className="mt-10 text-2xl font-bold tracking-tight">4. Sus Derechos y Opciones</h2>
       <p className="mt-6">
        Usted tiene control sobre su información personal.
      </p>
       <ul className="mt-4 space-y-2">
        <li>
          <strong>Acceso y Modificación:</strong> Puede acceder y modificar la información de su perfil (nombre, foto) a través de las opciones de su cuenta.
        </li>
        <li>
          <strong>Eliminación de Datos:</strong> Puede eliminar conversaciones individuales o todo su historial de chat dentro de la Aplicación. Esto eliminará permanentemente los mensajes de nuestra base de datos.
        </li>
        <li>
          <strong>Eliminación de la Cuenta:</strong> Si elimina su cuenta, haremos un esfuerzo comercialmente razonable para eliminar todos sus datos asociados de nuestros sistemas.
        </li>
      </ul>

      <h2 className="mt-10 text-2xl font-bold tracking-tight">5. Cambios a esta Política de Privacidad</h2>
      <p className="mt-6">
        Podemos actualizar nuestra Política de Privacidad de vez en cuando. Le notificaremos de cualquier cambio publicando la nueva Política de Privacidad en esta página y actualizando la fecha de "Última actualización" en la parte superior.
      </p>

      <h2 className="mt-10 text-2xl font-bold tracking-tight">6. Contáctenos</h2>
      <p className="mt-6">
        Si tiene alguna pregunta sobre esta Política de Privacidad, por favor, póngase en contacto con nosotros a través de la información proporcionada en nuestra <a href="/legal/contact" className="text-primary hover:underline">página de contacto</a>.
      </p>
    </div>
  );
}
