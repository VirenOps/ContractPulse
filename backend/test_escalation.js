import prisma from './src/lib/prisma.js';
import { scheduleAlertJobs } from './src/workers/escalation_worker.js';

async function runSimulationTest() {
  console.log("🚀 Starting Escalation Simulation Test...");

  // 1. Fetch or Mock a test contract record 
  let testContract = await prisma.contract.findFirst();
  
  if (!testContract) {
    console.error("❌ Please insert at least one test contract row into your database first!");
    process.exit(1);
  }

  // 2. Set up a notice deadline that is slightly in the future
  // To simulate 90, 60, and 30 days relative offsets instantly, 
  // we give it a deadline value. For instance, putting a deadline 91 days out 
  // will cause the 90 days out alert (L1) to fire in roughly 1 day, or we tweak scheduleSingleAlert parameter offsets to 0 for instant testing.
  
  // Custom Override Example for Quick Testing:
  // If you temporarily modify scheduleSingleAlert inside your code to subtract minutes instead of days,
  // it fires instantly.
  
  const simulatedDeadline = new Date();
  simulatedDeadline.setDate(simulatedDeadline.getDate() + 91); // Fast paths L1 logic validation

  console.log(`Using Contract ID: ${testContract.id}`);
  console.log(`Simulating Notice Deadline: ${simulatedDeadline.toDateString()}`);

  try {
    // Run the scheduler function
    await scheduleAlertJobs(testContract.id, simulatedDeadline);
    
    console.log("✅ Scheduling loop executed. Check your Redis connection dashboard to see the delayed jobs sitting safely inside BullMQ storage!");
  } catch (error) {
    console.error("❌ Test crashed with error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

runSimulationTest();