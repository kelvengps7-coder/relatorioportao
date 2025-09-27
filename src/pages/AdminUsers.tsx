import UserManagementPanel from '@/components/UserManagementPanel';

const AdminUsers = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <UserManagementPanel />
      </div>
    </div>
  );
};

export default AdminUsers;