import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('Module 38: Cell / Fellowship Module', () => {
  let tenantId: string;
  
  // Tokens
  let adminToken: string;
  let pastorUserId: string;
  let pastorMemberId: string;
  
  let candidateToken: string;
  let candidateUserId: string;
  let candidateMemberId: string;
  
  let regularToken: string;
  let regularUserId: string;
  let regularMemberId: string;

  // IDs of generated entities
  let masterTypeId: string;
  let superTypeId: string;
  let cellTypeId: string;

  let masterGroupId: string;
  let superGroupId: string;
  let cellGroupId: string;

  let lmsCourseId: string;
  let meetingId: string;
  let inviteToken: string;

  beforeAll(async () => {
    // ── Clean up related tables in correct order ──────────────────────────────
    await prisma.groupPromotion.deleteMany({});
    await prisma.groupNoticePost.deleteMany({});
    await prisma.groupNoticeBoard.deleteMany({});
    await prisma.groupInviteConversion.deleteMany({});
    await prisma.groupInviteLink.deleteMany({});
    await prisma.groupAttendance.deleteMany({});
    await prisma.groupMeeting.deleteMany({});
    await prisma.groupMember.deleteMany({});
    await prisma.group.deleteMany({});
    await prisma.groupType.deleteMany({});
    await prisma.groupSettings.deleteMany({});

    await prisma.donation.deleteMany({});
    await prisma.partnership.deleteMany({});
    await prisma.lmsLessonProgress.deleteMany({});
    await prisma.lmsQuizAnswer.deleteMany({});
    await prisma.lmsAssignmentSubmission.deleteMany({});
    await prisma.lmsEnrollment.deleteMany({});
    await prisma.lmsAssignment.deleteMany({});
    await prisma.lmsQuiz.deleteMany({});
    await prisma.lmsLesson.deleteMany({});
    await prisma.lmsModule.deleteMany({});
    await prisma.lmsCourse.deleteMany({});

    await prisma.member.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // ── Tenant ──────────────────────────────────────────────
    const tenant = await prisma.tenant.create({
      data: { name: 'Dunamis Church', subdomain: 'dunamis-church', status: 'active' },
    });
    tenantId = tenant.id;

    await prisma.moduleDefinition.upsert({
      where: { key: 'cell-fellowship' },
      update: { name: 'Cell / Fellowship Module', category: 'Discipleship', dependencies: '[]' },
      create: { key: 'cell-fellowship', name: 'Cell / Fellowship Module', category: 'Discipleship', dependencies: '[]' },
    });
    await prisma.tenantModule.create({
      data: { tenantId, moduleKey: 'cell-fellowship', status: 'active', billingRule: 'free', usageLimits: '{}' },
    });
    await prisma.moduleSettings.upsert({
      where: { tenantId_moduleKey: { tenantId, moduleKey: 'cell-fellowship' } },
      update: {
        settings: JSON.stringify({
          enabled: true,
          publicPublishingEnabled: true,
          publicCellFinderEnabled: true,
          memberPortalEnabled: true,
        }),
      },
      create: {
        tenantId,
        moduleKey: 'cell-fellowship',
        settings: JSON.stringify({
          enabled: true,
          publicPublishingEnabled: true,
          publicCellFinderEnabled: true,
          memberPortalEnabled: true,
        }),
      },
    });

    // ── Roles & Permissions ───────────────────────────
    const permissions = await prisma.permission.findMany({
      where: { name: { in: ['member.update', 'member.read', 'tenant.settings'] } },
    });

    const adminRole = await prisma.role.create({ data: { tenantId, name: 'Admin', isCustom: false } });
    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
    });

    const memberRole = await prisma.role.create({ data: { tenantId, name: 'Member', isCustom: false } });
    const memberPerms = permissions.filter((p) => p.name !== 'tenant.settings');
    await prisma.rolePermission.createMany({
      data: memberPerms.map((p) => ({ roleId: memberRole.id, permissionId: p.id })),
    });

    const passHash = await bcrypt.hash('password123', 12);

    // ── Pastor User (Admin) ─────────────────────────
    const pastorUser = await prisma.user.create({
      data: { tenantId, email: 'pastor@dunamis.com', passwordHash: passHash },
    });
    pastorUserId = pastorUser.id;
    await prisma.userRole.create({ data: { userId: pastorUser.id, roleId: adminRole.id } });
    adminToken = jwt.sign({ userId: pastorUser.id, tenantId, email: pastorUser.email }, JWT_SECRET);

    const pastorMember = await prisma.member.create({
      data: {
        tenantId,
        userId: pastorUser.id,
        firstName: 'Paul',
        lastName: 'Apostle',
        email: 'pastor@dunamis.com',
        membershipStatus: 'leader',
      },
    });
    pastorMemberId = pastorMember.id;

    // ── Leadership Candidate User ─────────────────────────
    const candidateUser = await prisma.user.create({
      data: { tenantId, email: 'candidate@dunamis.com', passwordHash: passHash },
    });
    candidateUserId = candidateUser.id;
    await prisma.userRole.create({ data: { userId: candidateUser.id, roleId: memberRole.id } });
    candidateToken = jwt.sign({ userId: candidateUser.id, tenantId, email: candidateUser.email }, JWT_SECRET);

    const candidateMember = await prisma.member.create({
      data: {
        tenantId,
        userId: candidateUser.id,
        firstName: 'Timothy',
        lastName: 'LeaderCandidate',
        email: 'candidate@dunamis.com',
        membershipStatus: 'member',
      },
    });
    candidateMemberId = candidateMember.id;

    // ── Regular Member User ─────────────────────────
    const regularUser = await prisma.user.create({
      data: { tenantId, email: 'member@dunamis.com', passwordHash: passHash },
    });
    regularUserId = regularUser.id;
    await prisma.userRole.create({ data: { userId: regularUser.id, roleId: memberRole.id } });
    regularToken = jwt.sign({ userId: regularUser.id, tenantId, email: regularUser.email }, JWT_SECRET);

    const regularMember = await prisma.member.create({
      data: {
        tenantId,
        userId: regularUser.id,
        firstName: 'Silas',
        lastName: 'Congregant',
        email: 'member@dunamis.com',
        membershipStatus: 'member',
      },
    });
    regularMemberId = regularMember.id;

    // Seed Giving Categories
    await prisma.givingCategory.create({
      data: { id: 'tithe-cat', tenantId, name: 'Tithes', description: 'Tithe offerings', isActive: true }
    });
    await prisma.partnershipCategory.create({
      data: { id: 'media-partner-cat', tenantId, name: 'Media Outreach', description: 'Media partners fund', isActive: true }
    });
  });

  describe('1. Setup & Config API', () => {
    it('should create group settings', async () => {
      const res = await request(app)
        .post('/api/cells/settings')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          cellSizeLimit: 2,
          superCellSizeLimit: 2,
          autoNamingRuleEnabled: true,
          hierarchyDeepLimit: 3,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.cellSizeLimit).toBe(2);
    });

    it('should configure 3-level group types', async () => {
      // 1. Master Cell type
      let res = await request(app)
        .post('/api/cells/types')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Master Cell', tierLevel: 1, maxMembersThreshold: 2, nestedCellsThreshold: 2 });
      expect(res.status).toBe(201);
      masterTypeId = res.body.data.id;

      // 2. Super Cell type
      res = await request(app)
        .post('/api/cells/types')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Super Cell', tierLevel: 2, maxMembersThreshold: 2, nestedCellsThreshold: 2 });
      expect(res.status).toBe(201);
      superTypeId = res.body.data.id;

      // 3. Cell/Subcell type
      res = await request(app)
        .post('/api/cells/types')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Dunamis Cell', tierLevel: 3, maxMembersThreshold: 2, nestedCellsThreshold: 2 });
      expect(res.status).toBe(201);
      cellTypeId = res.body.data.id;
    });

    it('should retrieve list of configured group types', async () => {
      const res = await request(app)
        .get('/api/cells/types')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);
    });

    it('should expose the cell ministry manual as a readable publication', async () => {
      const res = await request(app)
        .get('/api/cells/manual')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Cell Ministry Manual');
      expect(res.body.data.sections.length).toBeGreaterThan(0);
      expect(res.body.data.pdfDownloadUrl).toBe('/api/cells/manual/pdf');
    });

    it('should allow admins to update and download the cell ministry manual PDF', async () => {
      let res = await request(app)
        .patch('/api/cells/manual')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Dunamis Cell Ministry Manual',
          subtitle: 'How our cells function and multiply.',
          visibility: 'public',
          status: 'published',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Dunamis Cell Ministry Manual');

      res = await request(app)
        .get('/api/cells/manual/pdf')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/pdf');
    });

    it('should create, publish, and expose a weekly cell leader outline', async () => {
      let res = await request(app)
        .post('/api/cells/outlines')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Faithful Witness Weekly Outline',
          weekStart: new Date().toISOString().slice(0, 10),
          scripture: 'Acts 2:42-47',
          sharingGuide: 'Guide leaders to discuss fellowship, prayer, and outreach.',
          discussionQuestions: ['What makes fellowship healthy?', 'Who are we inviting this week?'],
          prayerPoints: ['Pray for bold outreach.', 'Pray for new believers to be established.'],
          orderOfMeeting: [
            { label: 'Welcome and Prayer', durationMinutes: 5, instructions: 'Open warmly.' },
            { label: 'Word Sharing', durationMinutes: 20, instructions: 'Use the guide.' },
          ],
        });

      expect(res.status).toBe(201);
      const outlineId = res.body.data.id;

      res = await request(app)
        .post(`/api/cells/outlines/${outlineId}/publish`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('published');

      res = await request(app)
        .get('/api/cells/outlines/active')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBeDefined();

      res = await request(app)
        .get(`/api/cells/outlines/${outlineId}/pdf`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/pdf');
    });
  });

  describe('2. Cell Group Hierarchy & Naming', () => {
    it('should allow creating a Master Cell with custom descriptive naming', async () => {
      const res = await request(app)
        .post('/api/cells')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Ephesus Master Fellowship',
          description: 'Regional headquarters zone',
          groupTypeId: masterTypeId,
          fellowshipMode: 'offline',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Ephesus Master Fellowship');
      expect(res.body.data.fellowshipMode).toBe('offline');
      expect(res.body.data.onlineMeetingUrl).toBeNull();
      masterGroupId = res.body.data.id;
    });

    it('should auto-name a Super Cell if name is omitted and rules are enabled', async () => {
      const res = await request(app)
        .post('/api/cells')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          parentId: masterGroupId,
          groupTypeId: superTypeId,
          fellowshipMode: 'online',
          onlineMeetingUrl: 'https://meet.dunamis.com/super-cell',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Super Cell Group 1');
      expect(res.body.data.fellowshipMode).toBe('online');
      expect(res.body.data.onlineMeetingUrl).toBe('https://meet.dunamis.com/super-cell');
      superGroupId = res.body.data.id;
    });

    it('should permit creating a subcell nested under the Super Cell', async () => {
      const res = await request(app)
        .post('/api/cells')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Pioneers Subcell',
          parentId: superGroupId,
          groupTypeId: cellTypeId,
          fellowshipMode: 'hybrid',
          onlineMeetingUrl: 'https://meet.dunamis.com/pioneers',
          locationGeocoding: { city: 'Lagos', safeAddress: 'Yaba district' },
        });

      expect(res.status).toBe(201);
      expect(res.body.data.parentId).toBe(superGroupId);
      expect(res.body.data.fellowshipMode).toBe('hybrid');
      expect(res.body.data.location.fellowshipMode).toBe('hybrid');
      cellGroupId = res.body.data.id;
    });

    it('should reject unknown cell fellowship mode classifications', async () => {
      const res = await request(app)
        .post('/api/cells')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid Mode Cell',
          parentId: superGroupId,
          groupTypeId: cellTypeId,
          fellowshipMode: 'satellite',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('online, offline, or hybrid');
    });

    it('should block nesting deeper than the hierarchy deep limit settings', async () => {
      const res = await request(app)
        .post('/api/cells')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Too Deep Cell',
          parentId: cellGroupId, // would be depth 4 (Master -> Super -> Cell -> Too Deep)
          groupTypeId: cellTypeId,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('depth limit of 3 exceeded');
    });
  });

  describe('3. LMS Leadership certification course validation gate', () => {
    it('should block assigning leader if candidate is not LMS certified', async () => {
      const res = await request(app)
        .post(`/api/cells/${cellGroupId}/roles`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ leaderId: candidateMemberId });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('prerequisites');
    });

    it('should allow assigning leader after they complete the leadership course in LMS', async () => {
      // 1. Create a course representing the prerequisite
      const course = await prisma.lmsCourse.create({
        data: {
          tenantId,
          title: 'Cell Ministry Leadership Course',
          slug: 'cell-ministry-leadership-course',
          status: 'published'
        }
      });
      lmsCourseId = course.id;

      // 2. Complete the course for the candidate member
      await prisma.lmsEnrollment.create({
        data: {
          tenantId,
          courseId: course.id,
          memberId: candidateMemberId,
          status: 'completed',
          progressPercent: 100.0,
          completedAt: new Date()
        }
      });

      // 3. Retry assigning them
      const res = await request(app)
        .post(`/api/cells/${cellGroupId}/roles`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ leaderId: candidateMemberId });

      expect(res.status).toBe(200);
      expect(res.body.data.leaderId).toBe(candidateMemberId);
    });
  });

  describe('4. Group Members Exclusivity', () => {
    it('should add a member to the Cell roster', async () => {
      const res = await request(app)
        .post(`/api/cells/${cellGroupId}/members`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ memberId: regularMemberId });

      expect(res.status).toBe(201);
      expect(res.body.data.groupId).toBe(cellGroupId);
      expect(res.body.data.memberId).toBe(regularMemberId);
    });

    it('should block adding the same member to another active cell due to strict exclusivity rules', async () => {
      const res = await request(app)
        .post(`/api/cells/${superGroupId}/members`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ memberId: regularMemberId });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('already active in another cell');
    });

    it('should allow adding them to the second cell after marking their membership in the first cell inactive', async () => {
      // 1. Remove from Pioneers subcell
      let res = await request(app)
        .delete(`/api/cells/${cellGroupId}/members/${regularMemberId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);

      // 2. Add to Super Cell Group 1
      res = await request(app)
        .post(`/api/cells/${superGroupId}/members`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ memberId: regularMemberId });

      expect(res.status).toBe(201);
    });
  });

  describe('5. Cell Meetings & Attendance', () => {
    it('should schedule a weekly cell meeting', async () => {
      const res = await request(app)
        .post(`/api/cells/${cellGroupId}/meetings`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          topic: 'Walking by Faith',
          scheduledAt: new Date().toISOString(),
          studyGuideUrl: 'https://dunamis.com/study/faith.pdf'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      meetingId = res.body.data.id;
    });

    it('should log weekly attendance check-ins', async () => {
      const res = await request(app)
        .post(`/api/cells/meetings/${meetingId}/attendance`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          attendances: [
            { memberId: candidateMemberId, status: 'present' },
            { memberId: regularMemberId, status: 'absent' },
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.data.attendanceCount).toBe(1);
    });
  });

  describe('6. Member-Only Notice Board Permissions', () => {
    it('should block regular members from posting notices (Read-Only enforcement)', async () => {
      const res = await request(app)
        .post(`/api/cells/${cellGroupId}/notice-board`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          title: 'Member notice',
          content: 'Hello guys!',
          category: 'announcement',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Not authorized');
    });

    it('should allow Cell Leader to post notices to their own board', async () => {
      const res = await request(app)
        .post(`/api/cells/${cellGroupId}/notice-board`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          title: 'Weekly outline upload',
          content: 'Here is our discussion outline for this week.',
          category: 'sermon_outline',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Weekly outline upload');
    });

    it('should allow Super Cell leaders to post announcements to nested cell boards', async () => {
      // 1. Assign pastor as Super Cell Leader
      await prisma.group.update({
        where: { id: superGroupId },
        data: { leaderId: pastorMemberId }
      });
      await prisma.groupMember.create({
        data: { tenantId, groupId: superGroupId, memberId: pastorMemberId, role: 'leader', status: 'active' }
      });

      // 2. Pastor posts on subcell notice board Pioneers Subcell
      const res = await request(app)
        .post(`/api/cells/${cellGroupId}/notice-board`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`) // Admin represents Pastor user
        .send({
          title: 'Regional Alert',
          content: 'Pastor Paul says: regional fellowship coming up.',
          category: 'alert'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Regional Alert');
    });

    it('should allow cell leaders to delegate notice board write access to secretaries', async () => {
      // 1. Add regular member to cellGroupId cell again
      await prisma.groupMember.create({
        data: { tenantId, groupId: cellGroupId, memberId: regularMemberId, role: 'member', status: 'active' }
      });

      // 2. Delegate access
      let res = await request(app)
        .post(`/api/cells/${cellGroupId}/notice-board/delegate`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({ memberId: regularMemberId });
      expect(res.status).toBe(200);

      // 3. Regular member (now secretary) posts notice
      res = await request(app)
        .post(`/api/cells/${cellGroupId}/notice-board`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          title: 'Minutes of Cell meeting',
          content: 'Minutes recorded by Silas.',
          category: 'announcement'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Minutes of Cell meeting');
    });
  });

  describe('7. Outreach Invite Conversions', () => {
    it('should generate a cell-specific invite link', async () => {
      const res = await request(app)
        .post(`/api/cells/${cellGroupId}/invites`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          createdByMemberId: candidateMemberId,
          customMessage: 'Join our home fellowship!'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.token).toBeDefined();
      inviteToken = res.body.data.token;
    });

    it('should capture visitor signups and automatically register them to the cell', async () => {
      const res = await request(app)
        .post('/api/cells/invites/convert')
        .set('x-tenant-id', tenantId)
        .send({
          token: inviteToken,
          visitorDetails: {
            firstName: 'Luke',
            lastName: 'Physician',
            email: 'luke@dunamis.com',
            phone: '+1555666777',
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.data.member.email).toBe('luke@dunamis.com');
      
      // Verify they are added to the group roster
      const rosterCheck = await prisma.groupMember.findFirst({
        where: { groupId: cellGroupId, memberId: res.body.data.member.id }
      });
      expect(rosterCheck).toBeDefined();
      expect(rosterCheck!.role).toBe('member');
    });
  });

  describe('8. Accreditation Scorecard & Promotions', () => {
    beforeAll(async () => {
      // Record donations and partnerships for active members (Silas: member@dunamis.com)
      await prisma.donation.create({
        data: {
          tenantId,
          categoryId: 'tithe-cat',
          amount: 500.0,
          currency: 'USD',
          status: 'succeeded',
          donorEmail: 'member@dunamis.com',
        }
      });
      await prisma.partnership.create({
        data: {
          tenantId,
          categoryId: 'media-partner-cat',
          amount: 1500.0,
          currency: 'USD',
          status: 'succeeded',
          partnerEmail: 'member@dunamis.com',
        }
      });
    });

    it('should calculate the cell scorecard metrics', async () => {
      const res = await request(app)
        .get(`/api/cells/${cellGroupId}/scorecard`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.membersCount).toBeGreaterThanOrEqual(2);
      expect(res.body.data.totalGivingAttribution).toBe(2000.0); // 500 + 1500
      expect(res.body.data.outreachConversionsCount).toBe(1); // Luke conversion
      expect(res.body.data.averageAttendanceRate).toBeDefined();
    });

    it('should block promotion if size limits are not met', async () => {
      // Set cellTypeId threshold higher to verify block works
      await prisma.groupType.update({
        where: { id: cellTypeId },
        data: { maxMembersThreshold: 10 }
      });

      const res = await request(app)
        .post(`/api/cells/${cellGroupId}/promote`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('thresholds not met');
    });

    it('should promote the cell level and its leader when metrics pass settings limits', async () => {
      // Set cellTypeId threshold back to 1 to allow promote
      await prisma.groupType.update({
        where: { id: cellTypeId },
        data: { maxMembersThreshold: 1 }
      });

      const res = await request(app)
        .post(`/api/cells/${cellGroupId}/promote`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.type).toBe('group_level_up');
      expect(res.body.data.newValue).toBe('Super Cell');

      // Verify leader classification is promoted to Super Cell Leader
      const leaderPromotionCheck = await prisma.groupPromotion.findFirst({
        where: { targetId: candidateMemberId, type: 'leader_level_up' }
      });
      expect(leaderPromotionCheck).toBeDefined();
      expect(leaderPromotionCheck!.newValue).toBe('Super Cell Leader');
    });
  });
});
