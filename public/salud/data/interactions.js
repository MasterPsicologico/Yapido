/* ========================================================================
   INTERACTIONS DATABASE
   supplement_id + trigger_id → interaction details
   trigger_id can be: another supplement_id OR a medication condition OR a lifestyle
   ======================================================================== */

window.INTERACTIONS_DB = [
  // === SUPPLEMENT + SUPPLEMENT ===
  {
    a: 'iron', b: 'calcium',
    severity: 'critical',
    title: 'Hierro + Calcio bloquean absorción',
    detail: 'Tómalos con al menos 2-3h de separación. El calcio reduce absorción de hierro hasta 60%.',
    recommendation: 'Hierro en ayunas con Vit C. Calcio en otra comida.'
  },
  {
    a: 'iron', b: 'zinc',
    severity: 'critical',
    title: 'Hierro + Zinc compiten por absorción',
    detail: 'Ambos usan los mismos transportadores. Separar 2-3h mínimo.',
    recommendation: 'Hierro AM, Zinc PM (o en comidas distintas).'
  },
  {
    a: 'iron', b: 'magnesium',
    severity: 'warning',
    title: 'Hierro + Magnesio: absorción reducida',
    detail: 'Tómalos separados al menos 2h.',
    recommendation: 'Hierro AM, Magnesio PM (de hecho coincide con su timing ideal).'
  },
  {
    a: 'iron', b: 'thyroid_med',
    severity: 'critical',
    title: 'Hierro + Levotiroxina: absorción bloqueada',
    detail: 'Hierro reduce absorción de tiroxina hasta 50%. Separar 4h.',
    recommendation: 'Levotiroxina en ayunas. Hierro al menos 4h después.'
  },
  {
    a: 'calcium', b: 'thyroid_med',
    severity: 'critical',
    title: 'Calcio + Levotiroxina: absorción reducida',
    detail: 'Calcio carbonato debe separarse 4h de la levotiroxina.',
    recommendation: 'Tiroides AM en ayunas. Calcio al almuerzo/cena.'
  },
  {
    a: 'zinc', b: 'calcium',
    severity: 'warning',
    title: 'Zinc + Calcio compiten',
    detail: 'Toma en comidas distintas.',
    recommendation: 'Zinc con cena, calcio con almuerzo.'
  },
  {
    a: 'zinc', b: 'copper',
    severity: 'info',
    title: 'Zinc depleciona cobre a largo plazo',
    detail: 'Si tomas zinc >30mg/día por meses, añade 1-2mg cobre.',
    recommendation: 'Cobre 1-2mg o un multi que lo incluya.'
  },
  {
    a: 'caffeine', b: 'l_theanine',
    severity: 'safe',
    title: 'Sinergia: Cafeína + L-Teanina',
    detail: 'Combinación probada: foco limpio sin nervios ni crash. Alpha waves aumentadas.',
    recommendation: '100mg cafeína + 100-200mg L-teanina juntos.'
  },
  {
    a: 'vit_d3_k2', b: 'magnesium',
    severity: 'safe',
    title: 'Sinergia: Vit D3 + Magnesio',
    detail: 'El magnesio es cofactor para activar Vit D. Sin Mg, la Vit D no se metaboliza bien.',
    recommendation: 'Tómalos en el mismo día (ideal AM Mg glicinato + AM Vit D).'
  },
  {
    a: 'vit_d3_k2', b: 'vit_k',
    severity: 'safe',
    title: 'Sinergia: Vit D3 + K2',
    detail: 'K2 dirige el calcio que Vit D ayuda a absorber hacia los huesos, no arterias.',
    recommendation: 'Busca un combo D3+K2 o tómalos juntos en comida con grasa.'
  },
  {
    a: 'omega3', b: 'vit_e',
    severity: 'safe',
    title: 'Sinergia: Omega-3 + Vit E',
    detail: 'Vit E protege los ácidos grasos de la oxidación.',
    recommendation: 'El omega-3 de calidad ya incluye algo de Vit E.'
  },
  {
    a: 'curcumin', b: 'black_pepper',
    severity: 'safe',
    title: 'Sinergia: Cúrcuma + Piperina',
    detail: 'Piperina aumenta absorción de curcumina 2000%.',
    recommendation: 'Busca curcumina con piperina (Bioperine) o añade pimienta negra.'
  },
  {
    a: 'collagen', b: 'vit_c',
    severity: 'safe',
    title: 'Sinergia: Colágeno + Vit C',
    detail: 'Vit C es cofactor esencial para síntesis de colágeno endógeno.',
    recommendation: 'Tómalos juntos.'
  },
  {
    a: 'magnesium', b: 'b6',
    severity: 'safe',
    title: 'Sinergia: Magnesio + B6',
    detail: 'B6 (P5P) mejora la absorción celular de magnesio.',
    recommendation: 'Tómalos juntos, especialmente para el sueño.'
  },
  {
    a: 'creatine', b: 'beta_alanine',
    severity: 'safe',
    title: 'Sinergia: Creatina + Beta Alanina',
    detail: 'El stack de rendimiento más estudiado. Complementarios (fuerza + resistencia).',
    recommendation: 'Pre-workout o cualquier momento del día.'
  },
  {
    a: 'nmn', b: 'resveratrol',
    severity: 'safe',
    title: 'Sinergia: NMN + Resveratrol',
    detail: 'Protocolo Sinclair: NMN aporta NAD+, Resveratrol activa sirtuinas que lo usan.',
    recommendation: 'AM, con grasa para resveratrol.'
  },
  {
    a: 'coq10', b: 'omega3',
    severity: 'safe',
    title: 'Sinergia: CoQ10 + Omega-3',
    detail: 'Ambos mitocondriales. Combinación cardioprotectora.',
    recommendation: 'AM con desayuno graso.'
  },

  // === MEDICATION INTERACTIONS ===
  {
    a: 'omega3', b: 'anticoagulants',
    severity: 'critical',
    title: 'Omega-3 + Anticoagulantes: riesgo de sangrado',
    detail: 'Dosis altas (>3g) pueden aumentar efecto anticoagulante. Monitorear con médico.',
    recommendation: 'Mantener dosis <2g EPA+DHA y avisar al médico.'
  },
  {
    a: 'vit_k', b: 'anticoagulants',
    severity: 'critical',
    title: 'Vitamina K + Warfarina: anula efecto',
    detail: 'Vit K es el antídoto de la warfarina. Incompatible.',
    recommendation: 'NO tomar Vit K si usas warfarina. Consulta con tu médico.'
  },
  {
    a: 'ginkgo', b: 'anticoagulants',
    severity: 'critical',
    title: 'Ginkgo + Anticoagulantes: sangrado',
    detail: 'Ginkgo biloba potencia anticoagulantes. Combinación peligrosa.',
    recommendation: 'No combinar. Suspender 2 semanas antes de cirugía.'
  },
  {
    a: 'st_johns_wort', b: 'antidepressants',
    severity: 'critical',
    title: 'Hierba de San Juan + ISRS: síndrome serotoninérgico',
    detail: 'Combinación potencialmente mortal. Síndrome serotoninérgico.',
    recommendation: 'NUNCA combinar. Si tomas antidepresivos, evita St. John\'s Wort.'
  },
  {
    a: 'st_johns_wort', b: 'birthcontrol',
    severity: 'critical',
    title: 'Hierba de San Juan + Anticonceptivos: fallo',
    detail: 'Reduce eficacia anticonceptiva. Riesgo de embarazo no deseado.',
    recommendation: 'Usar método de respaldo o evitar SJW.'
  },
  {
    a: 'melatonin', b: 'antidepressants',
    severity: 'warning',
    title: 'Melatonina + ISRS: sedación aumentada',
    detail: 'Puede potenciar efectos sedantes. Ajustar dosis.',
    recommendation: 'Comenzar con 0.3mg. Monitorear somnolencia diurna.'
  },
  {
    a: 'caffeine', b: 'antidepressants',
    severity: 'warning',
    title: 'Cafeína + ISRS: ansiedad / insomnio',
    detail: 'ISRS pueden alterar metabolismo de cafeína. Efecto más prolongado.',
    recommendation: 'Limitar a 100mg/día. Evitar después de las 12h.'
  },
  {
    a: 'ashwagandha', b: 'thyroid_med',
    severity: 'warning',
    title: 'Ashwagandha + Levotiroxina: puede aumentar T3/T4',
    detail: 'Ashwagandha puede estimular tiroides. Riesgo de hipertiroidismo.',
    recommendation: 'Monitorizar función tiroidea con tu médico.'
  },
  {
    a: 'ashwagandha', b: 'anticoagulants',
    severity: 'warning',
    title: 'Ashwagandha + Anticoagulantes: puede aumentar sangrado',
    detail: 'Efecto antiinflamatorio puede potenciar anticoagulantes.',
    recommendation: 'Monitorizar INR con tu médico.'
  },
  {
    a: 'rhodiola', b: 'antidepressants',
    severity: 'warning',
    title: 'Rhodiola + ISRS: posible interacción',
    detail: 'Ambos afectan serotonina. Riesgo de síndrome serotoninérgico bajo.',
    recommendation: 'Consultar con médico. Monitorizar síntomas.'
  },
  {
    a: 'berberine', b: 'diabetes',
    severity: 'warning',
    title: 'Berberina + Metformina: hipoglucemia',
    detail: 'Efecto aditivo. Puede bajar demasiado el azúcar.',
    recommendation: 'Monitorizar glucosa. Ajustar dosis con médico.'
  },
  {
    a: 'nac', b: 'anticoagulants',
    severity: 'warning',
    title: 'NAC + Anticoagulantes: aumenta efecto',
    detail: 'NAC tiene efecto antitrombótico leve.',
    recommendation: 'Monitorizar. Dosis bajas de NAC son seguras.'
  },
  {
    a: 'curcumin', b: 'anticoagulants',
    severity: 'warning',
    title: 'Cúrcuma + Anticoagulantes: sangrado',
    detail: 'Cúrcuma tiene efecto antiplaquetario.',
    recommendation: 'Dosis culinarias OK. Suplementos altos, consultar médico.'
  },
  {
    a: 'citrulline', b: 'bp',
    severity: 'warning',
    title: 'Citrulina + Antihipertensivos: hipotensión',
    detail: 'Ambos bajan presión. Efecto aditivo.',
    recommendation: 'Monitorizar presión. Comenzar con dosis baja.'
  },
  {
    a: 'l_theanine', b: 'bp',
    severity: 'info',
    title: 'L-Teanina + Antihipertensivos: hipotensión leve',
    detail: 'Efecto relajante. Usualmente seguro y beneficioso.',
    recommendation: 'Beneficioso en general. Monitorizar si tienes presión baja.'
  },
  {
    a: 'tongkat_ali', b: 'bp',
    severity: 'warning',
    title: 'Tongkat Ali + Antihipertensivos',
    detail: 'Puede afectar presión arterial.',
    recommendation: 'Monitorizar. Suspender si hay cambios.'
  },
  {
    a: 'milk_thistle', b: 'antidepressants',
    severity: 'warning',
    title: 'Cardo Mariano + ISRS: altera metabolismo',
    detail: 'Cardo mariano afecta CYP450. Puede cambiar niveles de medicación.',
    recommendation: 'Espaciar 2h. Consultar farmacéutico.'
  },
  {
    a: 'ashwagandha', b: 'immunosuppressants',
    severity: 'critical',
    title: 'Ashwagandha + Inmunosupresores: contraindicado',
    detail: 'Ashwagandha estimula inmune. Anula efecto de inmunosupresores.',
    recommendation: 'NO combinar si tienes condición autoinmune o trasplante.'
  },
  {
    a: 'probiotics', b: 'immunosuppressants',
    severity: 'warning',
    title: 'Probióticos + Inmunosupresores: usar con cuidado',
    detail: 'En inmunocomprometidos, riesgo teórico de bacteriemia.',
    recommendation: 'Consultar médico. Saccharomyces boulardii está contraindicado.'
  },
  {
    a: 'echinacea', b: 'immunosuppressants',
    severity: 'critical',
    title: 'Equinacea + Inmunosupresores: contraindicado',
    detail: 'Equinacea es inmunoestimulante fuerte.',
    recommendation: 'Evitar si tienes condición autoinmune.'
  },
  {
    a: 'saw_palmetto', b: 'anticoagulants',
    severity: 'warning',
    title: 'Saw Palmetto + Anticoagulantes',
    detail: 'Efecto antiplaquetario leve. Usar con precaución.',
    recommendation: 'Suspender 2 semanas antes de cirugía.'
  },
  {
    a: 'saw_palmetto', b: 'birthcontrol',
    severity: 'info',
    title: 'Saw Palmetto + Anticonceptivos hormonales',
    detail: 'Efecto antiandrogénico puede interferir.',
    recommendation: 'Generalmente seguro. Monitorizar.'
  },
  {
    a: 'melatonin', b: 'birthcontrol',
    severity: 'info',
    title: 'Melatonina + Anticonceptivos: niveles aumentados',
    detail: 'Anticonceptivos reducen metabolización de melatonina.',
    recommendation: 'Comenzar con dosis muy baja (0.3mg).'
  },
  {
    a: 'ginseng', b: 'anticoagulants',
    severity: 'warning',
    title: 'Ginseng + Anticoagulantes: aumenta efecto',
    detail: 'Ginseng puede reducir agregación plaquetaria.',
    recommendation: 'Monitorizar INR. Suspender antes de cirugía.'
  },
  {
    a: 'ginseng', b: 'antidepressants',
    severity: 'warning',
    title: 'Ginseng + ISRS: manía en susceptibles',
    detail: 'Casos raros de manía.',
    recommendation: 'Monitorizar síntomas. Suspender si hay cambios de ánimo.'
  },
  {
    a: 'boron', b: 'birthcontrol',
    severity: 'info',
    title: 'Boro + Anticonceptivos: posible interacción hormonal',
    detail: 'Boro afecta metabolismo de estrógenos.',
    recommendation: 'Generalmente seguro. Monitorizar.'
  },

  // === PREGNANCY / LACTATION ===
  {
    a: 'vit_a_high', b: 'pregnancy',
    severity: 'critical',
    title: 'Vitamina A alta dosis + Embarazo: teratogénico',
    detail: 'Vit A retinoides en altas dosis son teratogénicos.',
    recommendation: 'Evitar Vit A >3000mcg RAE en embarazo. Usar beta-caroteno.'
  },
  {
    a: 'ashwagandha', b: 'pregnancy',
    severity: 'critical',
    title: 'Ashwagandha + Embarazo: contraindicado',
    detail: 'Riesgo de aborto por efectos hormonales.',
    recommendation: 'NO usar en embarazo ni lactancia.'
  },
  {
    a: 'rhodiola', b: 'pregnancy',
    severity: 'critical',
    title: 'Rhodiola + Embarazo: contraindicado',
    detail: 'Falta de estudios de seguridad.',
    recommendation: 'Evitar en embarazo y lactancia.'
  },
  {
    a: 'nmn', b: 'pregnancy',
    severity: 'warning',
    title: 'NMN + Embarazo: falta de estudios',
    detail: 'No hay datos de seguridad en embarazo.',
    recommendation: 'Evitar. Continuar con prenatal + omega-3 + folato.'
  },

  // === CONDITIONS ===
  {
    a: 'creatine', b: 'kidney',
    severity: 'warning',
    title: 'Creatina + Enfermedad renal: contraindicada',
    detail: 'Creatina eleva creatinina sérica. Precaución en ERC.',
    recommendation: 'No usar sin supervisión médica si tienes insuficiencia renal.'
  },
  {
    a: 'iron', b: 'liver',
    severity: 'warning',
    title: 'Hierro + Hepatopatía:慎用',
    detail: 'Exceso de hierro daña hígado.',
    recommendation: 'Solo suplementar si hay deficiencia confirmada.'
  },
  {
    a: 'milk_thistle', b: 'liver',
    severity: 'safe',
    title: 'Cardo Mariano + Hepatopatía: protector',
    detail: 'Cardo mariano es hepatoprotector.',
    recommendation: 'Útil. Consultar dosis con hepatólogo.'
  },
  {
    a: 'kava', b: 'liver',
    severity: 'critical',
    title: 'Kava + Hepatopatía: hepatotóxico',
    detail: 'Kava se ha asociado a falla hepática.',
    recommendation: 'Evitar kava, especialmente con daño hepático.'
  },
  {
    a: 'green_tea_extract', b: 'liver',
    severity: 'warning',
    title: 'Extracto de té verde + Hepatopatía:慎用',
    detail: 'EGCG en altas dosis es hepatotóxico.',
    recommendation: 'Dosis culinarias OK. Extractos concentrados evitar con daño hepático.'
  },
  {
    a: 'nmn', b: 'cancer_history',
    severity: 'warning',
    title: 'NMN + Historial de cáncer:争议',
    detail: 'NAD+ puede teóricamente alimentar células cancerosas. Estudios mixtos.',
    recommendation: 'Consultar oncólogo. No auto-suplementar si tienes historial.'
  },
  {
    a: 'ashwagandha', b: 'autoimmune',
    severity: 'critical',
    title: 'Ashwagandha + Autoinmune: contraindicado',
    detail: 'Estimula inmune. Puede empeorar lupus, Hashimoto, AR, etc.',
    recommendation: 'Evitar. Considerar magnesio + omega-3 como alternativa calmante.'
  },
  {
    a: 'rhodiola', b: 'autoimmune',
    severity: 'warning',
    title: 'Rhodiola + Autoinmune:慎用',
    detail: 'Efecto inmunoestimulante. Riesgo teórico.',
    recommendation: 'Consultar reumatólogo/inmunólogo.'
  },
  {
    a: 'lions_mane', b: 'autoimmune',
    severity: 'warning',
    title: 'Lion\'s Mane + Autoinmune:慎用',
    detail: 'Estimula inmune. Casos reportados de empeoramiento.',
    recommendation: 'Comenzar bajo y monitorizar síntomas.'
  },
  {
    a: 'l_theanine', b: 'stress',
    severity: 'safe',
    title: 'L-Teanina: ideal para estrés',
    detail: 'Alpha waves + GABA. Reduce ansiedad sin sedar.',
    recommendation: '200mg cuando sientas picos de estrés.'
  },
  {
    a: 'ashwagandha', b: 'stress',
    severity: 'safe',
    title: 'Ashwagandha: mejor para estrés crónico',
    detail: 'Reduce cortisol hasta 30% en 8 semanas (estudio).',
    recommendation: '600mg KSM-66 diario, 8+ semanas para efecto completo.'
  },

  // === TIMING / ABSORPTION ===
  {
    a: 'caffeine', b: 'sleep',
    severity: 'info',
    title: 'Cafeína tarde: afecta sueño',
    detail: 'Vida media 5-6h. 200mg a las 14h = 100mg a las 20h.',
    recommendation: 'Última cafeína antes de las 14h. Sleep hygiene crítica.'
  },
  {
    a: 'alcohol_general', b: 'sleep',
    severity: 'warning',
    title: 'Alcohol + Suplementos para sueño: antagoniza',
    detail: 'Alcohol fragmenta sueño REM. Anula efecto de melatonina, magnesio, glicina.',
    recommendation: 'Evitar alcohol 3h antes de dormir para sueño óptimo.'
  },
];

// ============================================================
// Helper: lookup interactions
// ============================================================
window.checkInteraction = function(a, b) {
  return window.INTERACTIONS_DB.find(i =>
    (i.a === a && i.b === b) || (i.a === b && i.b === a)
  );
};

window.checkInteractions = function(supplementIds, conditions = [], meds = []) {
  const all = [...supplementIds, ...conditions, ...meds];
  const results = [];

  for (let i = 0; i < supplementIds.length; i++) {
    for (let j = i + 1; j < supplementIds.length; j++) {
      const a = supplementIds[i];
      const b = supplementIds[j];
      const inter = window.checkInteraction(a, b);
      if (inter) results.push({ ...inter, source: 'supp_supp', items: [a, b] });
    }
  }

  // Supplement vs condition/med
  for (const supp of supplementIds) {
    for (const ctx of [...conditions, ...meds]) {
      if (ctx === 'none') continue;
      const inter = window.checkInteraction(supp, ctx);
      if (inter) results.push({ ...inter, source: 'supp_context', items: [supp, ctx] });
    }
  }

  return results;
};
