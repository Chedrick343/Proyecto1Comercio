export const jewelryTheme = {
    colors: {
        accent: '#c9a246',
        accentDeep: '#8f6a1c'
    },

    fonts: {
        heading: '"Playfair Display", Georgia, "Times New Roman", serif',
        body: 'system-ui, "Segoe UI", Roboto, sans-serif'
    }
} as const;

export function getJewelryThemeVariables(): Record<string, string> {
    const { colors, fonts } = jewelryTheme;

    return {
        '--jewel-accent': colors.accent,
        '--jewel-accent-deep': colors.accentDeep,
        '--jewel-font-heading': fonts.heading,
        '--jewel-font-body': fonts.body
    };
}
