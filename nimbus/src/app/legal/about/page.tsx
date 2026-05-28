
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold tracking-tight text-primary">
        Estamos redefiniendo la salud mental en Latinoamérica. Y esto es solo el comienzo.
      </h1>
      <p className="mt-6 text-xl leading-8 text-muted-foreground">
        En un continente donde millones luchan en silencio, Nimbus no es solo una aplicación. Es un Ecosistema de Bienestar Emocional escalable, impulsado por IA, diseñado para convertir la introspección en una herramienta diaria y accesible para todos.
      </p>
      
      <div className="mt-10">
        <h2 className="text-base font-semibold leading-7 text-primary">El Problema: Una Epidemia Silenciosa y un Mercado Desatendido</h2>
        <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          ~1 de cada 4 latinos sufrirá un trastorno mental, pero &lt;1% recibe tratamiento.
        </p>
        <p className="mt-6 text-lg text-muted-foreground">
          El estigma, el costo y la falta de acceso han creado una barrera casi insuperable para la salud mental en Latinoamérica. El modelo tradicional no puede escalar. El mercado, valorado en miles de millones, está esperando una disrupción tecnológica. Esa disrupción es Nimbus.
        </p>
      </div>

      <figure className="mt-10">
        <Image
          className="aspect-video w-full rounded-xl bg-gray-50 object-cover"
          src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1200&fit=max"
          alt="Dashboard con gráficos y datos de análisis"
          data-ai-hint="data dashboard analytics"
          width={1200}
          height={600}
        />
        <figcaption className="mt-4 flex gap-x-2 text-sm leading-6 text-muted-foreground">
          Nuestra ventaja: un ecosistema que genera data-driven insights sobre el bienestar emocional a una escala sin precedentes.
        </figcaption>
      </figure>

      <div className="mt-16">
        <h2 className="text-base font-semibold leading-7 text-primary">La Solución: Un Modelo Híbrido y Escalable</h2>
        <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          IA para Escalar. Humanos para Sanar.
        </p>
        <p className="mt-6 text-lg text-muted-foreground">
          Nimbus ataca el problema con un enfoque de tres capas, creando un foso competitivo y múltiples vías de monetización:
        </p>
        <ul className="mt-8 space-y-6">
          <li className="flex gap-x-3">
            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">1</span>
            <span><strong className="font-semibold text-foreground">El Confidente IA (B2C - Freemium):</strong> La puerta de entrada. Un chatbot que ofrece un espacio seguro para la autoexploración y genera el "Cianotipo Psicológico", un perfil dinámico del usuario. Esto crea un engagement masivo y una base de datos única.</span>
          </li>
          <li className="flex gap-x-3">
            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">2</span>
            <span><strong className="font-semibold text-foreground">Herramientas Premium (B2C - Suscripción):</strong> Módulos como el "Gimnasio Emocional" y el "Oráculo" ofrecen valor recurrente y convierten a usuarios gratuitos en suscriptores de pago.</span>
          </li>
          <li className="flex gap-x-3">
             <span className="flex h-6 w-6 flex-none items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">3</span>
            <span><strong className="font-semibold text-foreground">Marketplace de Profesionales (B2B/B2C - Comisión):</strong> Conectamos a usuarios listos para la terapia con profesionales verificados, creando un flujo de ingresos por comisión y ofreciendo a los terapeutas herramientas de IA para optimizar su práctica.</span>
          </li>
        </ul>
      </div>

      <div className="mt-16 border-t border-border pt-16">
        <h2 className="text-2xl font-bold tracking-tight">El Fundador: La Fusión Perfecta</h2>
        <div className="mt-6 flex flex-col sm:flex-row gap-8 items-start">
            <Image
                className="aspect-square w-32 h-32 rounded-full bg-gray-50 object-cover shadow-lg"
                src="https://picsum.photos/seed/oscar-rop/200/200"
                alt="Retrato de Oscar David Ropero Saldaña"
                data-ai-hint="founder portrait professional"
                width={200}
                height={200}
            />
            <div className="flex-1">
                <p className="text-lg leading-8 text-muted-foreground">
                    Impulsado por una doble formación en Psicología (UNAD) y una profunda pasión por la tecnología, Oscar Ropero no es solo un psicólogo que sabe programar; es un fundador con una visión única para resolver un problema que entiende a nivel clínico y técnico.
                </p>
                <blockquote className="mt-4 border-l-4 border-primary pl-4 italic text-foreground">
                    "Mi obsesión es construir lo que el sistema de salud mental tradicional no puede: un servicio escalable, personalizado y profundamente humano. Nimbus no es el fin de la terapia, es su nuevo comienzo. Estamos construyendo el futuro del bienestar emocional, y buscamos socios que entiendan la magnitud de esta oportunidad."
                </blockquote>
                <p className="mt-4 font-semibold">- Oscar David Ropero Saldaña, Fundador</p>
            </div>
        </div>
      </div>
    </div>
  );
}
