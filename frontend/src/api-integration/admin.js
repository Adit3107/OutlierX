import axios from 'axios';

const getEnv = (key, fallback) => {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
        return process.env[key];
    }
    return fallback;
};

const ADMIN_URL = getEnv('VITE_ADMIN_SERVICE_URL', getEnv('NEXT_PUBLIC_ADMIN_SERVICE_URL', 'http://localhost:3005'));

const adminClient = axios.create({
    baseURL: ADMIN_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add auth interceptor
adminClient.interceptors.request.use(async (config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('anomalyze_token') || localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

export const adminApi = {
    // GET /admin/stats
    getStats: async () => {
        const { data } = await adminClient.get('/admin/stats');
        return data;
    },

    // GET /admin/stats/charts
    getChartData: async () => {
        const { data } = await adminClient.get('/admin/stats/charts');
        return data;
    },

    // GET /admin/users
    getUsers: async (params) => {
        const { data } = await adminClient.get('/admin/users', { params });
        return data;
    },

    // PATCH /admin/users/:id/role
    updateUserRole: async (userId, role) => {
        const { data } = await adminClient.patch(`/admin/users/${userId}/role`, { role });
        return data;
    },

    // PATCH /admin/users/:id/status
    updateUserStatus: async (userId, status) => {
        const { data } = await adminClient.patch(`/admin/users/${userId}/status`, { status });
        return data;
    },

    // PATCH /admin/users/:id/force-reset
    forcePasswordReset: async (userId, forceReset) => {
        const { data } = await adminClient.patch(`/admin/users/${userId}/force-reset`, { forceReset });
        return data;
    },

    // PATCH /admin/users/:id/subscription
    updateUserSubscription: async (userId, plan, status) => {
        const { data } = await adminClient.patch(`/admin/users/${userId}/subscription`, { plan, status });
        return data;
    },

    // GET /admin/models
    getModels: async () => {
        const { data } = await adminClient.get('/admin/models');
        return data;
    },

    // POST /admin/models/retrain
    retrainModel: async (modelType) => {
        const { data } = await adminClient.post('/admin/models/retrain', { modelType });
        return data;
    },

    // GET /admin/routes
    getDiscoveredRoutes: async () => {
        const { data } = await adminClient.get('/admin/routes');
        return data;
    },

    // POST /admin/proxy
    proxyRequest: async (proxyData) => {
        const { data } = await adminClient.post('/admin/proxy', proxyData);
        return data;
    }
};
