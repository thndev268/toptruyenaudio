import React from 'react';
import { AdminPageContainer } from '../layout/AdminPageContainer';
import { AdminBadgesScreen } from '../screens/AdminBadgesScreen';

export const AdminBadgesPage: React.FC = () => {
  return (
    <AdminPageContainer>
      <AdminBadgesScreen />
    </AdminPageContainer>
  );
};

export default AdminBadgesPage;
