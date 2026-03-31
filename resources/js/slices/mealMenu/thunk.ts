import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import {
  getMenus,
  getMenuTypes,
  getMenuDetails,
  addNewMenu,
  deleteMenu,
  updateMenu
} from "./reducer";
import axios from "../../utils/axios";

// Get all meal menus
export const onGetMenus = (locationId: string = '') => async (dispatch: any) => {
  try {
    await axios.get('/sanctum/csrf-cookie');
    let url = '/api/meal-menu/menus';
    let params = {};
    
    if (locationId) {
      params = { location_id: locationId };
    }
    
    const response = await axios.get(url, { params });
    const data = Array.isArray(response.data) ? response.data : [];
    dispatch(getMenus(data));
    return data;
  } catch (error) {
    console.error("Error fetching meal menus:", error);
    toast.error("Failed to fetch meal menus", { autoClose: 3000 });
    dispatch(getMenus([]));
    return [];
  }
};

// Get all menu types
export const onGetMenuTypes = () => async (dispatch: any) => {
  try {
    const response = await axios.get('/api/meal-menu/types');
    dispatch(getMenuTypes(response.data));
    return response.data;
  } catch (error) {
    console.error("Error fetching menu types:", error);
    toast.error("Failed to fetch menu types", { autoClose: 3000 });
    return [];
  }
};

// Get menu details for a specific date
export const onGetMenuDetails = (date: string) => async (dispatch: any) => {
  try {
    const response = await axios.get('/api/meal-menu/details', {
      params: { date }
    });
    dispatch(getMenuDetails(response.data));
    return response.data;
  } catch (error) {
    console.error("Error fetching menu details:", error);
    if (error.response && error.response.status !== 404) {
      toast.error("Failed to fetch menu details", { autoClose: 3000 });
    }
    return null;
  }
};

// Add a new meal menu
export const onAddNewMenu = (data: any) => async (dispatch: any) => {
  try {
    const response = await axios.post('/api/meal-menu', data);
    if (response.data) {
      dispatch(addNewMenu(response.data));
      toast.success("Menu added successfully", { autoClose: 3000 });
      return response.data;
    }
    throw new Error("Invalid response from server");
  } catch (error) {
    console.error("Error adding menu:", error);
    toast.error("Failed to add menu", { autoClose: 3000 });
    return null;
  }
};

// Update an existing meal menu
export const onUpdateMenu = (data: any) => async (dispatch: any) => {
  try {
    if (!data || !data.id) {
      throw new Error("Invalid menu data");
    }
    
    const response = await axios.put(`/api/meal-menu/${data.id}`, data);
    if (response.data) {
      dispatch(updateMenu(response.data));
      toast.success("Menu updated successfully", { autoClose: 3000 });
      return response.data;
    }
    throw new Error("Invalid response from server");
  } catch (error) {
    console.error("Error updating menu:", error);
    toast.error("Failed to update menu: " + (error.message || 'Unknown error'), { autoClose: 3000 });
    return null;
  }
};

// Delete a meal menu
export const onDeleteMenu = (id: number) => async (dispatch: any) => {
  try {
    if (!id) {
      throw new Error("Invalid menu ID");
    }
    
    await axios.delete(`/api/meal-menu/${id}`);
    dispatch(deleteMenu(id));
    toast.success("Menu deleted successfully", { autoClose: 3000 });
    return true;
  } catch (error) {
    console.error("Error deleting menu:", error);
    toast.error("Failed to delete menu: " + (error.message || 'Unknown error'), { autoClose: 3000 });
    return false;
  }
};
