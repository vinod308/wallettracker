const employeeService = require('../services/employeeService');
const { successResponse } = require('../utils/helpers');

class EmployeeController {
    async getAllEmployees(req, res, next) {
        try {
            const employees = await employeeService.getAllEmployees(req.user.id);
            return res.json(successResponse('Employees fetched', { employees }));
        } catch (error) { next(error); }
    }

    async createEmployee(req, res, next) {
        try {
            const employee = await employeeService.createEmployee(req.user.id, req.body);
            return res.status(201).json(successResponse('Employee created', { employee }));
        } catch (error) { next(error); }
    }

    async updateEmployee(req, res, next) {
        try {
            const employee = await employeeService.updateEmployee(req.user.id, req.params.id, req.body);
            return res.json(successResponse('Employee updated', { employee }));
        } catch (error) { next(error); }
    }

    async deleteEmployee(req, res, next) {
        try {
            await employeeService.deleteEmployee(req.user.id, req.params.id);
            return res.json(successResponse('Employee deleted'));
        } catch (error) { next(error); }
    }

    async bulkCreate(req, res, next) {
        try {
            const { employees } = req.body;
            if (!Array.isArray(employees)) {
                return res.status(400).json({ error: 'employees array is required' });
            }
            const results = await employeeService.bulkCreate(req.user.id, employees);
            return res.json(successResponse('Employees imported', { employees: results }));
        } catch (error) { next(error); }
    }
}

module.exports = new EmployeeController();
