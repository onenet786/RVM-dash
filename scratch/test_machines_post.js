async function testPostMachine() {
  try {
    const res = await fetch('http://localhost:5009/api/machines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        machineId: 'RVM-001',
        name: 'ISP Campus Entrance Unit #1',
        location: 'Sector H-8/4, Islamabad'
      })
    });
    console.log('HTTP Status:', res.status);
    const data = await res.json();
    console.log('Response:', data);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testPostMachine();
