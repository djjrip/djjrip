const axios = require('axios');

async function fetchData() {
    const res = await axios.get('https://api.github.com');
    console.log(res.data);
}

fetchData();
