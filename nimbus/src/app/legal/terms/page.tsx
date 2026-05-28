export default function TermsAndConditionsPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold tracking-tight text-primary">Términos y Condiciones de Uso</h1>
      <p className="mt-4 text-sm text-muted-foreground">Última actualización: 24 de julio de 2024</p>
      
      <p className="mt-6 text-xl leading-8 text-muted-foreground">
        Bienvenido a Nimbus. Estos términos y condiciones describen las reglas y regulaciones para el uso de nuestra aplicación. Al acceder y utilizar Nimbus, usted acepta estos términos y condiciones en su totalidad. No continúe usando Nimbus si no acepta todos los términos y condiciones establecidos en esta página.
      </p>

      <h2 className="mt-10 text-2xl font-bold tracking-tight">1. Definiciones</h2>
      <p className="mt-6">
        "La Aplicación", "Nosotros", "Nuestro" se refiere a Nimbus. "Usuario", "Usted" se refiere a la persona que accede a la aplicación. "Contenido" se refiere a texto, imágenes, audio u otro material que usted proporciona o que es generado por la Aplicación.
      </p>

      <h2 className="mt-10 text-2xl font-bold tracking-tight">2. Uso Aceptable</h2>
      <p className="mt-6">
        Usted se compromete a utilizar la Aplicación de manera responsable y legal. No debe utilizar la Aplicación para:
      </p>
      <ul className="mt-4 space-y-2">
        <li>Realizar cualquier actividad ilegal o fraudulenta.</li>
        <li>Acosar, abusar o dañar a otra persona.</li>
        <li>Transmitir cualquier material que sea obsceno, ofensivo o de odio.</li>
        <li>Intentar obtener acceso no autorizado a nuestros sistemas o redes.</li>
      </ul>

      <h2 className="mt-10 text-2xl font-bold tracking-tight">3. Cuentas de Usuario</h2>
      <p className="mt-6">
        Para acceder a la mayoría de las funciones de Nimbus, debe registrarse para obtener una cuenta. Usted es responsable de mantener la confidencialidad de la información de su cuenta y de todas las actividades que ocurran bajo su cuenta. Acepta notificarnos inmediatamente sobre cualquier uso no autorizado de su cuenta.
      </p>
      
      <h2 className="mt-10 text-2xl font-bold tracking-tight">4. Propiedad Intelectual</h2>
       <p className="mt-6">
        Usted es el propietario del contenido que introduce en la Aplicación (sus mensajes). Al usar la Aplicación, nos concede una licencia mundial, no exclusiva, libre de regalías para usar, reproducir, procesar y mostrar dicho contenido con el único propósito de operar, mejorar y personalizar la Aplicación para usted.
      </p>
      <p className="mt-4">
        El contenido generado por la Aplicación (respuestas de la IA, perfiles psicológicos, etc.) se le proporciona para su uso personal y no comercial. La Aplicación y su contenido original (excluyendo el contenido del usuario), características y funcionalidad son y seguirán siendo propiedad exclusiva de Nimbus y sus licenciantes.
      </p>

      <h2 className="mt-10 text-2xl font-bold tracking-tight">5. Descargo de Responsabilidad Médica</h2>
      <p className="mt-6">
        Nimbus **no es un servicio médico o de salud mental**. La aplicación es una herramienta de autoayuda y no proporciona diagnóstico, tratamiento ni consejo médico. Consulte nuestro <a href="/legal/disclaimer" className="text-primary hover:underline">Descargo de Responsabilidad</a> completo para obtener más información. En caso de una emergencia de salud mental, póngase en contacto con los servicios de emergencia locales.
      </p>

      <h2 className="mt-10 text-2xl font-bold tracking-tight">6. Terminación</h2>
      <p className="mt-6">
        Podemos terminar o suspender su acceso a nuestra Aplicación inmediatamente, sin previo aviso ni responsabilidad, por cualquier motivo, incluido, entre otros, si incumple los Términos. Todas las disposiciones de los Términos que por su naturaleza deberían sobrevivir a la terminación sobrevivirán a la terminación.
      </p>

      <h2 className="mt-10 text-2xl font-bold tracking-tight">7. Limitación de Responsabilidad</h2>
      <p className="mt-6">
        En la máxima medida permitida por la ley aplicable, en ningún caso Nimbus, ni sus directores, empleados, socios, agentes, proveedores o afiliados, serán responsables de ningún daño indirecto, incidental, especial, consecuente o punitivo, incluidos, entre otros, la pérdida de ganancias, datos, uso, buena voluntad u otras pérdidas intangibles, resultantes de su acceso o uso o incapacidad para acceder o usar la Aplicación.
      </p>

       <h2 className="mt-10 text-2xl font-bold tracking-tight">8. Cambios a los Términos</h2>
      <p className="mt-6">
        Nos reservamos el derecho, a nuestra sola discreción, de modificar o reemplazar estos Términos en cualquier momento. Si una revisión es material, intentaremos proporcionar un aviso de al menos 30 días antes de que entren en vigor los nuevos términos. Lo que constituye un cambio material se determinará a nuestra sola discreción.
      </p>
      
       <h2 className="mt-10 text-2xl font-bold tracking-tight">9. Contáctenos</h2>
       <p className="mt-6">
        Si tiene alguna pregunta sobre estos Términos, por favor, póngase en contacto con nosotros a través de nuestra <a href="/legal/contact" className="text-primary hover:underline">página de contacto</a>.
      </p>
    </div>
  );
}
