import api from './api';

class EmployeeService {
    async getAll() {
        const res = await api.get('/employees');
        return res.data?.data?.employees || [];
    }

    async create(employee) {
        const res = await api.post('/employees', employee);
        return res.data?.data?.employee;
    }

    async update(id, employee) {
        const res = await api.put(`/employees/${id}`, employee);
        return res.data?.data?.employee;
    }

    async remove(id) {
        await api.delete(`/employees/${id}`);
    }

    async bulkCreate(employees) {
        const res = await api.post('/employees/bulk', { employees });
        return res.data?.data?.employees || [];
    }
}

export default new EmployeeService();
