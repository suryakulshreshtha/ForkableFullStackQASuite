"""
MSSQL helper used for:
1. Ground-truth assertions (did the record actually persist correctly,
   independent of what the UI displays).
2. Fast setup/teardown of test data that doesn't need to go through the API.

Mirrors ts-suite/src/db/dbClient.ts. Keep this READ-mostly in tests; prefer
the API layer for creating state, and direct SQL for verification and for
cleanup that must be guaranteed regardless of API behavior.
"""
from __future__ import annotations

import os
import pyodbc


class DbClient:
    def __init__(self):
        self.conn: pyodbc.Connection | None = None

    def connect(self):
        conn_str = (
            f"DRIVER={os.environ['DB_DRIVER']};"
            f"SERVER={os.environ['DB_SERVER']},{os.environ.get('DB_PORT', '1433')};"
            f"DATABASE={os.environ['DB_NAME']};"
            f"UID={os.environ['DB_USER']};"
            f"PWD={os.environ['DB_PASSWORD']};"
            f"Encrypt=yes;TrustServerCertificate=yes;"
        )
        self.conn = pyodbc.connect(conn_str)

    def query(self, sql: str, params: tuple = ()) -> list[dict]:
        if not self.conn:
            raise RuntimeError("DbClient not connected — call connect() first")
        cursor = self.conn.cursor()
        cursor.execute(sql, params)
        columns = [col[0] for col in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]

    # Users = login accounts (who can sign in). Employees = the CRM's actual
    # tracked entity (position, utilization, availability, projects, skills).
    # Kept as separate lookups so a test doesn't silently query the wrong
    # table when it needs "the account that logged in" vs. "the person
    # being viewed".

    def find_user_by_email(self, email: str) -> dict | None:
        rows = self.query("SELECT TOP 1 * FROM Users WHERE Email = ?", (email,))
        return rows[0] if rows else None

    def delete_user_by_email(self, email: str):
        cursor = self.conn.cursor()
        cursor.execute("DELETE FROM Users WHERE Email = ?", (email,))
        self.conn.commit()

    # Table/column names below are illustrative — replace with your actual
    # schema. Intent: verify utilization %, available hours, current/previous
    # project assignments, and skills/qualifications against ground truth,
    # independent of what the UI or dashboard chart renders.

    def find_employee_by_id(self, employee_id) -> dict | None:
        rows = self.query("SELECT TOP 1 * FROM Employees WHERE EmployeeId = ?", (employee_id,))
        return rows[0] if rows else None

    def get_employee_utilization(self, employee_id) -> dict | None:
        rows = self.query(
            """SELECT UtilizationPercent, AvailableHours
               FROM EmployeeUtilization
               WHERE EmployeeId = ? AND PeriodEnd >= GETDATE()
               ORDER BY PeriodStart DESC""",
            (employee_id,),
        )
        return rows[0] if rows else None

    def get_employee_project_history(self, employee_id) -> list[dict]:
        return self.query(
            """SELECT p.ProjectName, pa.RoleOnProject, pa.StartDate, pa.EndDate
               FROM ProjectAssignments pa
               JOIN Projects p ON p.ProjectId = pa.ProjectId
               WHERE pa.EmployeeId = ?
               ORDER BY pa.StartDate DESC""",
            (employee_id,),
        )

    def delete_employee_by_id(self, employee_id):
        cursor = self.conn.cursor()
        cursor.execute("DELETE FROM Employees WHERE EmployeeId = ?", (employee_id,))
        self.conn.commit()

    def close(self):
        if self.conn:
            self.conn.close()
