import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getAuthByEmail } from './airtable';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const authRecord = await getAuthByEmail(credentials.email.toLowerCase().trim());
        if (!authRecord) return null;

        const passwordMatch = await bcrypt.compare(credentials.password, authRecord.passwordHash);
        if (!passwordMatch) return null;

        return {
          id: authRecord.id,
          email: authRecord.email,
          name: authRecord.name,
          role: authRecord.role,
          alumniRecordId: authRecord.alumniRecordId,
          mustChangePassword: authRecord.mustChangePassword,
        };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.alumniRecordId = (user as { alumniRecordId?: string }).alumniRecordId;
        token.authId = user.id;
        token.mustChangePassword = (user as { mustChangePassword?: boolean }).mustChangePassword;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { alumniRecordId?: string }).alumniRecordId = token.alumniRecordId as string;
        (session.user as { authId?: string }).authId = token.authId as string;
        (session.user as { mustChangePassword?: boolean }).mustChangePassword = token.mustChangePassword as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
