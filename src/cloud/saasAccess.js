import { cloudDb } from './supabaseClient';

export const saasAccess = {
  companies: () => cloudDb.select('companies', 'order=name.asc'),
  memberships: (companyId) => cloudDb.select('company_memberships', `company_id=eq.${encodeURIComponent(companyId)}`),
  teams: (companyId) => cloudDb.select('teams', `company_id=eq.${encodeURIComponent(companyId)}&order=name.asc`),
  roles: (companyId) => cloudDb.select('roles', `company_id=eq.${encodeURIComponent(companyId)}&order=name.asc`),
  permissions: () => cloudDb.select('permissions', 'order=module_code.asc,code.asc'),
  modules: () => cloudDb.select('modules', 'status=eq.active&order=name.asc'),
  plans: () => cloudDb.select('plans', 'status=eq.active&order=price_monthly_inr.asc'),

  async updateCompanyStatus(companyId, status, reason = null) {
    if (!['trial', 'active', 'suspended', 'cancelled'].includes(status)) throw new Error('Invalid company status');
    return cloudDb.update('companies', `id=eq.${encodeURIComponent(companyId)}`, {
      status,
      suspended_at: status === 'suspended' ? new Date().toISOString() : null,
      suspension_reason: status === 'suspended' ? reason : null,
    });
  },

  createTeam(companyId, name, code, userId) {
    return cloudDb.insert('teams', {
      company_id: companyId,
      name,
      code,
      created_by: userId,
    });
  },

  createRole(companyId, role) {
    return cloudDb.insert('roles', {
      company_id: companyId,
      team_id: role.teamId || null,
      name: role.name,
      code: role.code,
      description: role.description || null,
    });
  },

  setRolePermission(companyId, roleId, permissionId, { scope = 'own', effect = 'allow', validFrom = null, validUntil = null } = {}) {
    return cloudDb.upsert('role_permissions', {
      company_id: companyId,
      role_id: roleId,
      permission_id: permissionId,
      scope,
      effect,
      valid_from: validFrom,
      valid_until: validUntil,
    }, 'role_id,permission_id');
  },
};
