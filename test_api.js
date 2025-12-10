const http = require('http');

function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: body }));
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function runTests() {
    console.log('--- STARTING API TESTS ---');

    // 1. GET PACKAGES
    console.log('\n[TEST 1] GET /api/packages');
    try {
        const res = await request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/packages',
            method: 'GET'
        });
        console.log('Status:', res.status);
        console.log('Data:', res.body.substring(0, 100) + '...');
    } catch (e) { console.error('Failed:', e.message); }

    // 2. POST PACKAGE
    console.log('\n[TEST 2] POST /api/packages');
    let newId = null;
    try {
        const data = JSON.stringify({
            name: "TEST_PKG_" + Date.now(),
            price: 123456,
            speed: "100 Mbps",
            features: "Test Only",
            period: "/bulan"
        });
        const res = await request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/packages',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        }, data);
        console.log('Status:', res.status);
        console.log('Response:', res.body);
        const json = JSON.parse(res.body);
        newId = json.id;
    } catch (e) { console.error('Failed:', e.message); }

    // 3. DELETE PACKAGE
    if (newId) {
        console.log(`\n[TEST 3] DELETE /api/packages/${newId}`);
        try {
            const res = await request({
                hostname: 'localhost',
                port: 3000,
                path: `/api/packages/${newId}`,
                method: 'DELETE'
            });
            console.log('Status:', res.status);
            console.log('Response:', res.body);
        } catch (e) { console.error('Failed:', e.message); }
    } else {
        console.log('\n[SKIP] Test 3 (Delete) skipped because Create failed.');
    }

    // 4. GET COMPLAINTS
    console.log('\n[TEST 4] GET /api/complaints');
    try {
        const res = await request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/complaints',
            method: 'GET'
        });
        console.log('Status:', res.status);
        console.log('Data:', res.body);
    } catch (e) { console.error('Failed:', e.message); }

    console.log('\n--- TESTS COMPLETED ---');
}

runTests();
