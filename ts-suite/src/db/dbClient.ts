import sql from 'mssql';

/**
 * MSSQL helper used for:
 * 1. Ground-truth assertions ("did the record actually persist correctly",
 *    independent of what the UI displays).
 * 2. Fast setup/teardown of test data that doesn't need to go through the API.
 *
 * Keep this READ-mostly in tests. Prefer the API layer for creating state;
 * use direct SQL for verification and for cleanup that must be guaranteed
 * (e.g. deleting a test user even if the API delete endpoint is untested).
 */
export class DbClient {
  private pool: sql.ConnectionPool | null = null;

  async connect() {
    this.pool = await sql.connect({
      server: process.env.DB_SERVER!,
      database: process.env.DB_NAME!,
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      port: Number(process.env.DB_PORT) || 1433,
      options: { encrypt: process.env.DB_ENCRYPT === 'true', trustServerCertificate: true },
    });
  }

  async query<T = any>(queryText: string, params: Record<string, unknown> = {}): Promise<T[]> {
    if (!this.pool) throw new Error('DbClient not connected — call connect() first');
    const req = this.pool.request();
    for (const [key, value] of Object.entries(params)) {
      req.input(key, value as any);
    }
    const result = await req.query(queryText);
    return result.recordset as T[];
  }

  // Users = login accounts (who can sign in). Employees = the CRM's actual
  // tracked entity (position, utilization, availability, projects, skills).
  // A user may or may not correspond to an employee record — keeping these
  // as two distinct lookups avoids silently testing the wrong table when a
  // test needs "the account that logged in" vs. "the person being viewed".

  async findUserByEmail(email: string) {
    const rows = await this.query('SELECT TOP 1 * FROM Users WHERE Email = @email', { email });
    return rows[0] ?? null;
  }

  async deleteUserByEmail(email: string) {
    await this.query('DELETE FROM Users WHERE Email = @email', { email });
  }

  // Table/column names below are illustrative — replace with your actual
  // schema. Intent: verify utilization %, available hours, current/previous
  // project assignments, and skills/qualifications against ground truth,
  // independent of what the UI or dashboard chart renders.

  async findEmployeeById(employeeId: string | number) {
    const rows = await this.query(
      'SELECT TOP 1 * FROM Employees WHERE EmployeeId = @employeeId',
      { employeeId }
    );
    return rows[0] ?? null;
  }

  async getEmployeeUtilization(employeeId: string | number) {
    const rows = await this.query(
      `SELECT UtilizationPercent, AvailableHours
       FROM EmployeeUtilization
       WHERE EmployeeId = @employeeId AND PeriodEnd >= GETDATE()
       ORDER BY PeriodStart DESC`,
      { employeeId }
    );
    return rows[0] ?? null;
  }

  async getEmployeeProjectHistory(employeeId: string | number) {
    return this.query(
      `SELECT p.ProjectName, pa.RoleOnProject, pa.StartDate, pa.EndDate
       FROM ProjectAssignments pa
       JOIN Projects p ON p.ProjectId = pa.ProjectId
       WHERE pa.EmployeeId = @employeeId
       ORDER BY pa.StartDate DESC`,
      { employeeId }
    );
  }

  async deleteEmployeeById(employeeId: string | number) {
    await this.query('DELETE FROM Employees WHERE EmployeeId = @employeeId', { employeeId });
  }

  async close() {
    await this.pool?.close();
  }
}
