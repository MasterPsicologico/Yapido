/* ========================================================================
   AFFILIATE SYSTEM
   Builds Amazon + iHerb search URLs with affiliate tags
   The user REPLACES these tags with their own in production
   ======================================================================== */

window.Affiliate = (function() {

  // ⚠️ REPLACE WITH YOUR OWN AFFILIATE TAGS
  // Get yours at: https://affiliate-program.amazon.com (Amazon)
  //               https://affiliate.iherb.com (iHerb)
  const CONFIG = {
    amazon: {
      tag: 'radarsuplemen-20', // <-- CAMBIAR por tu tag de Amazon
      baseUrl: 'https://www.amazon.com/s',
      enabled: true
    },
    iherb: {
      // iHerb affiliate: &rcode=YOURCODE in URL
      // We use search URL with rcode appended
      baseUrl: 'https://iherb.com/search',
      // e.g. affil: 'YOURCODE'
      affil: '', // <-- CAMBIAR por tu código de iHerb
      enabled: false
    }
  };

  /**
   * Generate a search URL for a supplement on Amazon
   * Strategy: brand + supplement name + "supplement" keywords for SEO
   */
  function amazonUrl(supp) {
    if (!CONFIG.amazon.enabled) return null;
    const brand = pickBrand(supp);
    const query = encodeURIComponent(`${brand} ${supp.name} supplement`);
    return `${CONFIG.amazon.baseUrl}?k=${query}&tag=${CONFIG.amazon.tag}&linkCode=ogi&th=1`;
  }

  function iherbUrl(supp) {
    if (!CONFIG.iherb.enabled) return null;
    const brand = pickBrand(supp);
    const query = encodeURIComponent(`${brand} ${supp.name}`);
    let url = `${CONFIG.iherb.baseUrl}?kw=${query}`;
    if (CONFIG.iherb.affil) url += `&rcode=${CONFIG.iherb.affil}`;
    return url;
  }

  /**
   * Pick a quality brand based on category and goal
   * Real brands: Thorne, Life Extension, Jarrow, NOW, Pure Encapsulations,
   * Designs for Health, Klean Athlete, Nootropics Depot, Double Wood, Momentous
   */
  function pickBrand(supp) {
    const cat = supp.category;
    const tags = supp.tags || [];
    const name = supp.name.toLowerCase();

    // Premium brands by category
    if (name.includes('ashwagandha') || name.includes('ksm')) return 'Nootropics Depot KSM-66';
    if (name.includes('l-teanina') || name.includes('teanina')) return 'Jarrow L-Theanine';
    if (name.includes('melena') || name.includes('lions mane')) return 'Nootropics Depot Lions Mane';
    if (name.includes('nmn')) return 'Double Wood NMN';
    if (name.includes('resveratrol')) return 'Life Extension Resveratrol';
    if (name.includes('coq10') || name.includes('ubiquinol')) return 'Jarrow Ubiquinol';
    if (name.includes('rhodiola')) return 'Nootropics Depot Rhodiola';
    if (name.includes('bacopa')) return 'Nootropics Depot Bacopa';
    if (name.includes('citicolina') || name.includes('cdp')) return 'Jarrow Citicoline';
    if (name.includes('creatina')) return 'Thorne Creatine';
    if (name.includes('magnesio') || name.includes('glycinate')) return 'Pure Encapsulations Magnesium Glycinate';
    if (name.includes('omega') || name.includes('fish oil')) return 'Nordic Naturals Omega-3';
    if (name.includes('vitamina d') || name.includes('vit d')) return 'Thorne Vitamin D + K2';
    if (name.includes('k2')) return 'Thorne K2';
    if (name.includes('zinc')) return 'Thorne Zinc Picolinate';
    if (name.includes('b-complex') || name.includes('complejo b')) return 'Designs for Health B-Complex';
    if (name.includes('b12')) return 'Jarrow Methyl B-12';
    if (name.includes('folato') || name.includes('folate')) return 'Thorne 5-MTHF';
    if (name.includes('melatonina') || name.includes('melatonin')) return 'Pure Encapsulations Melatonin';
    if (name.includes('glicina') || name.includes('glycine')) return 'Designs for Health Glycine';
    if (name.includes('apigenin')) return 'Nootropics Depot Apigenin';
    if (name.includes('berberina') || name.includes('berberine')) return 'Thorne Berberine';
    if (name.includes('tongkat')) return 'Nootropics Depot Tongkat Ali';
    if (name.includes('saw palmetto')) return 'Life Extension Saw Palmetto';
    if (name.includes('boro') || name.includes('boron')) return 'Thorne Boron';
    if (name.includes('probióticos') || name.includes('probiotic')) return 'Designs for Health ProbioMed';
    if (name.includes('nac')) return 'Jarrow NAC';
    if (name.includes('vitamina c') || name.includes('vit c')) return 'Pure Encapsulations Vitamin C';
    if (name.includes('cúrcuma') || name.includes('curcumina') || name.includes('curcumin')) return 'Thorne Curcumin Meriva';
    if (name.includes('cardo') || name.includes('milk thistle')) return 'Jarrow Milk Thistle';
    if (name.includes('hierro') || name.includes('iron')) return 'Thorne Iron Bisglycinate';
    if (name.includes('colágeno') || name.includes('collagen')) return 'Vital Proteins Collagen Peptides';
    if (name.includes('hialurónico') || name.includes('hyaluronic')) return 'Jarrow Hyaluronic Acid';
    if (name.includes('beta alanina') || name.includes('beta-alanine')) return 'Klean Athlete Beta Alanine';
    if (name.includes('citrulina') || name.includes('citrulline')) return 'Klean Athlete Citrulline';
    if (name.includes('pqq')) return 'Jarrow PQQ';
    if (name.includes('taurina') || name.includes('taurine')) return 'Jarrow Taurine';
    if (name.includes('fosfatidilserina') || name.includes('ps')) return 'Jarrow Phosphatidylserine';

    // Default
    return supp.name;
  }

  /**
   * Build affiliate cards for an array of supplement ids
   */
  function buildCards(suppIds, limit = 9) {
    const cards = [];
    let priority = 1;

    for (const id of suppIds.slice(0, limit)) {
      const supp = window.SUPPLEMENTS_DB.find(s => s.id === id);
      if (!supp) continue;

      const aUrl = amazonUrl(supp);
      if (!aUrl) continue;

      cards.push({
        id: supp.id,
        name: supp.name,
        dose: supp.dose,
        brand: pickBrand(supp),
        amazonUrl: aUrl,
        iherbUrl: iherbUrl(supp),
        priority
      });
      priority++;
    }
    return cards;
  }

  return { buildCards, amazonUrl, iherbUrl, pickBrand, CONFIG };
})();
