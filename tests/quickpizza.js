import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://quickpizza.grafana.com';

export const options = {
  vus: 5,
  duration: '10s',
  thresholds: {
    http_req_failed:   ['rate<0.01'],   // < 1% de erros
    http_req_duration: ['p(95)<1000'],  // p95 < 1s
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/`);

  check(res, {
    'status é 200': (r) => r.status === 200,
    'tempo de resposta < 1s': (r) => r.timings.duration < 1000,
  });

  sleep(1);
}
