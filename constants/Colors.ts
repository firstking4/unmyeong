// Ink / paper — avoid generic purple gradients.
const ink = '#1A1714';
const paper = '#F5F3ED';
const seal = '#B23A2F';
const mist = '#8A8278';

export default {
  light: {
    text: ink,
    background: paper,
    tint: seal,
    tabIconDefault: mist,
    tabIconSelected: seal,
    card: '#EFEAE2',
    muted: mist,
    hairline: '#E4DED4',
    surface: '#FFFcf8',
    grain: '#1A1714',
    keywordPositive: 'rgba(70, 110, 170, 0.16)',
    keywordNegative: 'rgba(178, 58, 47, 0.16)',
    keywordNeutral: 'rgba(138, 130, 120, 0.14)',
    keywordPositiveBorder: 'rgba(70, 110, 170, 0.55)',
    keywordNegativeBorder: 'rgba(178, 58, 47, 0.55)',
    keywordNeutralBorder: 'rgba(138, 130, 120, 0.45)',
  },
  dark: {
    text: paper,
    background: ink,
    tint: '#E07A6E',
    tabIconDefault: '#6F675E',
    tabIconSelected: '#E07A6E',
    card: '#26211C',
    muted: '#9A9186',
    hairline: '#3A342E',
    surface: '#201C18',
    grain: '#F3EEE6',
    keywordPositive: 'rgba(140, 175, 220, 0.22)',
    keywordNegative: 'rgba(224, 122, 110, 0.22)',
    keywordNeutral: 'rgba(154, 145, 134, 0.2)',
    keywordPositiveBorder: 'rgba(140, 175, 220, 0.65)',
    keywordNegativeBorder: 'rgba(224, 122, 110, 0.65)',
    keywordNeutralBorder: 'rgba(154, 145, 134, 0.5)',
  },
};
