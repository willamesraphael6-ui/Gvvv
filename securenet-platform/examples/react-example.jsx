import React, { useEffect, useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'https://api.securenet.com';
const API_KEY = process.env.REACT_APP_API_KEY || 'GERADA_PELO_SISTEMA';

export function SecureNetStatus() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/status`, {
      headers: { 'X-API-Key': API_KEY }
    })
      .then((res) => res.json())
      .then(setStatus)
      .catch(console.error);
  }, []);

  return (
    <div>
      <h3>SecureNet status</h3>
      {status ? <pre>{JSON.stringify(status, null, 2)}</pre> : <p>Carregando...</p>}
    </div>
  );
}
