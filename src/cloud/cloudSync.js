import { cloudDb } from './supabaseClient';

const RECORD_TYPES = new Set([
  'profile', 'client', 'product', 'invoice', 'purchase', 'expense',
  'receipt', 'recurring', 'template', 'setting',
]);

const assertRecord = (record) => {
  if (!record?.companyId) throw new Error('companyId is required');
  if (!RECORD_TYPES.has(record.recordType)) throw new Error('Unsupported sync record type');
  if (!record.recordKey) throw new Error('recordKey is required');
};

export const cloudSync = {
  async registerDevice({ companyId, userId, deviceKey, deviceName }) {
    return cloudDb.upsert('sync_devices', {
      company_id: companyId,
      user_id: userId,
      device_key: deviceKey,
      device_name: deviceName || null,
      last_seen_at: new Date().toISOString(),
    }, 'company_id,device_key');
  },

  async push(record, { userId, deviceId } = {}) {
    assertRecord(record);
    return cloudDb.upsert('sync_records', {
      company_id: record.companyId,
      record_type: record.recordType,
      record_key: record.recordKey,
      payload: record.payload || {},
      deleted_at: record.deletedAt || null,
      device_id: deviceId || null,
      changed_by: userId,
      updated_at: new Date().toISOString(),
    }, 'company_id,record_type,record_key');
  },

  async pull({ companyId, afterVersion = 0, limit = 500 }) {
    if (!companyId) throw new Error('companyId is required');
    const query = [
      `company_id=eq.${encodeURIComponent(companyId)}`,
      `version=gt.${Number(afterVersion) || 0}`,
      'order=version.asc',
      `limit=${Math.min(Math.max(Number(limit) || 500, 1), 1000)}`,
    ].join('&');
    return cloudDb.select('sync_records', query);
  },

  // Last-write-wins is intentionally not automatic for financial documents.
  // The caller must show a conflict when local and cloud versions both moved.
  detectConflict({ localVersion, cloudVersion, lastPulledVersion }) {
    return Number(localVersion) > Number(lastPulledVersion)
      && Number(cloudVersion) > Number(lastPulledVersion);
  },
};
