import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dotenv.config();

async function testPdfImpactFormulas() {
  console.log('--- TESTING PDF AUDITED ENVIRONMENTAL IMPACT FORMULAS ---');

  try {
    const res = await fetch('http://localhost:5000/api/analytics/environmental-impact');
    const data = await res.json();

    console.log('Audit Status:', data.auditStatus);
    console.log('Total Weight Processed:', data.totalWeightProcessedKg, 'kg');
    console.log('Total Avoided CO2e Emissions:', data.totalCo2eAvoidedKg, 'kg (', data.totalCo2eAvoidedTonnes, 'Tonnes )');
    console.log('\n--- AUDITED EQUIVALENCY CALCULATORS (Section 7.2 of PDF) ---');
    console.log('  🌲 Trees Planted Equivalent:', data.treesPlantedEquivalent, 'Trees');
    console.log('     Basis Citation:', data.treesPlantedBasis);
    console.log('  🚗 Passenger Car Miles Avoided:', data.passengerCarMilesAvoided, 'Miles');
    console.log('     Basis Citation:', data.carMilesBasis);
    console.log('  🌱 Compost Yield Output:', data.compostYieldKg, 'kg');
    console.log('     Compost Basis:', data.compostYieldBasis);
    console.log('\n--- MATERIAL TAXONOMY BREAKDOWN TABLE (Section 7.1 of PDF) ---');
    data.breakdown.forEach(b => {
      console.log(`  • ${b.material.padEnd(20)} | PRD Class: ${b.rewardClass.padEnd(30)} | Weight: ${String(b.weightKg).padStart(6)} kg | Factor: ${String(b.factor).padStart(4)} => CO2e Saved: ${b.co2eSavedKg} kg`);
    });
  } catch (err) {
    console.error('Test PDF Impact Error:', err.message);
  }
}

testPdfImpactFormulas();
