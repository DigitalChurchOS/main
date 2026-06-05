import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('Module 32: Volunteer & Workforce Management Module', () => {
  let tenantId: string;
  let adminToken: string;
  let adminUserId: string;
  let volunteerToken: string;
  let volunteerUserId: string;
  let volunteerProfileId: string;
  let volunteer2ProfileId: string;
  let adminProfileId: string;
  let departmentId: string;
  let teamId: string;
  let shiftId: string;
  let overlappingShiftId: string;

  beforeAll(async () => {
    // ── Clean up ─────────────────────────────────────────────
    await prisma.volunteerAnnouncement.deleteMany({});
    await prisma.volunteerAssignment.deleteMany({});
    await prisma.volunteerShift.deleteMany({});
    await prisma.volunteerAvailability.deleteMany({});
    await prisma.volunteerTeamAssignment.deleteMany({});
    await prisma.volunteerTeam.deleteMany({});
    await prisma.volunteerDepartment.deleteMany({});
    await prisma.volunteerProfile.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // ── Tenant ──────────────────────────────────────────────
    const tenant = await prisma.tenant.create({
      data: { name: 'Workforce Church', subdomain: 'workforce-church', status: 'active' },
    });
    tenantId = tenant.id;

    // ── Admin Role + Permissions ────────────────────────────
    const permissions = await prisma.permission.findMany({
      where: { name: { in: ['member.update', 'member.read', 'tenant.settings'] } },
    });
    const adminRole = await prisma.role.create({ data: { tenantId, name: 'Admin', isCustom: false } });
    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
    });

    // ── Admin User ──────────────────────────────────────────
    const passHash = await bcrypt.hash('password123', 12);
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'admin@workforce.com', passwordHash: passHash },
    });
    adminUserId = adminUser.id;
    await prisma.userRole.create({ data: { userId: adminUser.id, roleId: adminRole.id } });
    adminToken = jwt.sign({ userId: adminUser.id, tenantId, email: adminUser.email }, JWT_SECRET);

    // ── Volunteer User ──────────────────────────────────────
    const volunteerUser = await prisma.user.create({
      data: { tenantId, email: 'volunteer@workforce.com', passwordHash: passHash },
    });
    volunteerUserId = volunteerUser.id;
    volunteerToken = jwt.sign({ userId: volunteerUser.id, tenantId, email: volunteerUser.email }, JWT_SECRET);

    // ── Member Profiles ─────────────────────────────────────
    const adminMember = await prisma.member.create({
      data: { tenantId, firstName: 'Alistair', lastName: 'Cook', email: 'admin@workforce.com', userId: adminUser.id },
    });

    const volunteerMember = await prisma.member.create({
      data: { tenantId, firstName: 'David', lastName: 'Miller', email: 'volunteer@workforce.com', userId: volunteerUser.id },
    });

    const volunteer2Member = await prisma.member.create({
      data: { tenantId, firstName: 'Susan', lastName: 'Boyle', email: 'susan@workforce.com' },
    });

    // ── Volunteer Profiles Setup ────────────────────────────
    const vAdminProfile = await prisma.volunteerProfile.create({
      data: { tenantId, memberId: adminMember.id, skills: 'Coordination, Audio', status: 'active', trainingStatus: 'certified' },
    });
    adminProfileId = vAdminProfile.id;

    const v1Profile = await prisma.volunteerProfile.create({
      data: { tenantId, memberId: volunteerMember.id, skills: 'Guitar, Vocals', status: 'active', trainingStatus: 'certified' },
    });
    volunteerProfileId = v1Profile.id;

    const v2Profile = await prisma.volunteerProfile.create({
      data: { tenantId, memberId: volunteer2Member.id, skills: 'Drums', status: 'active', trainingStatus: 'in_training' },
    });
    volunteer2ProfileId = v2Profile.id;
  });

  describe('Departments & Teams Management', () => {
    it('should allow admin to create a volunteer department', async () => {
      const res = await request(app)
        .post('/api/volunteer/departments')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Worship Media',
          description: 'Responsible for Sunday sound, lyrics projection, and camera operation',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.name).toBe('Worship Media');
      departmentId = res.body.data.id;
    });

    it('should allow admin to create a volunteer team inside the department', async () => {
      const res = await request(app)
        .post('/api/volunteer/teams')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          departmentId,
          name: 'Sound Crew',
          description: 'Audio board operators',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.name).toBe('Sound Crew');
      teamId = res.body.data.id;
    });

    it('should assign a volunteer profile to a team', async () => {
      const res = await request(app)
        .post(`/api/volunteer/teams/${teamId}/members`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          profileId: volunteerProfileId,
          role: 'Sound Engineer',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.profileId).toBe(volunteerProfileId);
      expect(res.body.data.teamId).toBe(teamId);
      expect(res.body.data.role).toBe('Sound Engineer');
    });

    it('should assign another volunteer to the team as team leader', async () => {
      const res = await request(app)
        .post(`/api/volunteer/teams/${teamId}/members`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          profileId: volunteer2ProfileId,
          role: 'team_leader',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.role).toBe('team_leader');
    });
  });

  describe('Volunteer Availability & Calendar Blockouts', () => {
    const blockDate = new Date();
    blockDate.setDate(blockDate.getDate() + 5); // 5 days from now
    blockDate.setHours(0, 0, 0, 0);

    it('should allow a volunteer to block out a date', async () => {
      const res = await request(app)
        .post('/api/volunteer/availability')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${volunteerToken}`)
        .send({
          profileId: volunteerProfileId,
          date: blockDate.toISOString(),
          reason: 'Family trip',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.profileId).toBe(volunteerProfileId);
      expect(new Date(res.body.data.blockedDate).getTime()).toBe(blockDate.getTime());
    });

    it('should block a volunteer from editing someone else\'s availability blockout', async () => {
      const res = await request(app)
        .post('/api/volunteer/availability')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${volunteerToken}`)
        .send({
          profileId: volunteer2ProfileId, // susan
          date: blockDate.toISOString(),
          reason: 'Hack attempt',
        });

      expect(res.status).toBe(403);
    });

    it('should allow staff/admins with member.update to block out dates for any volunteer', async () => {
      const res = await request(app)
        .post('/api/volunteer/availability')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          profileId: volunteer2ProfileId,
          date: blockDate.toISOString(),
          reason: 'Sick leave',
        });

      expect(res.status).toBe(201);
    });
  });

  describe('Shift Scheduling & Double-Booking Guards', () => {
    let tomorrow: Date;
    let blockedDay: Date;

    beforeAll(() => {
      tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      blockedDay = new Date();
      blockedDay.setDate(blockedDay.getDate() + 5);
    });

    it('should allow admin to create a shift linked to a service', async () => {
      const startTime = new Date(tomorrow);
      startTime.setHours(9, 0, 0, 0);
      const endTime = new Date(tomorrow);
      endTime.setHours(12, 0, 0, 0);

      const res = await request(app)
        .post('/api/volunteer/shifts')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Sunday Morning Audio',
          targetType: 'service',
          targetId: 'srv-sunday-9am',
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Sunday Morning Audio');
      shiftId = res.body.data.id;
    });

    it('should reject shift creation if startTime is after or equal to endTime', async () => {
      const startTime = new Date(tomorrow);
      startTime.setHours(14, 0, 0, 0);
      const endTime = new Date(tomorrow);
      endTime.setHours(13, 0, 0, 0); // ends before start

      const res = await request(app)
        .post('/api/volunteer/shifts')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Invalid Time Shift',
          targetType: 'service',
          targetId: 'srv-1',
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        });

      expect(res.status).toBe(400);
    });

    it('should assign volunteer to the created shift', async () => {
      const res = await request(app)
        .post(`/api/volunteer/shifts/${shiftId}/assignments`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          profileId: volunteerProfileId,
          teamId,
          role: 'FOH Mixer',
          tasks: ['Turn on console', 'Sound check guitars'],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.profileId).toBe(volunteerProfileId);
      expect(res.body.data.status).toBe('scheduled');
      expect(JSON.parse(res.body.data.taskList)).toContain('Turn on console');
    });

    it('should block scheduling a volunteer on dates they have blocked out', async () => {
      // 1. Create a shift on the blocked out day
      const blockStartTime = new Date(blockedDay);
      blockStartTime.setHours(10, 0, 0, 0);
      const blockEndTime = new Date(blockedDay);
      blockEndTime.setHours(12, 0, 0, 0);

      const shiftRes = await request(app)
        .post('/api/volunteer/shifts')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Shift on Blockout Day',
          targetType: 'service',
          targetId: 'srv-block',
          startTime: blockStartTime.toISOString(),
          endTime: blockEndTime.toISOString(),
        });

      const blockedShiftId = shiftRes.body.data.id;

      // 2. Attempt to assign the blocked volunteer
      const res = await request(app)
        .post(`/api/volunteer/shifts/${blockedShiftId}/assignments`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          profileId: volunteerProfileId,
          teamId,
          role: 'Aux Mixer',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('unavailable');
    });

    it('should block scheduling a volunteer to an overlapping shift', async () => {
      // 1. Create an overlapping shift tomorrow (e.g. 10 AM to 1 PM, overlapping with 9-12 AM)
      const overlapStart = new Date(tomorrow);
      overlapStart.setHours(10, 0, 0, 0);
      const overlapEnd = new Date(tomorrow);
      overlapEnd.setHours(13, 0, 0, 0);

      const shiftRes = await request(app)
        .post('/api/volunteer/shifts')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Overlapping Audio Shift',
          targetType: 'service',
          targetId: 'srv-sunday-9am-overlapping',
          startTime: overlapStart.toISOString(),
          endTime: overlapEnd.toISOString(),
        });

      overlappingShiftId = shiftRes.body.data.id;

      // 2. Attempt to assign same volunteer
      const res = await request(app)
        .post(`/api/volunteer/shifts/${overlappingShiftId}/assignments`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          profileId: volunteerProfileId,
          teamId,
          role: 'Stage Hand',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('overlapping');
    });
  });

  describe('Shift Response & Check-in Tracking', () => {
    it('should allow volunteer to confirm their assigned shift', async () => {
      const res = await request(app)
        .patch(`/api/volunteer/shifts/${shiftId}/assignments/${volunteerProfileId}/respond`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${volunteerToken}`)
        .send({
          status: 'confirmed',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('confirmed');
    });

    it('should block volunteers from responding to shifts that are not theirs', async () => {
      const res = await request(app)
        .patch(`/api/volunteer/shifts/${shiftId}/assignments/${volunteer2ProfileId}/respond`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${volunteerToken}`)
        .send({
          status: 'confirmed',
        });

      expect(res.status).toBe(403);
    });

    it('should allow volunteer to decline a shift, triggering status update', async () => {
      const res = await request(app)
        .patch(`/api/volunteer/shifts/${shiftId}/assignments/${volunteerProfileId}/respond`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${volunteerToken}`)
        .send({
          status: 'declined',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('declined');
    });

    it('should allow admin to check in a volunteer who arrived for their shift', async () => {
      // First confirm it back so we can check in
      await prisma.volunteerAssignment.updateMany({
        where: { profileId: volunteerProfileId, shiftId },
        data: { status: 'confirmed' },
      });

      const res = await request(app)
        .post(`/api/volunteer/shifts/${shiftId}/assignments/${volunteerProfileId}/checkin`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('checked_in');
      expect(res.body.data.checkedInAt).toBeDefined();
    });

    it('should mark remaining un-checked-in scheduled volunteers as no_show on post-shift sweep', async () => {
      // 1. Assign volunteer2 (Susan) to the same shift
      await prisma.volunteerAssignment.create({
        data: {
          tenantId,
          profileId: volunteer2ProfileId,
          shiftId,
          teamId,
          role: 'Camera Operator',
          status: 'confirmed',
        },
      });

      // 2. Perform post-shift sweep for no-shows
      const res = await request(app)
        .post(`/api/volunteer/shifts/${shiftId}/noshows`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      // Verify volunteer2 is marked as no_show
      const v2Assign = await prisma.volunteerAssignment.findFirst({
        where: { profileId: volunteer2ProfileId, shiftId },
      });
      expect(v2Assign!.status).toBe('no_show');
      expect(v2Assign!.checkedInAt).toBeNull();

      // Verify volunteer1 remains checked_in
      const v1Assign = await prisma.volunteerAssignment.findFirst({
        where: { profileId: volunteerProfileId, shiftId },
      });
      expect(v1Assign!.status).toBe('checked_in');
    });
  });

  describe('Team Announcements & Broadcasts', () => {
    it('should allow admin to broadcast a message to the Sound Crew team', async () => {
      const res = await request(app)
        .post('/api/volunteer/announcements')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          teamId,
          title: 'Sunday Rig Tuning',
          content: 'Hey Sound Crew, please arrive 15 mins early to tune the room.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Sunday Rig Tuning');
      expect(res.body.data.recipientsCount).toBe(2); // Robert and Susan are in team
    });
  });

  describe('Workforce Analytics & Reports', () => {
    it('should return serving statistics and department health alerts', async () => {
      const res = await request(app)
        .get('/api/volunteer/reports')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.leaderboard).toHaveLength(1); // David completed his shift
      expect(res.body.data.leaderboard[0].hoursServed).toBe(3); // 9 AM to 12 PM = 3 hours
      expect(res.body.data.leaderboard[0].shiftsCompleted).toBe(1);

      // Worship Media has 2 active volunteers so it shouldn't flag recruitment.
      // But if there's any other department with <2, it will flag.
      expect(res.body.data.recruitmentRequired).toBeDefined();
    });
  });
});
