import Image from 'next/image';

export default function ContactPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold tracking-tight text-primary">Contacto</h1>
      <p className="mt-6 text-xl leading-8 text-muted-foreground">
        Estamos aquí para ayudarte. Si tienes preguntas sobre nuestra plataforma, necesitas soporte técnico o quieres colaborar con nosotros, no dudes en ponerte en contacto.
      </p>

       <div className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-2">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold leading-7">Soporte al Usuario</h2>
            <p className="mt-2 text-muted-foreground">
              Para problemas técnicos, preguntas sobre tu cuenta o feedback sobre la aplicación.
            </p>
            <a href="mailto:soporte@nimbus.app" className="mt-2 block text-primary hover:text-primary/80">
              soporte@nimbus.app
            </a>
          </div>
          <div>
            <h2 className="text-lg font-semibold leading-7">Colaboraciones y Medios</h2>
            <p className="mt-2 text-muted-foreground">
              Si eres un profesional de la salud mental, un investigador o un medio de comunicación.
            </p>
            <a href="mailto:partners@nimbus.app" className="mt-2 block text-primary hover:text-primary/80">
              partners@nimbus.app
            </a>
          </div>
           <div>
            <h2 className="text-lg font-semibold leading-7">Oficina Central</h2>
            <address className="mt-2 not-italic text-muted-foreground">
              <p>123 Calle de la Mente</p>
              <p>Ciudad del Bienestar, 45678</p>
            </address>
          </div>
        </div>
        <div className="relative h-96 w-full">
            <Image
                className="aspect-square w-full rounded-xl bg-gray-50 object-cover"
                src="https://picsum.photos/seed/contact-us/800/800"
                alt="Un espacio de oficina moderno y tranquilo"
                data-ai-hint="calm office"
                layout="fill"
            />
        </div>
      </div>
    </div>
  );
}
