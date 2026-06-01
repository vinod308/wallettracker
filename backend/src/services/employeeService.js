const pool = require('../config/database');
const logger = require('../utils/logger');

class EmployeeService {
    _toEmployee(row) {
        return {
            id: row.id,
            employeeId: row.employee_id,
            fullName: row.full_name,
            status: row.status,
            createdAt: row.created_at,
            ...row.data,
        };
    }

    async getAllEmployees(userId) {
        const { rows } = await pool.query(
            `SELECT id, employee_id, full_name, data, status, created_at
             FROM employees WHERE user_id = $1 ORDER BY created_at ASC`,
            [userId]
        );
        return rows.map(r => this._toEmployee(r));
    }

    async createEmployee(userId, employee) {
        const { employeeId, fullName, status = 'Active', id, ...rest } = employee;
        const { rows } = await pool.query(
            `INSERT INTO employees (user_id, employee_id, full_name, data, status)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, employee_id, full_name, data, status, created_at`,
            [userId, employeeId, fullName, JSON.stringify(rest), status]
        );
        logger.info(`Employee created for user ${userId}: ${employeeId}`);
        return this._toEmployee(rows[0]);
    }

    async updateEmployee(userId, dbId, employee) {
        const { employeeId, fullName, status = 'Active', id, ...rest } = employee;
        const { rows } = await pool.query(
            `UPDATE employees SET employee_id=$1, full_name=$2, data=$3, status=$4, updated_at=NOW()
             WHERE id=$5 AND user_id=$6
             RETURNING id, employee_id, full_name, data, status, created_at`,
            [employeeId, fullName, JSON.stringify(rest), status, dbId, userId]
        );
        if (!rows.length) throw new Error('Employee not found');
        return this._toEmployee(rows[0]);
    }

    async deleteEmployee(userId, dbId) {
        const { rowCount } = await pool.query(
            `DELETE FROM employees WHERE id=$1 AND user_id=$2`,
            [dbId, userId]
        );
        if (!rowCount) throw new Error('Employee not found');
    }

    async bulkCreate(userId, employees) {
        const results = [];
        for (const emp of employees) {
            try {
                results.push(await this.createEmployee(userId, emp));
            } catch (e) {
                logger.warn(`Skipped employee ${emp.employeeId}: ${e.message}`);
            }
        }
        return results;
    }
}

module.exports = new EmployeeService();
