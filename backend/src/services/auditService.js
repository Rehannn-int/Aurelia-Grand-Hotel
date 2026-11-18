import AuditLog from '../models/AuditLog.js';

export async function writeAuditLog({ actor, action, resourceType, resourceId, metadata = {} }, options = {}) {
  return AuditLog.create([{
    actor,
    action,
    resourceType,
    resourceId: String(resourceId || ''),
    metadata,
  }], options);
}
