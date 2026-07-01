import { Queue, Worker } from 'bullmq';
import { connection } from '../lib/queue.js';
import prisma from '../lib/prisma.js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Define the name of the queue
export const ESCALATION_QUEUE_NAME = 'escalation-queue';

// Export the queue instance so it can be used to add jobs
export const escalationQueue = new Queue(ESCALATION_QUEUE_NAME, { connection });

/**
 * Helper to schedule a delayed escalation job
 */
async function scheduleSingleAlert(contractId, deadlineDate, daysBefore, tier) {
  const targetDate = new Date(deadlineDate.getTime());
  targetDate.setDate(targetDate.getDate() - daysBefore);

  const now = new Date();
  let delay = targetDate.getTime() - now.getTime();

  // only for testing remove before actual use
  const TEST_MODE = true
  if (TEST_MODE) {
    const testDelays = { L1: 10000, L2: 20000, L3: 30000 } // fires at 10s, 20s, 30s
    delay = testDelays[tier]
  }

  // If the calculated timeline is already in the past, skip scheduling it
  if (delay <= 0) {
    console.log(`[Escalation] Tier ${tier} date (${targetDate.toDateString()}) is in the past. Skipping.`);
    return null;
  }

  const jobId = `contract-${contractId}-escalation-${tier}`;
  
  return await escalationQueue.add(
    tier, // Using the tier (L1, L2, L3) as the job name
    { contractId, tier, daysBefore, deadline: deadlineDate.toISOString() },
    { delay, jobId, removeOnComplete: true }
  );
}

/**
 * 1. Schedule Alert Jobs
 * Schedules 3 delayed jobs into the escalation queue: L1 (90 days), L2 (60 days), L3 (30 days)
 */
export async function scheduleAlertJobs(contractId, noticeDeadline) {
  const deadlineDate = new Date(noticeDeadline);
  console.log(`[Escalation] Scheduling alerts for Contract ${contractId} matching deadline: ${deadlineDate.toDateString()}`);

  await scheduleSingleAlert(contractId, deadlineDate, 90, 'L1');
  await scheduleSingleAlert(contractId, deadlineDate, 60, 'L2');
  await scheduleSingleAlert(contractId, deadlineDate, 30, 'L3');
}

/**
 * 2. The Background Worker
 * Processes L1, L2, and L3 escalation notifications dynamically
 */
const escalationWorker = new Worker(ESCALATION_QUEUE_NAME, async (job) => {
  const { contractId, tier, deadline } = job.data;
  console.log(`[Worker] Running ${tier} escalation check for contract ${contractId}`);

  // Fetch contract details
  const contract = await prisma.contract.findUnique({
    where: { id: contractId }
  });

  if (!contract) {
    console.log(`[Worker] Contract ${contractId} no longer exists. Skipping.`);
    return;
  }

  // CRITICAL CHECK: If renewalDecision already exists, abort early! No further alerts needed.
  if (contract.renewalDecision) {
    console.log(`[Worker] Contract ${contractId} already has a decision (${contract.renewalDecision}). Aborting escalation.`);
    return;
  }

  // Find the right users to email based on job/tier name
  let rolesToTarget = [];
  if (tier === 'L1') rolesToTarget = ['MANAGER'];
  if (tier === 'L2') rolesToTarget = ['MANAGER', 'DEPT_HEAD'];
  if (tier === 'L3') rolesToTarget = ['MANAGER', 'DEPT_HEAD', 'ADMIN']; // 'everyone' layout

  const usersToEmail = await prisma.user.findMany({
    where: {
      companyId: contract.companyId,
      role: { in: rolesToTarget }
    },
    select: { email: true }
  });

  const recipientEmails = usersToEmail.map(u => u.email);

  if (recipientEmails.length === 0) {
    console.warn(`[Worker] No users found matching roles ${rolesToTarget.join(', ')} for company ${contract.companyId}`);
    return;
  }

  // Construct Tier Specific Content
  const subjectMap = {
    L1: `⚠️ [90-Day Warning] Contract Action Needed: ${contract.file_name}`,
    L2: `🔥 [60-Day Escalation] URGENT Action Required: ${contract.file_name}`,
    L3: `🚨 [30-Day Critical] FINAL NOTICE: ${contract.file_name} Approaching Renewal`
  };

  // Send the email via Resend
  await resend.emails.send({
    from: 'Contract Management <onboarding@resend.dev>',
    to: recipientEmails,
    subject: subjectMap[tier] || `Contract Alert: ${contract.file_name}`,
    html: `
      <h2>Escalation Alert Level: ${tier}</h2>
      <p>The contract <strong>${contract.file_name}</strong> is fast approaching its action notice deadline on <strong>${new Date(deadline).toLocaleDateString()}</strong>.</p>
      <p>Current Escalation Alert Level: <strong>${tier}</strong></p>
      <p>No renewal decision has been registered yet. Please click below to update the status immediately.</p>
      <p><a href="${process.env.FRONTEND_URL}/contracts/${contractId}">Open Contract View</a></p>
    `
  });

  // Update alertState on the contract
  await prisma.contract.update({
    where: { id: contractId },
    data: { alertState: tier }
  });

  // Write to audit log
  await prisma.auditLog.create({
    data: {
      contractId,
      eventType: `escalation_${tier.toLowerCase()}_sent`,
      metadata: { recipients: recipientEmails, deadline }
    }
  });

  console.log(`[Worker] Successfully executed ${tier} escalation workflow.`);

}, { connection });

export default escalationWorker;








