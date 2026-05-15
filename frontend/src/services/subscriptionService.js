import api from './api';

const subscriptionService = {
    getPlans:   ()           => api.get('/subscription/plans'),
    getCurrent: ()           => api.get('/subscription/current'),
    upgrade:    (plan, notes) => api.post('/subscription/upgrade', { plan, notes }),
};

export default subscriptionService;
