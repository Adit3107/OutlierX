'use client';

import { AdminRoute } from '../../components/layout/AdminRoute';
import { AdminLayout } from '../../components/layout/AdminLayout';

export default function AdminRootLayout({ children }) {
    return (
        <AdminRoute>
            <AdminLayout>
                {children}
            </AdminLayout>
        </AdminRoute>
    );
}
