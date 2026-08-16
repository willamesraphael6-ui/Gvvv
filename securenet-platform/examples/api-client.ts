const API_URL = process.env.API_URL || 'https://api.securenet.com';
const API_KEY = process.env.API_KEY || 'GERADA_PELO_SISTEMA';

async function getStatus(): Promise<any> {
  const response = await fetch(`${API_URL}/api/v1/status`, {
    headers: { 'X-API-Key': API_KEY },
  });

  return response.json();
}

getStatus().then((data) => console.log('Status da API:', data));
