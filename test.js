const https = require('https');
https.get('https://cdnjs.cloudflare.com/ajax/libs/three.js/r136/three.min.js', (res) => {
    console.log(res.statusCode);
});
