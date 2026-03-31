import { createSlice } from "@reduxjs/toolkit";
//constants
import {
  LAYOUT_TYPES,
  LAYOUT_MODE_TYPES,
  LAYOUT_SIDEBAR_TYPES,
  LAYOUT_WIDTH_TYPES,
  LAYOUT_POSITION_TYPES,
  LAYOUT_TOPBAR_THEME_TYPES,
  LEFT_SIDEBAR_SIZE_TYPES,
  LEFT_SIDEBAR_VIEW_TYPES,
  LEFT_SIDEBAR_IMAGE_TYPES,
  PERLOADER_TYPES,
  SIDEBAR_VISIBILITY_TYPES
} from "../../Components/constants/layout"

// localStorage'dan kayıtlı ayarları al
const getSavedLayoutSettings = () => {
  try {
    const savedSettings = localStorage.getItem('layoutSettings');
    return savedSettings ? JSON.parse(savedSettings) : null;
  } catch (error) {
    console.error('Error loading layout settings:', error);
    return null;
  }
};

// Varsayılan ayarlar ile localStorage'dan gelen ayarları birleştir
const savedSettings = getSavedLayoutSettings();

export interface LayoutState {
  layoutType: LAYOUT_TYPES.HORIZONTAL | LAYOUT_TYPES.VERTICAL | LAYOUT_TYPES.TWOCOLUMN | LAYOUT_TYPES.SEMIBOX;
  layoutModeType: LAYOUT_MODE_TYPES.LIGHTMODE | LAYOUT_MODE_TYPES.DARKMODE;
  leftSidebarType: LAYOUT_SIDEBAR_TYPES.LIGHT | LAYOUT_SIDEBAR_TYPES.DARK | LAYOUT_SIDEBAR_TYPES.GRADIENT | LAYOUT_SIDEBAR_TYPES.GRADIENT_2 | LAYOUT_SIDEBAR_TYPES.GRADIENT_3 | LAYOUT_SIDEBAR_TYPES.GRADIENT_4;
  layoutWidthType: LAYOUT_WIDTH_TYPES.FLUID | LAYOUT_WIDTH_TYPES.BOXED;
  layoutPositionType: LAYOUT_POSITION_TYPES.FIXED | LAYOUT_POSITION_TYPES.SCROLLABLE;
  topbarThemeType: LAYOUT_TOPBAR_THEME_TYPES.LIGHT | LAYOUT_TOPBAR_THEME_TYPES.DARK;
  leftsidbarSizeType: LEFT_SIDEBAR_SIZE_TYPES.DEFAULT | LEFT_SIDEBAR_SIZE_TYPES.COMPACT | LEFT_SIDEBAR_SIZE_TYPES.SMALLICON | LEFT_SIDEBAR_SIZE_TYPES.SMALLHOVER;
  leftSidebarViewType: LEFT_SIDEBAR_VIEW_TYPES.DEFAULT | LEFT_SIDEBAR_VIEW_TYPES.DETACHED;
  leftSidebarImageType: LEFT_SIDEBAR_IMAGE_TYPES.NONE | LEFT_SIDEBAR_IMAGE_TYPES.IMG1 | LEFT_SIDEBAR_IMAGE_TYPES.IMG2 | LEFT_SIDEBAR_IMAGE_TYPES.IMG3 | LEFT_SIDEBAR_IMAGE_TYPES.IMG4;
  preloader: PERLOADER_TYPES.ENABLE | PERLOADER_TYPES.DISABLE;
  sidebarVisibilitytype:  SIDEBAR_VISIBILITY_TYPES.SHOW | SIDEBAR_VISIBILITY_TYPES.HIDDEN;
  customizer: boolean; // customizer sidebar'ın açık/kapalı durumu
}

