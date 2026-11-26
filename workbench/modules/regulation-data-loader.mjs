const isoDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
const isInPeriod = (record, date) => isoDate(date) && isoDate(record.effective_from) && record.effective_from <= date && (!record.effective_to || (isoDate(record.effective_to) && date <= record.effective_to));

export function selectVerifiedParameters(dataset, { date, jurisdiction } = {}) {
  if (!dataset || dataset.status !== 'verified' || dataset.application_policy?.auto_apply !== true) return [];
  if (!isoDate(date)) throw new TypeError('A valid calculation date (YYYY-MM-DD) is required.');
  return (dataset.official_parameters ?? []).filter(parameter => parameter.status === 'verified' && parameter.verified_by && parameter.source?.url && parameter.source?.provision && parameter.source?.agency && isInPeriod(parameter, date) && (!jurisdiction || parameter.jurisdiction === jurisdiction));
}

export function separateInputs(dataset) {
  return { official: dataset?.status === 'verified' && dataset?.application_policy?.auto_apply === true ? (dataset.official_parameters ?? []).filter(p => p.status === 'verified') : [], assumptions: Array.isArray(dataset?.user_assumptions) ? dataset.user_assumptions : [], blockedCount: Array.isArray(dataset?.official_parameters) ? dataset.official_parameters.filter(p => p.status !== 'verified').length : 0 };
}

export async function loadCityDataset(code, { fetchImpl = globalThis.fetch, baseUrl = './regulations/' } = {}) {
  if (typeof fetchImpl !== 'function') throw new TypeError('fetch is unavailable');
  if (!/^\d{2}$/.test(String(code))) throw new TypeError('City code must be a two-digit string.');
  const manifestResponse = await fetchImpl(baseUrl + 'manifest.json');
  if (!manifestResponse.ok) throw new Error('Unable to load regulatory manifest.');
  const manifest = await manifestResponse.json();
  const entry = manifest.county_city_files?.find(item => item.code === String(code));
  if (!entry) throw new Error('Unknown county/city code: ' + code);
  const response = await fetchImpl(baseUrl + entry.path);
  if (!response.ok) throw new Error('Unable to load county/city dataset: ' + code);
  return response.json();
}
