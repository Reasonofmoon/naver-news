exports.handler = async function(event, context) {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Hello from Netlify Function! The time is " + new Date().toISOString() })
    };
  };