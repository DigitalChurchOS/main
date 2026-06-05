import prisma from '../lib/prisma';

export class CentralizedSettingsEngineService {
  /**
   * Create a new settings configuration profile.
   */
  static async createProfile(
    tenantId: string,
    createdBy: string | null,
    data: { title: string; description?: string; settingsJson?: any; visibility?: string }
  ) {
    const profile = await prisma.centralizedSettingsEngineModule.create({
      data: {
        tenantId,
        title: data.title,
        description: data.description || null,
        status: 'active',
        settingsJson: typeof data.settingsJson === 'string' ? data.settingsJson : JSON.stringify(data.settingsJson || {}),
        visibility: data.visibility || 'private',
        createdById: createdBy,
      },
    });

    await this.logActivity(tenantId, createdBy || 'System', 'profile_create', {
      profileId: profile.id,
      title: profile.title,
    });

    return profile;
  }

  /**
   * List all settings profiles for the tenant.
   */
  static async listProfiles(tenantId: string) {
    return await prisma.centralizedSettingsEngineModule.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get single settings profile.
   */
  static async getProfile(id: string, tenantId: string) {
    const record = await prisma.centralizedSettingsEngineModule.findFirst({
      where: { id, tenantId },
    });
    if (!record) {
      throw new Error('Settings profile not found');
    }
    return record;
  }

  /**
   * Update settings profile.
   */
  static async updateProfile(
    id: string,
    tenantId: string,
    userId: string | null,
    data: { title?: string; description?: string; status?: string; settingsJson?: any; visibility?: string }
  ) {
    const record = await this.getProfile(id, tenantId);

    const updated = await prisma.centralizedSettingsEngineModule.update({
      where: { id: record.id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.settingsJson !== undefined && {
          settingsJson: typeof data.settingsJson === 'string' ? data.settingsJson : JSON.stringify(data.settingsJson),
        }),
        ...(data.visibility !== undefined && { visibility: data.visibility }),
      },
    });

    await this.logActivity(tenantId, userId || 'System', 'profile_update', {
      profileId: id,
      updatedFields: Object.keys(data),
    });

    return updated;
  }

  /**
   * Delete settings profile.
   */
  static async deleteProfile(id: string, tenantId: string, userId: string | null) {
    const record = await this.getProfile(id, tenantId);
    
    await prisma.centralizedSettingsEngineModule.delete({
      where: { id: record.id },
    });

    await this.logActivity(tenantId, userId || 'System', 'profile_delete', {
      profileId: id,
      title: record.title,
    });

    return record;
  }

  /**
   * Logs an action in the activity trail.
   */
  static async logActivity(tenantId: string, userId: string, actionType: string, metadata: any) {
    return await prisma.centralizedSettingsEngineModuleActivity.create({
      data: {
        tenantId,
        userId,
        actionType,
        metadataJson: typeof metadata === 'string' ? metadata : JSON.stringify(metadata || {}),
      },
    });
  }

  /**
   * Lists the audit activity logs for settings.
   */
  static async listActivities(tenantId: string) {
    return await prisma.centralizedSettingsEngineModuleActivity.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
