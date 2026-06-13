import NextAuth from 'next-auth'
import type { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
  providers: [],
  pages: { signIn: '/login' },
}

export default NextAuth(authOptions)
