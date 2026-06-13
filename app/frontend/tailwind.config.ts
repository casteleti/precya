import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Soft Rose — ações primárias, calor emocional
        rose: {
          50:  '#FFF5F3',
          100: '#FCE8E4',
          200: '#F5D5CF',
          300: '#E8B8AE',
          400: '#D98F84',
          500: '#C96F63',
        },
        // Sage Green — sucesso, margens saudáveis
        sage: {
          50:  '#F4F8F2',
          100: '#E7F0E2',
          200: '#D2E2CA',
          300: '#B5CEA8',
          400: '#95B788',
          500: '#789D6B',
        },
        // Soft Blue — informação, dados
        sky: {
          50:  '#F4FAFC',
          100: '#E8F4F8',
          200: '#D6EAF1',
          300: '#BEDCE8',
          400: '#99C4D6',
          500: '#73A9C0',
        },
        // Neutrals warm
        warm: {
          0:   '#FFFFFF',
          50:  '#FCFBFA',
          100: '#F8F7F5',
          200: '#EFECE8',
          300: '#DDD8D2',
          400: '#B8B1AA',
          500: '#8F8780',
          700: '#5A534D',
          900: '#2F2A26',
        },
        // Accent gold — uso mínimo
        champagne: '#D6B98C',
        gold:      '#E7D5B5',
      },
      borderRadius: {
        sm:  '8px',
        md:  '12px',
        lg:  '16px',
        xl:  '24px',
        '2xl': '32px',
      },
      boxShadow: {
        soft:  '0 4px 20px rgba(0,0,0,0.06)',
        card:  '0 8px 32px rgba(0,0,0,0.04)',
        input: '0 2px 8px rgba(0,0,0,0.04)',
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '13': '52px',
        '18': '72px',
      },
      backgroundImage: {
        'rose-gradient': 'linear-gradient(135deg, #FCE8E4 0%, #F5D5CF 100%)',
        'sage-gradient': 'linear-gradient(135deg, #E7F0E2 0%, #D2E2CA 100%)',
        'sky-gradient':  'linear-gradient(135deg, #E8F4F8 0%, #D6EAF1 100%)',
      },
    },
  },
  plugins: [],
}

export default config
