import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://www.google.com';
const QUERY    = __ENV.QUERY    || 'k6 grafana performance testing';

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_failed:   ['rate<0.05'],   // < 5% erros (tolerância para site externo)
    http_req_duration: ['p(95)<3000'],  // p95 < 3s
  },
};

export default function () {
  const params = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; k6-smoke-test/1.0)',
    },
    timeout: '10s',
    tags: { name: 'google_search' },
  };

  const res = http.get(`${BASE_URL}/search?q=${encodeURIComponent(QUERY)}`, params);

  check(res, {
    'status é 200':           (r) => r.status === 200,
    'tempo de resposta < 3s': (r) => r.timings.duration < 3000,
    'resposta não vazia':     (r) => r.body !== null && r.body.length > 0,
  });

  sleep(1);
}
