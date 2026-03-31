import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { addNewFile, addNewFolder, deleteFile, deleteFolder, getFiles, getFolders, updateFile, updateFolder } from "./reducer";
import axios from 'axios';

// Get all folders
export const onGetFolders = () => async (dispatch: any) => {
  try {
    const response = await axios.get('/api/file-manager/folders');
    dispatch(getFolders(response.data));
  } catch (error) {
    console.error('Error fetching folders:', error);
    toast.error("Failed to load folders", { autoClose: 3000 });
    return error;
  }
}

// Get all files
export const onGetFiles = () => async (dispatch: any) => {
  try {
    const response = await axios.get('/api/file-manager/files');
    dispatch(getFiles(response.data));
  } catch (error) {
    console.error('Error fetching files:', error);
    toast.error("Failed to load files", { autoClose: 3000 });
    return error;
  }
}

// Add new folder
export const onAddNewFolder = (data: any) => async (dispatch: any) => {
  try {
    const response = await axios.post('/api/file-manager/folder', data);
    dispatch(addNewFolder(response.data));
    toast.success("Folder Added Successfully", { autoClose: 3000 });
  } catch (error) {
    console.error('Error adding folder:', error);
    toast.error("Folder Added Failed", { autoClose: 3000 });
    return error;
  }
}

// Add new file
export const onAddNewFile = (data: any) => async (dispatch: any) => {
  try {
    const response = await axios.post('/api/file-manager/file', data);
    dispatch(addNewFile(response.data));
    toast.success("File Added Successfully", { autoClose: 3000 });
  } catch (error) {
    console.error('Error adding file:', error);
    toast.error("File Added Failed", { autoClose: 3000 });
    return error;
  }
}

// Delete folder
export const onDeleteFolder = (id: any) => async (dispatch: any) => {
  try {
    await axios.delete(`/api/file-manager/folder/${id}`);
    dispatch(deleteFolder(id));
    toast.success("Folder Deleted Successfully", { autoClose: 3000 });
  } catch (error) {
    console.error('Error deleting folder:', error);
    toast.error("Folder Deletion Failed", { autoClose: 3000 });
    return error;
  }
}

// Delete file
export const onDeleteFile = (id: any) => async (dispatch: any) => {
  try {
    await axios.delete(`/api/file-manager/file/${id}`);
    dispatch(deleteFile(id));
    toast.success("File Deleted Successfully", { autoClose: 3000 });
  } catch (error) {
    console.error('Error deleting file:', error);
    toast.error("File Deletion Failed", { autoClose: 3000 });
    return error;
  }
}

// Update folder
export const onupdateFolder = (data: any) => async (dispatch: any) => {
  try {
    const response = await axios.put('/api/file-manager/folder', data);
    dispatch(updateFolder(response.data));
    toast.success("Folder Updated Successfully", { autoClose: 3000 });
  } catch (error) {
    console.error('Error updating folder:', error);
    toast.error("Folder Update Failed", { autoClose: 3000 });
    return error;
  }
}

// Update file
export const onupdateFile = (data: any) => async (dispatch: any) => {
  try {
    const response = await axios.put('/api/file-manager/file', data);
    dispatch(updateFile(response.data));
    toast.success("File Updated Successfully", { autoClose: 3000 });
  } catch (error) {
    console.error('Error updating file:', error);
    toast.error("File Update Failed", { autoClose: 3000 });
    return error;
  }
}

// Upload a file
export const onUploadFile = (formData: FormData) => async (dispatch: any) => {
  try {
    const response = await axios.post('/api/file-manager/file/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    dispatch(addNewFile(response.data.file));
    toast.success("File Uploaded Successfully", { autoClose: 3000 });
    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    toast.error("File Upload Failed", { autoClose: 3000 });
    return error;
  }
}

// Get storage statistics
export const onGetStorageStats = async () => {
  try {
    const response = await axios.get('/api/file-manager/storage-stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching storage stats:', error);
    toast.error("Failed to load storage statistics", { autoClose: 3000 });
    return null;
  }
}