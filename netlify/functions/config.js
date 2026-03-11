// netlify/functions/config.js
exports.handler = async function() {
  // Configurar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Si es preflight OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      url: process.env.SUPABASE_URL || 'https://swsrywvjskhshlbtbzrx.supabase.co',
      anonKey: process.env.SUPABASE_ANON_KEY
    })
  };
};