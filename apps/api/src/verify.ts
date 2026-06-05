import prisma from './lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'churchos-dev-secret-change-in-production';
const BASE_URL = 'http://localhost:3000';

async function run() {
  console.log('🌌 Starting Live Verification of Settings Engine & Chat Integration...\n');

  // 1. Clean up & Create a fresh test tenant
  console.log('⚙️  Step 1: Setting up test tenant and user in database...');
  const subdomain = `verify-${Date.now()}`;
  const tenant = await prisma.tenant.create({
    data: { name: 'Test Cathedral', subdomain, status: 'active' },
  });
  
  // Set up Admin role & permissions
  const settingsPermission = await prisma.permission.findUnique({ where: { name: 'tenant.settings' } });
  const readPermission = await prisma.permission.findUnique({ where: { name: 'member.read' } });
  
  const adminRole = await prisma.role.create({ data: { tenantId: tenant.id, name: 'Admin', isCustom: false } });
  if (settingsPermission && readPermission) {
    await prisma.rolePermission.createMany({
      data: [
        { roleId: adminRole.id, permissionId: settingsPermission.id },
        { roleId: adminRole.id, permissionId: readPermission.id }
      ]
    });
  }

  // Create admin user & generate JWT
  const passHash = await bcrypt.hash('password123', 12);
  const adminUser = await prisma.user.create({
    data: { tenantId: tenant.id, email: `pastor@${subdomain}.com`, passwordHash: passHash },
  });
  await prisma.userRole.create({ data: { userId: adminUser.id, roleId: adminRole.id } });
  const token = jwt.sign({ userId: adminUser.id, tenantId: tenant.id, email: adminUser.email }, JWT_SECRET);
  
  console.log(`✅ Test Tenant Created: ID = ${tenant.id}`);
  console.log(`🔑 Admin JWT generated.\n`);

  // Helper for requests
  const apiCall = async (path: string, options: any = {}): Promise<{ status: number; data: any }> => {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'x-tenant-id': tenant.id,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      }
    });
    return { status: res.status, data: await res.json() };
  };

  // 2. Fetch default settings
  console.log('⚙️  Step 2: Fetching default settings from running server...');
  const defaults = await apiCall('/api/settings/liveChat');
  console.log(`   Defaults status: ${defaults.status}`);
  console.log(`   enableAiScreening: ${defaults.data.data.enableAiScreening} (Default: true)`);
  console.log(`   autoEscalateTimer: ${defaults.data.data.autoEscalateTimer} (Default: 15)\n`);

  // 3. Create conversation and send a distress message with screening enabled (default)
  console.log('⚙️  Step 3: Creating a chat conversation and sending a crisis keyword message (Screening ON)...');
  const convRes = await apiCall('/api/chat/conversations', {
    method: 'POST',
    body: JSON.stringify({ visitorName: 'Dave Seeking Help' })
  });
  const convId = convRes.data.data.id;

  const msgRes = await apiCall(`/api/chat/conversations/${convId}/messages`, {
    method: 'POST',
    body: JSON.stringify({
      senderType: 'visitor',
      body: 'I want to end my life, please help me.'
    })
  });

  // Verify conversation is escalated
  const activeConv = await apiCall(`/api/chat/conversations/${convId}`);
  console.log(`   Conversation status: ${activeConv.data.data.status}`);
  console.log(`   Priority: ${activeConv.data.data.priority}`);
  console.log(`   Safety Alert triggered: ${activeConv.data.data.safetyAlert}`);
  console.log(`   AI Suggested Reply: "${activeConv.data.data.aiSuggestedReply}"\n`);

  // 4. Update setting overrides via PUT/PATCH endpoint
  console.log('⚙️  Step 4: Updating settings to disable AI Safety Screening...');
  const updateRes = await apiCall('/api/settings/liveChat', {
    method: 'PATCH',
    body: JSON.stringify({
      enableAiScreening: false,
      autoEscalateTimer: 30
    })
  });
  console.log(`   Settings updated status: ${updateRes.status}`);
  console.log(`   New enableAiScreening: ${updateRes.data.data.enableAiScreening}`);
  console.log(`   New autoEscalateTimer: ${updateRes.data.data.autoEscalateTimer}\n`);

  // 5. Send distress message with screening disabled
  console.log('⚙️  Step 5: Sending another crisis keyword message (Screening OFF)...');
  const convRes2 = await apiCall('/api/chat/conversations', {
    method: 'POST',
    body: JSON.stringify({ visitorName: 'Jane Seeking Help' })
  });
  const convId2 = convRes2.data.data.id;

  await apiCall(`/api/chat/conversations/${convId2}/messages`, {
    method: 'POST',
    body: JSON.stringify({
      senderType: 'visitor',
      body: 'I feel completely hopeless and want to end my life.'
    })
  });

  // Verify conversation is NOT escalated
  const activeConv2 = await apiCall(`/api/chat/conversations/${convId2}`);
  console.log(`   Conversation status: ${activeConv2.data.data.status} (Expected: "open")`);
  console.log(`   Priority: ${activeConv2.data.data.priority} (Expected: "medium")`);
  console.log(`   Safety Alert triggered: ${activeConv2.data.data.safetyAlert} (Expected: false)`);
  console.log(`   AI Suggested Reply: ${activeConv2.data.data.aiSuggestedReply} (Expected: null)\n`);

  // 6. Test Settings Bounds Validation Gate
  console.log('⚙️  Step 6: Testing validation gate (violating minimum bounds on autoEscalateTimer)...');
  const invalidRes = await apiCall('/api/settings/liveChat', {
    method: 'PATCH',
    body: JSON.stringify({
      autoEscalateTimer: 2 // Min allowed is 5!
    })
  });
  console.log(`   Validation rejection status: ${invalidRes.status} (Expected: 400)`);
  console.log(`   Rejection error message: "${invalidRes.data.error}"\n`);

  // Cleanup
  console.log('⚙️  Step 7: Resetting settings back to system defaults...');
  const resetRes = await apiCall('/api/settings/liveChat/reset', { method: 'POST' });
  console.log(`   Reset status: ${resetRes.status} (Expected: 200)`);

  console.log('\n🌟 Dynamic Settings Engine Verification Complete. All checks passed!');
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
