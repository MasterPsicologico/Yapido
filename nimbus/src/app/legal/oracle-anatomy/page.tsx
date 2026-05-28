
export default function OracleAnatomyPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold tracking-tight text-primary">Anatomía del Oráculo: El Funcionamiento del "Espejo Sincronizado"</h1>
      <p className="mt-4 text-sm text-muted-foreground">Documento técnico sobre el motor de IA de Nimbus.</p>
      
      <p className="mt-6 text-xl leading-8 text-muted-foreground">
        Has solicitado un mapa del alma de Nimbus, una explicación de cómo funciona el sistema que te proporciona respuestas con una profunda carga contextual. Aquí está, desglosado paso a paso.
      </p>

      <p className="mt-4">
        El sistema actual opera bajo un principio que denomino <strong>"El Detective Diligente"</strong>. No es el más rápido, pero su meticulosidad es la clave de su poder.
      </p>
      
      <div className="my-8 border-b border-border" />

      <h2 className="mt-10 text-2xl font-bold tracking-tight">Paso 1: La Interacción Inicial (Tu Mensaje)</h2>
      <p className="mt-4">
        Todo comienza en la interfaz de chat. Cuando envías un mensaje, la función <code>handleSendMessage</code> en <code>chat-panel.tsx</code> se activa. Esta función es el punto de partida de toda la cadena de procesamiento.
      </p>

      <h2 className="mt-10 text-2xl font-bold tracking-tight">Paso 2: La Recolección del "Dossier del Alma"</h2>
      <p className="mt-4">
        Aquí es donde reside la magia y también el cuello de botella del sistema. Antes de que la IA pueda "pensar", el sistema realiza una recolección exhaustiva de datos en el servidor (<code>src/app/c/actions.ts</code>) para construir un dossier completo y actualizado sobre ti. Este proceso, invisible para ti, consulta múltiples colecciones de la base de datos en tiempo real:
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-6">
        <li><strong>El Cianotipo Psicológico:</strong> Se accede a tu perfil completo (<code>/users/{'{tu-id}'}/profile/main</code>) para obtener los análisis más profundos de la IA sobre ti: tu arquetipo, tu conflicto nuclear, tus sesgos cognitivos y tu bucle de hábito.</li>
        <li><strong>El Diario de Sueños:</strong> Se consultan tus sueños más recientes (<code>/users/{'{tu-id}'}/dreams</code>) para extraer los títulos y las interpretaciones, buscando temas recurrentes.</li>
        <li><strong>El Historial de Diagnósticos:</strong> Se revisan tus sesiones en el Centro de Diagnóstico (<code>/users/{'{tu-id}'}/diagnosticSessions</code>) para entender las impresiones clínicas.</li>
        <li><strong>La Propia Mente de la IA:</strong> Se lee el estado interno del chatbot (<code>/users/{'{tu-id}'}/chatbotState/main</code>), su "cianotipo" sobre ti.</li>
        <li><strong>El Historial de la Conversación:</strong> Se recopila el historial completo del chat actual. Si es muy largo, un flujo de IA lo resume.</li>
      </ul>
       <p className="mt-4">Todos estos datos se fusionan en un único documento masivo: el <strong>"Dossier del Alma"</strong>.</p>

       <div className="my-8 border-b border-border" />

      <h2 className="mt-10 text-2xl font-bold tracking-tight">Paso 3: La Consulta al Oráculo (El Prompt Maestro)</h2>
      <p className="mt-4">
        El "Dossier del Alma" completo, junto con tu último mensaje, se ensambla en un prompt monumental (<code>expertAgentSystemPrompt</code>). Este prompt no es una simple pregunta; es un conjunto de directivas complejas que ordenan a la IA:
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-6">
        <li><strong>Asumir su Identidad:</strong> Actuar como "Nimbus, el Espejo Sincronizado".</li>
        <li><strong>Sintetizar, no Responder:</strong> Su mandato no es contestar a tu pregunta, sino usar tu último mensaje como un catalizador para <strong>encontrar y articular las conexiones ocultas</strong> entre lo que acabas de decir y la vasta información contenida en el dossier.</li>
        <li><strong>Actuar con Sutileza:</strong> Debe tejer estas conexiones de forma natural, sin anunciar las técnicas que está utilizando.</li>
      </ul>
      
      <div className="my-8 border-b border-border" />

      <h2 className="mt-10 text-2xl font-bold tracking-tight">Análisis de Rendimiento: El Dilema del Detective</h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h3 className="text-xl font-semibold text-green-400">Calidad de Respuesta: 95/100</h3>
                <p className="mt-2"><strong>Ventaja (La Riqueza de Datos):</strong> La profundidad de las respuestas es excepcional porque la IA tiene una visión de 360 grados de tu "ser digital" en cada interacción. Es capaz de conectar un comentario casual de hoy con un sueño de la semana pasada o un patrón de tu perfil psicológico. Esta es la esencia de su poder.</p>
            </div>
             <div>
                <h3 className="text-xl font-semibold text-amber-400">Eficiencia de Velocidad: 60/100</h3>
                <p className="mt-2"><strong>Desventaja (La Fuerza Bruta):</strong> El sistema es un "detective" que vuelve a leer el expediente completo para cada pista. Realiza múltiples lecturas de la base de datos por cada mensaje que envías. Esta recolección masiva de datos es la causa principal de la latencia que experimentas. Es un sistema costoso en términos de operaciones y tiempo.</p>
            </div>
        </div>

        <div className="my-8 border-b border-border" />

        <h2 className="mt-10 text-2xl font-bold tracking-tight">La Evolución Posible: Hacia el "Contexto Persistente"</h2>
         <p className="mt-4">
            ¿Se puede mejorar sin sacrificar el alma del sistema? <strong>Sí.</strong>
        </p>
         <p className="mt-4">
            El siguiente paso evolutivo es transformar al "Detective Diligente" en un "Maestro de Ajedrez" que recuerda el tablero completo. La arquitectura de <strong>"Contexto Persistente"</strong> funcionaría así:
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-6">
            <li><strong>Carga Única:</strong> Al iniciar una conversación, el "Dossier del Alma" se cargaría <strong>una sola vez</strong> y se mantendría en la memoria del servidor durante esa sesión.</li>
            <li><strong>Actualizaciones Incrementales:</strong> En lugar de reconstruir todo el dossier, solo se actualizarían las piezas que han cambiado: tu último mensaje y quizás una nueva auto-reflexión de la IA.</li>
            <li><strong>El Resultado:</strong> La IA seguiría teniendo acceso a la misma riqueza de datos, pero el tiempo de "recolección" se eliminaría casi por completo. Obtendrías la misma profundidad de respuesta, pero con una velocidad drásticamente mayor.</li>
        </ol>
        <p className="mt-4">Implementar este cambio es una operación quirúrgica de alta precisión, pero representa el futuro de Nimbus: un sistema que no solo es profundo, sino instantáneamente reactivo.</p>
    </div>
  );
}
