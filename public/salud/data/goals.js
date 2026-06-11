/* ========================================================================
   GOAL → SUPPLEMENT MAPPING
   For each goal, list of supplements that address it, with weight (0-1)
   Used to score the stack and identify gaps
   ======================================================================== */

window.GOAL_MAPPING = {
  sleep: [
    { id: 'magnesium', weight: 0.9, note: 'Glicinato: reduce cortisol y relaja' },
    { id: 'glycine', weight: 0.85, note: 'Baja temperatura corporal, sueño profundo' },
    { id: 'apigenin', weight: 0.7, note: 'Modulador GABA suave' },
    { id: 'melatonin', weight: 0.6, note: 'Solo si tienes jet-lag o shift work' },
    { id: 'l_theanine', weight: 0.65, note: 'Calma sin sedar' },
    { id: 'taurine', weight: 0.5, note: 'GABA-like, apoya sueño profundo' },
    { id: 'ashwagandha', weight: 0.5, note: 'Reduce cortisol (noche)' },
  ],
  focus: [
    { id: 'creatine', weight: 0.9, note: 'Energía cerebral ATP' },
    { id: 'l_theanine', weight: 0.85, note: 'Foco sin ansiedad' },
    { id: 'caffeine', weight: 0.7, note: 'Atención y alerta' },
    { id: 'cdp_choline', weight: 0.85, note: 'Acetilcolina para memoria' },
    { id: 'lions_mane', weight: 0.75, note: 'NGF, plasticidad neuronal' },
    { id: 'bacopa', weight: 0.7, note: 'Memoria largo plazo (4-8 sem)' },
    { id: 'omega3', weight: 0.7, note: 'DHA = 60% de la grasa cerebral' },
    { id: 'b_complex', weight: 0.6, note: 'Co-factores neurológicos' },
    { id: 'rhodiola', weight: 0.6, note: 'Anti-fatiga mental' },
  ],
  energy: [
    { id: 'creatine', weight: 0.85, note: 'ATP celular' },
    { id: 'b_complex', weight: 0.85, note: 'Co-factores mitocondriales' },
    { id: 'b12', weight: 0.7, note: 'Si eres vegano/deficiente' },
    { id: 'iron', weight: 0.7, note: 'Solo si hay deficiencia (análisis de sangre)' },
    { id: 'coq10', weight: 0.75, note: 'Cadena de transporte de electrones' },
    { id: 'rhodiola', weight: 0.7, note: 'Adaptógeno anti-fatiga' },
    { id: 'vit_d3_k2', weight: 0.6, note: 'Deficiencia común = fatiga' },
    { id: 'taurine', weight: 0.55, note: 'Soporte mitocondrial' },
    { id: 'pqq', weight: 0.5, note: 'Biogénesis mitocondrial' },
  ],
  longevity: [
    { id: 'vit_d3_k2', weight: 0.85, note: 'Hormona esteroide, longevidad validada' },
    { id: 'omega3', weight: 0.85, note: 'Anti-inflamatorio sistémico' },
    { id: 'nmn', weight: 0.8, note: 'NAD+ decae con la edad' },
    { id: 'resveratrol', weight: 0.65, note: 'Sirtuinas (sinergia NMN)' },
    { id: 'coq10', weight: 0.7, note: 'Mitocondria (decae post-40)' },
    { id: 'magnesium', weight: 0.7, note: 'Cofactor de 600+ enzimas' },
    { id: 'creatine', weight: 0.65, note: 'Cognición + músculo + longevidad' },
    { id: 'pqq', weight: 0.55, note: 'Crea nuevas mitocondrias' },
    { id: 'taurine', weight: 0.6, note: 'Atributo de centenarians (Ata)' },
    { id: 'collagen', weight: 0.55, note: 'Piel + articulaciones' },
  ],
  stress: [
    { id: 'ashwagandha', weight: 0.95, note: 'Reduce cortisol 30%' },
    { id: 'magnesium', weight: 0.85, note: 'Agotado por estrés crónico' },
    { id: 'l_theanine', weight: 0.85, note: 'Alpha waves inmediatas' },
    { id: 'rhodiola', weight: 0.75, note: 'Adaptógeno, anti-burnout' },
    { id: 'b_complex', weight: 0.7, note: 'B6, B9, B12 agotadas por estrés' },
    { id: 'apigenin', weight: 0.6, note: 'Relajación suave' },
    { id: 'phosphatidylserine', weight: 0.6, note: 'Regula cortisol post-estrés' },
    { id: 'taurine', weight: 0.55, note: 'GABA-like' },
  ],
  athletic: [
    { id: 'creatine', weight: 0.95, note: 'Fuerza + potencia #1' },
    { id: 'beta_alanine', weight: 0.85, note: 'Resistencia muscular' },
    { id: 'citrulline', weight: 0.8, note: 'Pump + óxido nítrico' },
    { id: 'magnesium', weight: 0.7, note: 'Recuperación + calambres' },
    { id: 'omega3', weight: 0.65, note: 'Anti-inflamatorio, recuperación' },
    { id: 'tongkat_ali', weight: 0.65, note: 'T libre + rendimiento' },
    { id: 'zinc', weight: 0.6, note: 'Testosterona + recuperación' },
    { id: 'vit_d3_k2', weight: 0.6, note: 'Fuerza muscular' },
    { id: 'collagen', weight: 0.55, note: 'Tendones + articulaciones' },
    { id: 'phosphatidylserine', weight: 0.5, note: 'Recuperación post-ejercicio' },
  ],
  immunity: [
    { id: 'vit_d3_k2', weight: 0.9, note: 'Modulador inmune clave' },
    { id: 'zinc', weight: 0.85, note: 'Función inmune + células T' },
    { id: 'vit_c', weight: 0.7, note: 'Antioxidante + inmune' },
    { id: 'probiotics', weight: 0.75, note: '70% del inmune vive en gut' },
    { id: 'omega3', weight: 0.65, note: 'Anti-inflamatorio' },
    { id: 'lions_mane', weight: 0.5, note: 'Beta-glucanos inmunoestimulantes' },
    { id: 'nac', weight: 0.55, note: 'Glutatión + vías respiratorias' },
    { id: 'magnesium', weight: 0.55, note: 'Cofactor inmune' },
  ],
  mood: [
    { id: 'omega3', weight: 0.85, note: 'EPA alta: antidepresivo natural' },
    { id: 'vit_d3_k2', weight: 0.8, note: 'Deficiencia = tristeza estacional' },
    { id: 'b_complex', weight: 0.75, note: 'B6, B9, B12 cruciales' },
    { id: 'folate', weight: 0.7, note: 'MTHF cruza BBB' },
    { id: 'magnesium', weight: 0.7, note: 'Calma + sueño = mejor ánimo' },
    { id: 'ashwagandha', weight: 0.65, note: 'Cortisol + serotonina' },
    { id: 'l_theanine', weight: 0.6, note: 'Ondas alfa, calma' },
    { id: 'rhodiola', weight: 0.6, note: 'Anti-fatiga + motivacional' },
    { id: 'probiotics', weight: 0.55, note: 'Eje gut-brain' },
    { id: 'tongkat_ali', weight: 0.5, note: 'Boost de energía + confianza' },
  ],
  libido: [
    { id: 'tongkat_ali', weight: 0.9, note: 'Boost T libre + deseo' },
    { id: 'ashwagandha', weight: 0.75, note: 'T + cortisol + óxido nítrico' },
    { id: 'zinc', weight: 0.7, note: 'Materia prima testosterona' },
    { id: 'boron', weight: 0.65, note: 'Aumenta T libre' },
    { id: 'citrulline', weight: 0.55, note: 'Flujo sanguíneo' },
    { id: 'magnesium', weight: 0.55, note: 'Dormir bien = libido alta' },
  ],
  weight: [
    { id: 'berberine', weight: 0.85, note: 'Regula glucosa + sensibilidad' },
    { id: 'omega3', weight: 0.65, note: 'Metabolismo lipídico' },
    { id: 'chromium', weight: 0.6, note: 'Insulina + antojos' },
    { id: 'green_tea_extract', weight: 0.6, note: 'Termogénesis + EGCG' },
    { id: 'protein', weight: 0.85, note: 'Saciedad + termogénesis' },
    { id: 'magnesium', weight: 0.55, note: 'Sensibilidad insulina' },
    { id: 'probiotics', weight: 0.5, note: 'Microbiota + peso' },
  ],
  hormonal: [
    { id: 'ashwagandha', weight: 0.85, note: 'T + cortisol + fertilidad' },
    { id: 'tongkat_ali', weight: 0.8, note: 'T libre' },
    { id: 'zinc', weight: 0.75, note: 'Materia prima T' },
    { id: 'boron', weight: 0.7, note: 'T libre + DHEA' },
    { id: 'magnesium', weight: 0.65, note: 'Insulina + cortisol' },
    { id: 'vit_d3_k2', weight: 0.7, note: 'Hormona esteroide' },
    { id: 'saw_palmetto', weight: 0.5, note: 'Si eres hombre, anti-DHT' },
    { id: 'folate', weight: 0.5, note: 'Si eres mujer, fertilidad' },
  ],
  skin: [
    { id: 'collagen', weight: 0.95, note: 'Péptidos bioactivos' },
    { id: 'vit_c', weight: 0.85, note: 'Síntesis de colágeno' },
    { id: 'hyaluronic_acid', weight: 0.8, note: 'Hidratación profunda' },
    { id: 'omega3', weight: 0.7, note: 'Barrera lipídica + inflamación' },
    { id: 'vit_d3_k2', weight: 0.5, note: 'Piel + mood' },
    { id: 'zinc', weight: 0.6, note: 'Acné + cicatrización' },
    { id: 'biotin', weight: 0.5, note: 'Cabello + uñas' },
  ],
  gut: [
    { id: 'probiotics', weight: 0.95, note: 'Re-poblar microbiota' },
    { id: 'prebiotic_fiber', weight: 0.85, note: 'Alimenta bacterias buenas' },
    { id: 'l_glutamine', weight: 0.7, note: 'Repara mucosa intestinal' },
    { id: 'digestive_enzymes', weight: 0.65, note: 'Mejor digestión' },
    { id: 'zinc_carnosine', weight: 0.6, note: 'Repara mucosa gástrica' },
    { id: 'magnesium', weight: 0.5, note: 'Relaja músculo liso intestinal' },
  ]
};

// LIFESTYLE PRESETS
window.LIFESTYLE_GAPS = {
  vegan: ['b12', 'iron', 'omega3', 'zinc', 'creatine', 'taurine'],
  vegetarian: ['b12', 'iron', 'omega3', 'zinc', 'creatine'],
  keto: ['electrolytes', 'magnesium', 'potassium'],
  mediterranean: [],
  omnivore: [],
};

// AGE BRACKET ADJUSTMENTS
window.AGE_GAPS = {
  // additional recommendations for these ages
  30: ['coq10'], // start earlier is better
  40: ['coq10', 'nmn', 'magnesium'],
  50: ['coq10', 'nmn', 'magnesium', 'taurine', 'pqq'],
  60: ['coq10', 'nmn', 'magnesium', 'taurine', 'pqq', 'collagen', 'creatine'],
  70: ['coq10', 'nmn', 'magnesium', 'taurine', 'pqq', 'collagen', 'creatine', 'b12'],
};
