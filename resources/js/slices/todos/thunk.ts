
import i18next from 'i18next';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {addProject, addTodos, deleteTodos, editTodos, getTodoProject, getTodos} from './reducer'
// import { todoTaskList , todoCollapse } from "../../common/data";

export const GetData = () => async (dispatch: any) => {
  try {
      const response = await fetch('/api/todos');
      const data = await response.json();
      dispatch(getTodos(data));
  } catch (error) {
      toast.error(i18next.t("Error loading todos"), { autoClose: 3000 });
      return error;
  }
}

export const onAddNewTodo = (data : any) => async (dispatch: any) => {
  try {
      const token = document.querySelector('meta[name="csrf-token"]');
      if (!token) {
          throw new Error('CSRF token not found');
      }
      
      const response = await fetch('/api/todos', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'X-CSRF-TOKEN': token.getAttribute('content') || ''
          },
          credentials: 'same-origin',
          body: JSON.stringify(data)
      });
      
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to add todo');
      }
      
      const newTodo = await response.json();
      dispatch(addTodos(newTodo));
      toast.success(i18next.t("Todo Added Successfully"), { autoClose: 3000 });
  } catch (error: any) {
      toast.error(error.message || i18next.t("Todo Added Failed"), { autoClose: 3000 });
      return error;
  }
}

export const onDeleteTodo = (data : any) => async (dispatch: any) => {
  try {
      const token = document.querySelector('meta[name="csrf-token"]');
      if (!token) {
          throw new Error('CSRF token not found');
      }
      
      const response = await fetch(`/api/todos/${data}`, {
          method: 'DELETE',
          headers: {
              'Content-Type': 'application/json',
              'X-CSRF-TOKEN': token.getAttribute('content') || ''
          },
          credentials: 'same-origin'
      });
      
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete todo');
      }
      
      dispatch(deleteTodos(data));
      toast.success(i18next.t("Todo Delete Successfully"), { autoClose: 3000});
      
  } catch (error: any) {
      toast.error(error.message || i18next.t("Todo Delete Failed"), { autoClose: 3000});
      return error;
  }
}

export const onupdateTodo = (data : any) => async (dispatch: any) => {
  try {
      const token = document.querySelector('meta[name="csrf-token"]');
      if (!token) {
          throw new Error('CSRF token not found');
      }
      
      const response = await fetch(`/api/todos/${data.id}`, {
          method: 'PUT',
          headers: {
              'Content-Type': 'application/json',
              'X-CSRF-TOKEN': token.getAttribute('content') || ''
          },
          credentials: 'same-origin',
          body: JSON.stringify(data)
      });
      
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update todo');
      }
      
      const updatedTodo = await response.json();
      dispatch(editTodos(updatedTodo));
      toast.success(i18next.t("Todo Updated Successfully"), { autoClose: 3000 });
      
  } catch (error: any) {
      toast.error(error.message || i18next.t("Todo Updated Failed"), { autoClose: 3000 });
      return error;
  }
}

export const onGetProjects = () => async (dispatch: any) => {
  try {
      const response = await fetch('/api/todo-projects');
      const projects = await response.json();
      dispatch(getTodoProject(projects));
  } catch (error) {
      toast.error(i18next.t("Error loading projects"), { autoClose: 3000 });
      return error;
  }
}

export const onAddNewProject = (data : any) => async (dispatch: any) => {
  try {
      const token = document.querySelector('meta[name="csrf-token"]');
      if (!token) {
          throw new Error('CSRF token not found');
      }
      
      const response = await fetch('/api/todo-projects', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'X-CSRF-TOKEN': token.getAttribute('content') || ''
          },
          credentials: 'same-origin',
          body: JSON.stringify(data)
      });
      
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to add project');
      }
      
      const newProject = await response.json();
      dispatch(addProject(newProject));
      toast.success(i18next.t("Project Added Successfully"), { autoClose: 3000 });
  } catch (error: any) {
      toast.error(error.message || i18next.t("Project Added Failed"), { autoClose: 3000 });
      return error;
  }
}

// Görev detaylarını getir
export const getTodoDetails = (id: any) => async () => {
  try {
      const response = await fetch(`/api/todos/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch todo details');
      }
      return await response.json();
  } catch (error: any) {
      toast.error(error.message || i18next.t("Error loading todo details"), { autoClose: 3000 });
      throw error;
  }
}

// Dosya yükle
export const uploadAttachment = (todoId: any, file: any) => async () => {
  try {
      const token = document.querySelector('meta[name="csrf-token"]');
      if (!token) {
          throw new Error('CSRF token not found');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('_token', token.getAttribute('content') || '');
      
      const response = await fetch(`/api/todos/${todoId}/attachments`, {
          method: 'POST',
          headers: {
              'X-CSRF-TOKEN': token.getAttribute('content') || ''
              // Don't set Content-Type header when using FormData
              // 'Content-Type': 'multipart/form-data' 
          },
          body: formData,
          // Include credentials to ensure cookies are sent
          credentials: 'same-origin'
      });
      
      if (!response.ok) {
          // Try to parse error response as JSON, but handle HTML responses too
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Failed to upload file');
          } else {
              // Handle HTML responses or other non-JSON responses
              const errorText = await response.text();
              console.error('Server returned non-JSON response:', errorText);
              throw new Error('Server error occurred. Please try again later.');
          }
      }
      
      const data = await response.json();
      toast.success(i18next.t("File uploaded successfully"), { autoClose: 3000 });
      return data;
  } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || i18next.t("File upload failed"), { autoClose: 3000 });
      throw error;
  }
}

// Dosya sil
export const deleteAttachment = (attachmentId: any) => async () => {
  try {
      const token = document.querySelector('meta[name="csrf-token"]');
      if (!token) {
          throw new Error('CSRF token not found');
      }
      
      const response = await fetch(`/api/attachments/${attachmentId}`, {
          method: 'DELETE',
          headers: {
              'Content-Type': 'application/json',
              'X-CSRF-TOKEN': token.getAttribute('content') || ''
          },
          credentials: 'same-origin'
      });
      
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete file');
      }
      
      toast.success(i18next.t("File deleted successfully"), { autoClose: 3000 });
      return true;
  } catch (error: any) {
      toast.error(error.message || i18next.t("File deletion failed"), { autoClose: 3000 });
      throw error;
  }
}