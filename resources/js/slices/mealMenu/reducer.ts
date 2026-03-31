import { createSlice } from "@reduxjs/toolkit";

interface MealMenuState {
  menus: any[];
  menuTypes: any[];
  locations: any[];
  selectedMenu: any | null;
  isMenuUpdated: boolean;
}

const initialState: MealMenuState = {
  menus: [],
  menuTypes: [],
  locations: [],
  selectedMenu: null,
  isMenuUpdated: false
};

const mealMenuSlice = createSlice({
  name: "mealMenu",
  initialState,
  reducers: {
    getMenus: (state, action) => {
      state.menus = Array.isArray(action.payload) ? action.payload : [];
      state.isMenuUpdated = false;
    },

    getMenuTypes: (state, action) => {
      if (action.payload && action.payload.menuTypes) {
        state.menuTypes = action.payload.menuTypes;
      }
      if (action.payload && action.payload.locations) {
        state.locations = action.payload.locations;
      }
    },

    getMenuDetails: (state, action) => {
      state.selectedMenu = action.payload;
    },

    addNewMenu: (state, action) => {
      if (!Array.isArray(state.menus)) {
        state.menus = [];
      }
      state.menus.push(action.payload);
      state.isMenuUpdated = true;
    },

    deleteMenu: (state, action) => {
      if (!Array.isArray(state.menus)) {
        state.menus = [];
        state.isMenuUpdated = true;
        return;
      }
      state.menus = state.menus.filter(
        (menu) => menu.id.toString() !== action.payload.toString()
      );
      state.isMenuUpdated = true;
    },

    updateMenu: (state, action) => {
      if (!Array.isArray(state.menus)) {
        state.menus = [action.payload];
        state.isMenuUpdated = true;
        return;
      }
      state.menus = state.menus.map((menu) =>
        menu.id.toString() === action.payload.id.toString()
          ? { ...menu, ...action.payload }
          : menu
      );
      state.isMenuUpdated = true;
    },

    clearSelectedMenu: (state) => {
      state.selectedMenu = null;
    }
  }
});

export const {
  getMenus,
  getMenuTypes,
  getMenuDetails,
  addNewMenu,
  deleteMenu,
  updateMenu,
  clearSelectedMenu
} = mealMenuSlice.actions;

export default mealMenuSlice.reducer;
