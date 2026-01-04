const config = {
  development: {
    apiUrl: 'http://localhost:8000',
  },
  production: {
    apiUrl: 'https://api.propulsion.world', // Replace with your production API URL
  }
};

const mode = import.meta.env.MODE || 'development';
export default config[mode];

