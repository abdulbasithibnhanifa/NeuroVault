import React from 'react';
import Image from 'next/image';
import { getServerSession } from 'next-auth';
import { authOptions } from '@neurovault/shared/lib/auth';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const user = session.user;
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="flex-1 flex flex-col pt-20 h-screen bg-[#f8fafc] dark:bg-[#030712] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tighter mb-8">User Profile</h1>
        
        <div className="bg-white dark:bg-gray-900 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
          
          <div className="px-8 pb-8">
            <div className="relative -top-12 flex items-end gap-6">
              {user?.image ? (
                <Image 
                  src={user.image} 
                  alt={user.name || 'User'} 
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-3xl shadow-xl border-4 border-white dark:border-gray-900 object-cover"
                />
              ) : (
                <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-3xl shadow-xl flex items-center justify-center border-4 border-white dark:border-gray-900 text-3xl font-black text-blue-600 dark:text-blue-400">
                  {initial}
                </div>
              )}
              <div className="pb-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{user?.name || 'Knowledge Owner'}</h2>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Active Member</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Account Details</h3>
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                      <p className="text-xs font-bold text-gray-500 uppercase">Email Address</p>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">{user?.email || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                      <p className="text-xs font-bold text-gray-500 uppercase">Account Status</p>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">Verified Professional</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">System Access</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">API Access</p>
                        <p className="text-xs text-gray-500">Full read/write access</p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-bold uppercase tracking-wider rounded-full">Granted</span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">AI Tokens</p>
                        <p className="text-xs text-gray-500">Usage tier status</p>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider rounded-full">Unlimited</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
