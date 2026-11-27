(function (global) {
  'use strict';
  const node = document.getElementById('yichen-regulatory-data');
  if (!node) return;
  const payload = JSON.parse(node.textContent || '{}');
  const manifest = payload.manifest || {};
  const files = payload.files || {};
  const getFile = path => files[path] || null;
  const isDate = value => typeof value === 'string' && /^\\d{4}-\\d{2}-\\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
  function selectVerifiedParameters(dataset, options) {
    const date = options && options.date;
    const jurisdiction = options && options.jurisdiction;
    if (!dataset || dataset.status !== 'verified' || !dataset.application_policy || dataset.application_policy.auto_apply !== true) return [];
    if (!isDate(date)) throw new TypeError('A valid calculation date (YYYY-MM-DD) is required.');
    return (dataset.official_parameters || []).filter(p =>
      p.status === 'verified' && p.verified_by && p.source && p.source.url && p.source.provision && p.source.agency &&
      isDate(p.effective_from) && p.effective_from <= date &&
      (!p.effective_to || (isDate(p.effective_to) && date <= p.effective_to)) &&
      (!jurisdiction || p.jurisdiction === jurisdiction)
    );
  }
  function loadBundle(cityCode, options) {
    const city = (manifest.county_city_files || []).find(item => item.code === String(cityCode));
    if (!city) throw new Error('Unknown county/city code: ' + cityCode);
    const cityDataset = getFile(city.path);
    if (!cityDataset) throw new Error('County/city dataset missing: ' + city.path);
    const laws = (manifest.central_law_files || []).map(getFile).filter(Boolean);
    const incentives = (manifest.incentive_files || []).map(getFile).filter(Boolean);
    const taxes = (manifest.tax_parameter_files || []).map(getFile).filter(Boolean);
    const selected = selectVerifiedParameters(cityDataset, options || {});
    const pending = [...laws, ...incentives, ...taxes].filter(record => record.status !== 'verified' || record.application_policy?.auto_apply !== true);
    return {
      jurisdiction: cityDataset.jurisdiction || null,
      calculationDate: options && options.date,
      applicableParameters: selected,
      userAssumptions: Array.isArray(cityDataset.user_assumptions) ? cityDataset.user_assumptions : [],
      centralLawReferences: laws,
      incentiveReferences: incentives,
      taxParameterReferences: taxes,
      reviewRequired: pending.map(record => record.id || record.title || 'unidentified-record'),
      safeToCalculate: selected.length > 0 && pending.length === 0
    };
  }
  global.YichenRegulatoryData = Object.freeze({
    manifest,
    getFile,
    selectVerifiedParameters,
    loadBundle
  });
})(window);
