/**
 * Centralized Data Ownership and Authorization Scope Helper
 * Enforces multi-tenant isolation across Colleges and Organizers.
 */

/**
 * Extracts and normalizes the authorized scope from the authenticated user token.
 * @param {Object} req - Express request object
 * @returns {Object} Scope definition
 */
function getAuthorizedScope(req) {
  if (!req.user) {
    return {
      role: 'ANONYMOUS',
      userId: null,
      collegeId: null,
      organizerId: null,
      isAdmin: false,
      isOrganizer: false,
      isStudent: false,
      isSuperAdmin: false,
    };
  }

  const role = req.user.role || 'STUDENT';
  const userId = req.user.userId || req.user.id || null;
  const collegeId = req.user.collegeId || null;
  const organizerId = role === 'ORGANIZER' ? userId : null;

  return {
    role,
    userId,
    collegeId,
    organizerId,
    isAdmin: role === 'ADMIN',
    isOrganizer: role === 'ORGANIZER',
    isStudent: role === 'STUDENT',
    isSuperAdmin: role === 'SUPER_ADMIN',
  };
}

/**
 * Builds Prisma where clause for Events based on the user's authorized scope.
 * @param {Object} scope - Scope object from getAuthorizedScope
 * @param {Object} [additionalWhere={}] - Extra filters to apply
 * @returns {Object} Scoped Prisma where clause
 */
function getScopedEventWhere(scope, additionalWhere = {}) {
  const where = { ...additionalWhere };

  if (scope.isSuperAdmin) {
    // Super admin has global scope unless explicit filter requested
    return where;
  }

  if (scope.isAdmin) {
    if (!scope.collegeId) {
      // Admin without collegeId should only see empty set
      where.collegeId = '__UNASSIGNED__';
    } else {
      where.collegeId = scope.collegeId;
    }
    return where;
  }

  if (scope.isOrganizer) {
    if (!scope.organizerId) {
      where.organizerId = '__UNASSIGNED__';
    } else {
      where.organizerId = scope.organizerId;
    }
    return where;
  }

  // Students and Public callers only see PUBLISHED events
  where.status = 'PUBLISHED';
  return where;
}

/**
 * Deterministically computes student behavior cluster based on engagement score and attendance rate.
 * @param {number} engagementScore - 0 to 100
 * @param {number} attendanceRate - 0 to 100
 * @param {number} eventsCount - Total registered events in scope
 * @returns {string} Cluster label
 */
function calculateBehaviorCluster(engagementScore, attendanceRate, eventsCount) {
  if (eventsCount === 0) return 'Inactive';
  if (engagementScore >= 80 && attendanceRate >= 80) return 'Highly Active';
  if (engagementScore >= 50 || attendanceRate >= 60) return 'Moderately Active';
  return 'Low Engagement';
}

module.exports = {
  getAuthorizedScope,
  getScopedEventWhere,
  calculateBehaviorCluster,
};
