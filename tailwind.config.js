import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            fontSize: {
                // Format: 'name': ['font-size', 'line-height']
                'large': ['20px', '28px'],
                'medium': ['18px', '25.2px'],
                'normal': ['16px', '22.4px'],
                'small': ['14px', '19.6px'],
                'xsmall': ['12px', '16.8px'],
            },
            colors: {
                // --- DARK MODE ---
                dark: {
                    surface: {
                        1: '#111111',
                        2: '#242424',
                        3: '#2E2E2E',
                    },
                    primary: '#F0F0F0',
                    secondary: '#7B7B7B',
                    border: '#3A3A3A',
                    'border-focus': '#4A4A4A',
                    input: '#2A2A2A',
                    'input-focus': '#313131',
                },
                
                // --- LIGHT MODE ---
                light: {
                    surface: {
                        1: '#FFFFFF',
                        2: '#F3F3F5',
                        3: '#DDDDDD',
                    },
                    primary: '#2D2D2D',
                    secondary: '#B0B0B0',
                },

                // --- ACCENT COLORS ---
                accent: {
                    red: { light: '#FFB3B3', DEFAULT: '#D32F2F' },
                    orange: { light: '#FFD1A1', DEFAULT: '#F57C00' },
                    yellow: { light: '#FFF0B3', DEFAULT: '#FBC02D' },
                    lime: { light: '#DCEDC8', DEFAULT: '#7CB342' },
                    green: { light: '#B2DFDB', DEFAULT: '#00897B' },
                    cyan: { light: '#B3E5FC', DEFAULT: '#0288D1' },
                    blue: { light: '#C5CAE9', DEFAULT: '#3949AB' },
                    purple: { light: '#E1BEE7', DEFAULT: '#8E24AA' },
                    pink: { light: '#F8BBD0', DEFAULT: '#C2185B' },
                    brown: { light: '#D7CCC8', DEFAULT: '#8D6E63' },
                },

                // --- STATUS COLORS ---
                status: {
                    info: '#2F80ED',
                    success: {
                        DEFAULT: '#27AE60',
                        str: '#1D860B',
                    },
                    warning: '#E2B93B',
                    error: '#EB5757',
                }
            }
        },
    },
    plugins: [],
};