import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://groffe-apicontagem.agreeableisland-3e473a9d.brazilsouth.azurecontainerapps.io/contador';

export const options = {
  stages: [
    { duration: '15s', target: 10 },  // sobe para 10 VUs
    { duration: '30s', target: 10 },  // mantém 10 VUs por 30s
    { duration: '15s', target: 0  },  // desce para 0
  ],
  thresholds: {
    http_req_failed:   ['rate<0.01'],   // < 1% de erros
    http_req_duration: ['p(95)<2000'],  // p95 < 2s
  },
};

export default function () {
  const res = http.get(BASE_URL, {
    tags: { endpoint: 'contador' },
  });

  // Loga status code das falhas para diagnóstico
  if (res.status !== 200) {
    console.log(`[FALHA] status=${res.status} body=${res.body?.slice(0, 200)}`);
  }

  check(res, {
    'status é 200':    (r) => r.status === 200,
    'status não 429':  (r) => r.status !== 429,  // rate limit
    'status não 503':  (r) => r.status !== 503,  // indisponível
    'tempo < 2000ms':  (r) => r.timings.duration < 2000,
    'body não vazio':  (r) => r.body && r.body.length > 0,
  });

  sleep(1);
}