export const initialState: LayoutState = {
  layoutType: savedSettings?.layoutType || LAYOUT_TYPES.SEMIBOX,
  layoutModeType: savedSettings?.layoutModeType || LAYOUT_MODE_TYPES.LIGHTMODE,
  leftSidebarType: savedSettings?.leftSidebarType || LAYOUT_SIDEBAR_TYPES.LIGHT,
  layoutWidthType: savedSettings?.layoutWidthType || LAYOUT_WIDTH_TYPES.FLUID,
  layoutPositionType: savedSettings?.layoutPositionType || LAYOUT_POSITION_TYPES.FIXED,
  topbarThemeType: savedSettings?.topbarThemeType || LAYOUT_TOPBAR_THEME_TYPES.LIGHT,
  leftsidbarSizeType: savedSettings?.leftsidbarSizeType || LEFT_SIDEBAR_SIZE_TYPES.DEFAULT,
  leftSidebarViewType: savedSettings?.leftSidebarViewType || LEFT_SIDEBAR_VIEW_TYPES.DEFAULT,
  leftSidebarImageType: savedSettings?.leftSidebarImageType || LEFT_SIDEBAR_IMAGE_TYPES.NONE,
  preloader: savedSettings?.preloader || PERLOADER_TYPES.DISABLE,
  sidebarVisibilitytype: savedSettings?.sidebarVisibilitytype || SIDEBAR_VISIBILITY_TYPES.SHOW,
  customizer: savedSettings?.customizer || false
};

// Layout ayarlarını localStorage'a kaydet
const saveLayoutSettings = (state: LayoutState) => {
  try {
    localStorage.setItem('layoutSettings', JSON.stringify(state));
  } catch (error) {
    console.error('Error saving layout settings:', error);
  }
};

const LayoutSlice = createSlice({
  name: 'LayoutSlice',
  initialState,
  reducers: {
    changeLayoutAction: (state, action) => {
      state.layoutType = action.payload;
      saveLayoutSettings(state);
    },
    changeLayoutModeAction: (state, action) => {
      state.layoutModeType = action.payload;
      saveLayoutSettings(state);
    },
    changeSidebarThemeAction: (state, action) => {
      state.leftSidebarType = action.payload;
      saveLayoutSettings(state);
    },
    changeLayoutWidthAction: (state, action) => {
      state.layoutWidthType = action.payload;
      saveLayoutSettings(state);
    },
    changeLayoutPositionAction: (state, action) => {
      state.layoutPositionType = action.payload;
      saveLayoutSettings(state);
    },
    changeTopbarThemeAction: (state, action) => {
      state.topbarThemeType = action.payload;
      saveLayoutSettings(state);
    },
    changeLeftsidebarSizeTypeAction: (state, action) => {
      state.leftsidbarSizeType = action.payload;
      saveLayoutSettings(state);
    },
    changeLeftsidebarViewTypeAction: (state, action) => {
      state.leftSidebarViewType = action.payload;
      saveLayoutSettings(state);
    },
    changeSidebarImageTypeAction: (state, action) => {
      state.leftSidebarImageType = action.payload;
      saveLayoutSettings(state);
    },
    changePreLoaderAction: (state, action) => {
      state.preloader = action.payload;
      saveLayoutSettings(state);
    },
    changeSidebarVisibilityAction: (state, action) => {
      state.sidebarVisibilitytype = action.payload;
      saveLayoutSettings(state);
    },
    toggleCustomizer: (state) => {
      state.customizer = !state.customizer;
      saveLayoutSettings(state);
    },
    setCustomizer: (state, action) => {
      state.customizer = action.payload;
      saveLayoutSettings(state);
    }
  }
});

export const {
  changeLayoutAction,
  changeLayoutModeAction,
  changeSidebarThemeAction,
  changeLayoutWidthAction,
  changeLayoutPositionAction,
  changeTopbarThemeAction,
  changeLeftsidebarSizeTypeAction,
  changeLeftsidebarViewTypeAction,
  changeSidebarImageTypeAction,
  changePreLoaderAction,
  changeSidebarVisibilityAction,
  toggleCustomizer,
  setCustomizer
} = LayoutSlice.actions;

export default LayoutSlice.reducer;
