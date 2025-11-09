"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";

// Animation Variants
const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5 } },
};

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Account deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("New passwords don't match");
      return;
    }

    // Validate password strength
    if (passwordData.new_password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    try {
      setChangingPassword(true);
      
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Password changed successfully");
        setShowPasswordModal(false);
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      } else {
        toast.error(data.error || "Failed to change password");
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error("An error occurred while changing password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast.error("Please type DELETE to confirm");
      return;
    }

    try {
      setDeletingAccount(true);
      
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Account deleted successfully");
        // Logout and redirect to home
        await logout();
        router.push('/');
      } else {
        toast.error(data.error || "Failed to delete account");
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error("An error occurred while deleting account");
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4 relative overflow-hidden"
      initial="hidden"
      animate="show"
      variants={containerVariants}
    >
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <motion.div
          className="absolute top-[10%] left-[15%] w-72 h-72 bg-indigo-600 rounded-full mix-blend-multiply filter blur-[80px]"
          animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.2, 1] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-[40%] right-[15%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[80px]"
          animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.1, 1] }}
          transition={{ duration: 7, repeat: Infinity, delay: 1 }}
        />
        <motion.div
          className="absolute bottom-[10%] left-[35%] w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-[80px]"
          animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.15, 1] }}
          transition={{ duration: 8, repeat: Infinity, delay: 2 }}
        />
      </div>

      <motion.div
        className="w-full max-w-2xl bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 space-y-6 shadow-xl border border-gray-700/50 z-10"
        variants={fadeIn}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <motion.h2
            className="text-3xl font-bold text-white bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent pb-1"
            variants={cardVariants}
          >
            Account Settings
          </motion.h2>
          <motion.div variants={cardVariants}>
            <Link href="/profile">
              <button className="py-2.5 px-5 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-medium transition-all duration-300">
                Back to Profile
              </button>
            </Link>
          </motion.div>
        </div>

        <motion.div className="space-y-5" variants={containerVariants}>
          {/* Account Information */}
          <motion.div variants={cardVariants} className="bg-gray-700/40 p-5 rounded-xl border border-gray-600/30">
            <h3 className="text-lg font-semibold text-white mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Account Information
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-300">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-medium">{user?.first_name} {user?.last_name}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{user?.email}</span>
              </div>
            </div>
          </motion.div>

          {/* Password & Security */}
          <motion.div variants={cardVariants} className="bg-gray-700/40 p-5 rounded-xl border border-gray-600/30 hover:border-indigo-500/20 transition-all duration-300">
            <h3 className="text-lg font-semibold text-white mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Password & Security
            </h3>
            <div className="space-y-3">
              <p className="text-gray-400 text-sm">
                Keep your account secure by using a strong password and regularly updating it.
              </p>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-md hover:shadow-indigo-500/25"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Change Password
              </button>
            </div>
          </motion.div>

          {/* Danger Zone */}
          <motion.div variants={cardVariants} className="bg-red-900/20 p-5 rounded-xl border border-red-500/30 hover:border-red-500/50 transition-all duration-300">
            <h3 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Danger Zone
            </h3>
            <div className="space-y-3">
              <p className="text-gray-300 text-sm">
                Once you delete your account, there is no going back. All your data including profile, interview reports, and resume will be permanently deleted.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-md hover:shadow-red-500/25"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Account
              </button>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl border border-gray-700"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
                  Change Password
                </h3>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({
                      current_password: '',
                      new_password: '',
                      confirm_password: ''
                    });
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                    required
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                    required
                    minLength={8}
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter new password"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Must be at least 8 characters with uppercase, lowercase, and digit
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                    required
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Confirm new password"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium rounded-lg hover:from-indigo-500 hover:to-indigo-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {changingPassword ? "Changing..." : "Change Password"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordData({
                        current_password: '',
                        new_password: '',
                        confirm_password: ''
                      });
                    }}
                    className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl border border-red-500/50"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-red-400 flex items-center gap-2">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Delete Account
                </h3>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmation('');
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4">
                  <p className="text-red-200 text-sm font-medium mb-2">
                    ⚠️ This action cannot be undone!
                  </p>
                  <p className="text-gray-300 text-sm">
                    This will permanently delete:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-gray-300 list-disc list-inside">
                    <li>Your profile and account information</li>
                    <li>All interview reports and history</li>
                    <li>Your uploaded resume</li>
                    <li>All associated data</li>
                  </ul>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Type <span className="text-red-400 font-bold">DELETE</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Type DELETE"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deletingAccount || deleteConfirmation !== 'DELETE'}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingAccount ? "Deleting..." : "Delete My Account"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteConfirmation('');
                    }}
                    className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
