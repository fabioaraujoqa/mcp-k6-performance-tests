import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://pokeapi.co';

export const options = {
  vus: 2,
  duration: '30s',
  thresholds: {
    http_req_failed:   ['rate<0.01'],   // < 1% de erros
    http_req_duration: ['p(95)<2000'],  // p95 < 2s (API pública externa)
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/v2/ability/?limit=20&offset=20`, {
    tags: { endpoint: 'ability-list' },
  });

  check(res, {
    'status é 200':       (r) => r.status === 200,
    'tempo < 2000ms':     (r) => r.timings.duration < 2000,
    'tem campo count':    (r) => JSON.parse(r.body).count !== undefined,
    'retornou 20 itens':  (r) => JSON.parse(r.body).results.length === 20,
  });

  sleep(1);
}
