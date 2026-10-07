// core (MUI) - lightweight locale strings for base components only
import {
  enUS as enUSCore,
  frFR as frFRCore,
  viVN as viVNCore,
  zhCN as zhCNCore,
  arSA as arSACore,
} from '@mui/material/locale';

// PLEASE REMOVE `LOCAL STORAGE` WHEN YOU CHANGE SETTINGS.
// ----------------------------------------------------------------------

export const allLangs = [
  {
    label: 'English',
    value: 'en',
    systemValue: enUSCore,
    icon: 'flagpack:gb-nir',
    numberFormat: {
      code: 'en-US',
      currency: 'DZD',
    },
  },
  {
    label: 'French',
    value: 'fr',
    systemValue: frFRCore,
    icon: 'flagpack:fr',
    numberFormat: {
      code: 'fr-Fr',
      currency: 'DZD',
    },
  },
  // {
  //   label: 'Vietnamese',
  //   value: 'vi',
  //   systemValue: viVNCore,
  //   icon: 'flagpack:vn',
  //   numberFormat: {
  //     code: 'vi-VN',
  //     currency: 'VND',
  //   },
  // },
  // {
  //   label: 'Chinese',
  //   value: 'cn',
  //   systemValue: zhCNCore,
  //   icon: 'flagpack:cn',
  //   numberFormat: {
  //     code: 'zh-CN',
  //     currency: 'CNY',
  //   },
  // },
  {
    label: '\u0627\u0644\u0639\u0631\u0628\u064A\u0629',
    value: 'ar',
    systemValue: arSACore,
    icon: 'flagpack:dz',
    numberFormat: {
      code: 'ar',
      currency: 'DZD',
    },
  },
];

export function allLangs2(english,arabic){
  return [
  {
    label:english,
    value: 'en',
    systemValue: enUSCore,
    icon: 'flagpack:gb-nir',
    numberFormat: {
      code: 'en-US',
      currency: 'DZD',
    },
  },
  {
    label: arabic,
    value: 'ar',
    systemValue: arSACore,
    icon: 'flagpack:sa',
    numberFormat: {
      code: 'ar',
      currency: 'DZD',
    },
  },
  // {
  //   label: 'French',
  //   value: 'fr',
  //   systemValue: frFRCore,
  //   icon: 'flagpack:fr',
  //   numberFormat: {
  //     code: 'fr-Fr',
  //     currency: 'EUR',
  //   },
  // },
  // {
  //   label: 'Vietnamese',
  //   value: 'vi',
  //   systemValue: viVNCore,
  //   icon: 'flagpack:vn',
  //   numberFormat: {
  //     code: 'vi-VN',
  //     currency: 'VND',
  //   },
  // },
  // {
  //   label: 'Chinese',
  //   value: 'cn',
  //   systemValue: zhCNCore,
  //   icon: 'flagpack:cn',
  //   numberFormat: {
  //     code: 'zh-CN',
  //     currency: 'CNY',
  //   },
  // },

]

};

// export const defaultLang = allLangs[0]; // English
export const defaultLang = allLangs[1]; // Arabic

// GET MORE COUNTRY FLAGS
// https://icon-sets.iconify.design/flagpack/
// https://www.dropbox.com/sh/nec1vwswr9lqbh9/AAB9ufC8iccxvtWi3rzZvndLa?dl=0