// // Here is the clean, step-by-step breakdown of your escalation worker process with the code blocks removed for easy reading:

// High-Level Overview
// This system handles two core responsibilities:

// It provides a function to schedule future warning tickets into Redis (scheduleAlertJobs).

// It sets up a background processor (escalationWorker) that wakes up when those tickets mature to alert the right corporate tiers if a contract is being ignored.

// 1. Setup and Dependencies
// What it does: Imports BullMQ for queue management, Prisma for database access, and Resend for emails.

// Why it matters: It initializes the escalationQueue. This acts as the programmatic connection point to Redis where your timeline tickets will sleep until they are ready to fire.

// 2. The Internal Delay Calculator
// The Math: This helper takes your contract's noticeDeadline and subtracts the milestone window (e.g., subtracting 90 days). It then subtracts the current timestamp (now) from that milestone date to calculate exactly how many milliseconds into the future the job must wait.

// The Safety Check: If a user uploads an older contract where the 90-day window has already passed, the delay will be negative. The script safely catches this and logs a skip message instead of crashing or firing a historical alert instantly.

// 3. Dropping the Token into Redis
// jobId Enforcer: It builds a structured identifier (e.g., contract-123-escalation-L1). Because BullMQ ignores duplicate job IDs, this completely prevents the system from accidentally scheduling multiple identical alerts for the same contract.

// The Payload & Options: It pushes the job into Redis with a delay parameter. It also passes removeOnComplete: true so that your Redis database cleans up after itself once the email goes out, preventing RAM clutter.

// 4. Group Scheduling Pipeline
// What it does: This is the entry-point function you call when a contract is uploaded or updated. It passes the deadline down the line to schedule all three distinct escalation windows (L1, L2, L3) simultaneously.

// 5. The Active Worker & The Short-Circuit Switch
// The Wake-Up Call: When a delay timer runs down to zero, this worker wakes up and pulls the job variables (contractId, tier).

// The Core Business Rule: This is the smartest part of the system. If an alert matures 60 days from now, but a manager already went into the dashboard and signed or terminated the contract 3 weeks ago, contract.renewalDecision will contain a value. The worker spots this decision and exits immediately (return), successfully silencing unnecessary alarms.

// 6. Role Escalation Matrix
// What it does: It dynamically assigns the target audience based on the threat level.

// At L1 (90 days), it targets the immediate Manager.

// At L2 (60 days), it expands to loop in the Department Head.

// At L3 (30 days), it triggers an all-hands notice including the system Admin.

// Data Fetching: It then runs a multi-tenant Prisma lookup to gather the email strings of those specific employees belonging to that contract's parent company.

// 7. Dispatching Alerts & Documenting State
// Dispatch: Matches the alert tier to a subject line urgency level and sends a broadcast via Resend to the calculated group array.

// State Syncing: Saves the current alertState directly into the database so the frontend can display exactly what notification tier the contract is in.

// Audit Tracking: Concludes by logging an immutable event into auditLog, documenting exactly who received the communication and when.









// The short answer is: The worker doesn’t actually check the clock. Redis handles the timing, and BullMQ orchestrates the delivery.

// Instead of your worker constantly running loop checks or guessing if the time is right, it relies entirely on a Redis feature called a sorted set.

// Here is exactly how that relationship works behind the scenes.

// 1. The Timeline: Redis Sorted Sets
// When you call escalationQueue.add(..., { delay: 50000 }), BullMQ takes the exact millisecond time the job should run (Current Time + Delay) and saves it as a Score inside a Redis structure called a Sorted Set.

// Think of this sorted set as a physical timeline queue where jobs are arranged chronologically from earliest to latest.

// [Redis "Delayed" Set]
// ┌───────────────────────────┬───────────────────────────┬───────────────────────────┐
// │ Job: L1 Escalation        │ Job: L2 Escalation        │ Job: L3 Escalation        │
// │ Score (Timestamp): 10:00  │ Score (Timestamp): 11:00  │ Score (Timestamp): 12:00  │
// └───────────────────────────┴───────────────────────────┴───────────────────────────┘
// 2. The Internal Timer Loop (The Orchestrator)
// BullMQ runs a minor background optimization loop inside Redis.

// Every few hundred milliseconds, it executes a highly optimized command (ZRANGEBYSCORE) that looks at the top of the sorted set and asks:

// "Are there any jobs here whose execution timestamp is less than or equal to the current system clock right now?"

// If No: It does absolutely nothing and sleeps for another split second. No CPU power is wasted on your server.

// If Yes: Redis atomically pops that job out of the "Delayed" timeline state and pushes it into the "Wait" (Active) queue.

// 3. The Worker Connection
// Your escalationWorker is connected to Redis via a persistent, open connection (using Redis BRPOPLPUSH commands).

// The worker code sits in an idle state, essentially listening for the "Wait/Active" queue to have a valid item inside it.

// [Redis Delayed Set] 
//        │ (Clock hits 10:00)
//        ▼
// [Redis Active Queue] ───(Pushed instantly)───> [Your Worker] 
//                                                Wakes up and runs:
//                                                async (job) => { ... }
// The moment Redis moves a job into the active track because its timestamp matured, the message travels down the socket pipe to your Node.js worker. Your worker instantly wakes up, fires your async (job) => { ... } block, handles the DB lookups, sends the email, and returns to sleep.

// Why this matters technically:
// Because the timer state tracking happens purely inside Redis's incredibly fast C++ engine, your Node.js application process uses 0% CPU to maintain millions of concurrent contract deadlines. Your workers only compile and consume server resources the exact millisecond an action is required.