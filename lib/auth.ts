import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import { clientPromise } from '@/lib/mongodb';
import { env } from '@/config/env';

/**
 * NextAuth Configuration
 * Providers: Google, GitHub, and Developer Logic
 * Adapter: MongoDB
 * Strategy: JWT
 */
export const authOptions: NextAuthOptions = {
  // Only use the adapter if MongoDB is configured
  ...(env.MONGODB_URI ? { adapter: MongoDBAdapter(clientPromise) as any } : {}),
  providers: [
    CredentialsProvider({
      name: 'Developer Login',
      credentials: {},
      async authorize(credentials) {
        // Mock developer user - using a valid-looking 24-char hex ID for MongoDB compatibility
        return {
          id: '507f1f77bcf86cd799439011', 
          name: 'Developer Mode',
          email: 'dev@neurovault.tech',
          image: 'https://ui-avatars.com/api/?name=Dev+User&background=0D8ABC&color=fff',
        };
      },
    }),
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID || 'missing',
      clientSecret: env.GOOGLE_CLIENT_SECRET || 'missing',
    }),
    GitHubProvider({
      clientId: env.GITHUB_CLIENT_ID || 'missing',
      clientSecret: env.GITHUB_CLIENT_SECRET || 'missing',
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  // Ensure the secret is never truly empty, as NextAuth requires it
  secret: env.NEXTAUTH_SECRET || 'fallback_secret_for_dev_mode_only',
  debug: process.env.NODE_ENV === 'development',
};

// NextAuth Types Augmentation
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
